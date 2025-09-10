#!/usr/bin/env node

const WebSocket = require('ws');
const inquirer = require('inquirer');
const chalk = require('chalk');
const readline = require('readline');

class ChatCLI {
    constructor() {
        this.ws = null;
        this.nickname = null;
        this.roomCode = null;
        this.isConnected = false;
        this.rl = null;
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
        
        if (isOwnMessage) {
            console.log(chalk.gray(`[${time}] `) + chalk.blue.bold(`You: `) + message.message);
        } else {
            console.log(chalk.gray(`[${time}] `) + chalk.green.bold(`${message.nickname}: `) + message.message);
        }
        
        // Redisplay input prompt if in chat mode
        if (this.rl) {
            this.rl.prompt();
        }
    }

    displaySystemMessage(text) {
        console.log(chalk.yellow(`🔔 ${text}`));
        if (this.rl) {
            this.rl.prompt();
        }
    }

    startChatInterface() {
        console.log(chalk.cyan('💬 You are now in the chat! Type your messages and press Enter.'));
        console.log(chalk.gray('Commands: "/quit" to leave\n'));
        console.log(chalk.gray('Commands: "/room" to show current room code\n'));

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.blue('> ')
        });

        this.rl.prompt();

        this.rl.on('line', (input) => {
            const message = input.trim();
            
            if (message === '/quit') {
                console.log(chalk.yellow('👋 Leaving the room...'));
                this.rl.close();
                this.ws.close();
                process.exit(0);
                return;
            }
            
            if (message === '/room') {
                console.log(chalk.cyan.bold(`📋 Current Room Code: ${this.roomCode || 'Not in any room'}`));
                this.rl.prompt();
                return;
            }
            
            if (message === '') {
                this.rl.prompt();
                return;
            }

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'send_message',
                    roomCode: this.roomCode,
                    message: message
                }));
            }
            
            this.rl.prompt();
        });

        this.rl.on('close', () => {
            if (this.ws) {
                this.ws.close();
            }
            process.exit(0);
        });
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Goodbye!'));
    process.exit(0);
});

// Start the CLI
const cli = new ChatCLI();
cli.start();