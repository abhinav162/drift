#!/usr/bin/env node

const WebSocket = require('ws');
const inquirer = require('inquirer');
const chalk = require('chalk');
const readline = require('readline');
const { cursorTo, clearLine, moveCursor } = require('readline');

class ChatCLI {
    constructor() {
        this.ws = null;
        this.nickname = null;
        this.roomCode = null;
        this.isConnected = false;
        this.rl = null;
        this.currentInput = '';
        this.cursorPosition = 0;
        this.inputBoxActive = false;
        this.inputBoxRow = 0;
    }

    async start() {
        console.log(chalk.blue.bold('\n🚀 Drift Chat CLI'));
        console.log(chalk.gray('Connect to chat rooms from your terminal!\n'));

        try {
            await this.showMainMenu();
        } catch (error) {
            console.error(chalk.red('Error:', error.message));
            process.exit(1);
        }
    }

    async showMainMenu() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '🆕 Create a new chat room', value: 'create' },
                    { name: '🚪 Join an existing room', value: 'join' },
                    { name: '❌ Exit', value: 'exit' }
                ]
            }
        ]);

        switch (action) {
            case 'create':
                await this.createRoom();
                break;
            case 'join':
                await this.joinRoom();
                break;
            case 'exit':
                console.log(chalk.yellow('Goodbye! 👋'));
                process.exit(0);
        }
    }

    async getNickname() {
        const { nickname } = await inquirer.prompt([
            {
                type: 'input',
                name: 'nickname',
                message: 'Enter your nickname:',
                validate: (input) => {
                    if (!input.trim()) return 'Nickname cannot be empty';
                    if (input.length > 20) return 'Nickname must be 20 characters or less';
                    return true;
                }
            }
        ]);
        this.nickname = nickname.trim();
    }

    async connectToServer() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket('wss://drift.gftrilo.store');
            
            this.ws.on('open', () => {
                this.isConnected = true;
                resolve();
            });

            this.ws.on('error', (error) => {
                reject(new Error('Failed to connect to drift.gftrilo.store. Please check your internet connection.'));
            });

            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });

            this.ws.on('close', () => {
                if (this.isConnected) {
                    console.log(chalk.red('\n💔 Connection lost. Exiting...'));
                    if (this.rl) this.rl.close();
                    process.exit(0);
                }
            });
        });
    }

    async createRoom() {
        await this.getNickname();
        console.log(chalk.yellow('🔌 Connecting to server...'));
        
        try {
            await this.connectToServer();
            this.ws.send(JSON.stringify({ type: 'create_room' }));
        } catch (error) {
            console.error(chalk.red(error.message));
            await this.showMainMenu();
        }
    }

    async joinRoom() {
        await this.getNickname();
        
        const { roomCode } = await inquirer.prompt([
            {
                type: 'input',
                name: 'roomCode',
                message: 'Enter room code:',
                validate: (input) => {
                    if (!input.trim()) return 'Room code cannot be empty';
                    return true;
                }
            }
        ]);

        console.log(chalk.yellow('🔌 Connecting to server...'));
        
        try {
            await this.connectToServer();
            this.ws.send(JSON.stringify({
                type: 'join_room',
                roomCode: roomCode.toUpperCase(),
                nickname: this.nickname
            }));
        } catch (error) {
            console.error(chalk.red(error.message));
            await this.showMainMenu();
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'room_created':
                this.roomCode = message.roomCode;
                console.log(chalk.green.bold(`\n✅ Room created successfully!`));
                console.log(chalk.cyan(`📋 Room Code: ${message.roomCode}`));
                console.log(chalk.gray('Share this code with others to invite them.\n'));
                
                // Auto-join the created room
                this.ws.send(JSON.stringify({
                    type: 'join_room',
                    roomCode: message.roomCode,
                    nickname: this.nickname
                }));
                break;

            case 'joined_room':
                this.roomCode = message.roomCode;
                console.log(chalk.green.bold(`\n🎉 Joined room ${message.roomCode}!`));
                
                // Display previous messages
                if (message.messages && message.messages.length > 0) {
                    console.log(chalk.gray('\n--- Previous Messages ---'));
                    message.messages.forEach(msg => {
                        this.displayMessage(msg);
                    });
                    console.log(chalk.gray('--- End of Previous Messages ---\n'));
                }
                
                this.startChatInterface();
                break;

            case 'message':
                this.displayMessage(message);
                break;

            case 'user_joined':
                if (message.nickname !== this.nickname) {
                    this.displaySystemMessage(`${message.nickname} joined the room`);
                }
                break;

            case 'user_left':
                this.displaySystemMessage(`${message.nickname} left the room`);
                break;

            case 'error':
                console.error(chalk.red(`❌ Error: ${message.message}`));
                if (this.rl) this.rl.close();
                setTimeout(() => this.showMainMenu(), 1000);
                break;
        }
    }

    displayMessage(message) {
        const time = new Date(message.timestamp).toLocaleTimeString();
        const isOwnMessage = message.nickname === this.nickname;
        
        if (this.inputBoxActive) {
            this.clearInputBox();
        }
        
        if (isOwnMessage) {
            console.log(chalk.gray(`[${time}] `) + chalk.blue.bold(`You: `) + message.message);
        } else {
            console.log(chalk.gray(`[${time}] `) + chalk.green.bold(`${message.nickname}: `) + message.message);
        }
        
        if (this.inputBoxActive) {
            this.redrawInputBox();
        }
    }

    displaySystemMessage(text) {
        if (this.inputBoxActive) {
            this.clearInputBox();
        }
        
        console.log(chalk.yellow(`🔔 ${text}`));
        
        if (this.inputBoxActive) {
            this.redrawInputBox();
        }
    }

    startChatInterface() {
        console.log(chalk.cyan('💬 You are now in the chat!! Type your messages and press Enter.'));
        console.log(chalk.gray('Commands: "/quit" to leave'));
        console.log(chalk.gray('Commands: "/room" to show current room code\n'));

        this.setupInputBox();
    }

    setupInputBox() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        this.inputBoxActive = true;
        this.currentInput = '';
        this.cursorPosition = 0;
        
        this.redrawInputBox();
        
        process.stdin.on('data', (key) => {
            this.handleKeypress(key);
        });
    }

    handleKeypress(key) {
        const keyCode = key.charCodeAt(0);
        
        // Handle Ctrl+C
        if (keyCode === 3) {
            this.cleanup();
            console.log(chalk.yellow('\n👋 Goodbye!'));
            process.exit(0);
        }
        
        // Handle Enter
        if (keyCode === 13) {
            this.handleEnter();
            return;
        }
        
        // Handle Backspace
        if (keyCode === 127 || keyCode === 8) {
            this.handleBackspace();
            return;
        }
        
        // Handle Left Arrow (ESC[D)
        if (key === '\u001b[D') {
            this.handleLeftArrow();
            return;
        }
        
        // Handle Right Arrow (ESC[C)
        if (key === '\u001b[C') {
            this.handleRightArrow();
            return;
        }
        
        // Handle regular characters
        if (keyCode >= 32 && keyCode <= 126) {
            this.handleCharacter(key);
        }
    }

    handleEnter() {
        const message = this.currentInput.trim();
        
        this.clearInputBox();
        
        if (message === '/quit') {
            console.log(chalk.yellow('👋 Leaving the room...'));
            this.cleanup();
            process.exit(0);
            return;
        }
        
        if (message === '/room') {
            console.log(chalk.cyan.bold(`📋 Current Room Code: ${this.roomCode || 'Not in any room'}`));
            this.resetInput();
            this.redrawInputBox();
            return;
        }
        
        if (message !== '') {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'send_message',
                    roomCode: this.roomCode,
                    message: message
                }));
            }
        }
        
        this.resetInput();
        this.redrawInputBox();
    }

    handleBackspace() {
        if (this.cursorPosition > 0) {
            this.currentInput = this.currentInput.slice(0, this.cursorPosition - 1) + this.currentInput.slice(this.cursorPosition);
            this.cursorPosition--;
            this.redrawInputBox();
        }
    }

    handleLeftArrow() {
        if (this.cursorPosition > 0) {
            this.cursorPosition--;
            this.redrawInputBox();
        }
    }

    handleRightArrow() {
        if (this.cursorPosition < this.currentInput.length) {
            this.cursorPosition++;
            this.redrawInputBox();
        }
    }

    handleCharacter(char) {
        this.currentInput = this.currentInput.slice(0, this.cursorPosition) + char + this.currentInput.slice(this.cursorPosition);
        this.cursorPosition++;
        this.redrawInputBox();
    }

    resetInput() {
        this.currentInput = '';
        this.cursorPosition = 0;
    }

    clearInputBox() {
        if (!this.inputBoxActive) return;
        
        // Move to input line and clear it
        process.stdout.write('\u001b[2K'); // Clear entire line
        process.stdout.write('\u001b[1G'); // Move to beginning of line
    }

    redrawInputBox() {
        if (!this.inputBoxActive) return;
        
        // Clear the line and redraw
        this.clearInputBox();
        
        const prompt = chalk.blue('> ');
        const displayText = this.currentInput;
        
        process.stdout.write(prompt + displayText);
        
        // Position cursor correctly
        const totalPromptLength = 2; // '> ' length without ANSI codes
        const targetPosition = totalPromptLength + this.cursorPosition;
        
        // Move cursor to correct position
        process.stdout.write('\u001b[1G'); // Go to start of line
        process.stdout.write(`\u001b[${targetPosition + 1}G`); // Move to target position
    }

    cleanup() {
        if (this.inputBoxActive) {
            this.clearInputBox();
            this.inputBoxActive = false;
        }
        
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.pause();
        }
        
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Start the CLI
const cli = new ChatCLI();

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    cli.cleanup();
    console.log(chalk.yellow('\n👋 Goodbye!'));
    process.exit(0);
});

// Handle other exit signals
process.on('SIGTERM', () => {
    cli.cleanup();
    process.exit(0);
});

process.on('exit', () => {
    cli.cleanup();
});

cli.start();