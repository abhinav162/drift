#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const packageJson = require('./package.json');

// Import modules
const Games = require('./modules/games');
const Display = require('./modules/display');
const ChatClient = require('./modules/chat-client');
const InputHandler = require('./modules/input-handler');
const Emoji = require('./modules/emoji');
const VersionChecker = require('./modules/version-checker');
const SnakeClient = require('./modules/snake-client');

class ChatCLI {
    constructor() {
        // Initialize modules
        this.display = new Display();
        this.games = new Games();
        this.emoji = new Emoji();
        this.chatClient = new ChatClient(this.display);
        this.inputHandler = new InputHandler(this.chatClient, this.display, this.games, this.emoji);
        this.versionChecker = new VersionChecker(packageJson.name, packageJson.version);
        
        // Track if we're in chat mode
        this.inChatMode = false;
    }

    async start() {
        this.display.displayBanner();
        
        // Check for updates (non-blocking)
        await this.versionChecker.checkForUpdates();

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
                    { name: '🐍 Play Snake (2–6 players)', value: 'snake' },
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
            case 'snake':
                await this.playSnake();
                break;
            case 'exit':
                console.log(chalk.yellow('Goodbye! 👋'));
                process.exit(0);
        }
    }

    async playSnake() {
        const { snakeAction } = await inquirer.prompt([{
            type: 'list',
            name: 'snakeAction',
            message: 'Snake:',
            choices: [
                { name: '🆕 Create a new game', value: 'create' },
                { name: '🚪 Join an existing game', value: 'join' },
                { name: '← Back',                  value: 'back'  },
            ],
        }]);

        if (snakeAction === 'back') return this.showMainMenu();

        const nickname = await this.getNickname();

        let roomCode = null;
        if (snakeAction === 'join') {
            const ans = await inquirer.prompt([{
                type: 'input',
                name: 'roomCode',
                message: 'Enter game code:',
                validate: (v) => v.trim() ? true : 'Code cannot be empty',
            }]);
            roomCode = ans.roomCode.trim().toUpperCase();
        }

        console.log(chalk.yellow('🔌 Connecting to server…'));

        const snake = new SnakeClient();
        snake.nickname = nickname;
        snake.onReturnToMenu = () => {
            console.log(chalk.yellow('\nReturning to menu…\n'));
            this.showMainMenu();
        };

        try {
            await snake.connect();
        } catch (err) {
            console.error(chalk.red(err.message));
            return this.showMainMenu();
        }

        if (snakeAction === 'create') {
            snake.createRoom();
        } else {
            snake.joinRoom(roomCode);
        }

        snake.setupInput();
    }

    async getNickname() {
        const { nickname } = await inquirer.prompt([
            {
                type: 'input',
                name: 'nickname',
                message: 'Enter your nickname:',
                validate: (input) => {
                    if (!input.trim()) return 'Nickname cannot be empty';
                    if (input.length > 50) return 'Nickname must be 20 characters or less';
                    return true;
                }
            }
        ]);
        return nickname.trim();
    }

    async createRoom() {
        const nickname = await this.getNickname();
        this.chatClient.nickname = nickname;
        console.log(chalk.yellow('🔌 Connecting to server...'));
        
        try {
            await this.chatClient.connectToServer();
            this.chatClient.createRoom();
            this.waitForRoomJoin();
        } catch (error) {
            console.error(chalk.red(error.message));
            await this.showMainMenu();
        }
    }

    async joinRoom() {
        const nickname = await this.getNickname();
        
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
            await this.chatClient.connectToServer();
            this.chatClient.joinRoom(roomCode, nickname);
            this.waitForRoomJoin();
        } catch (error) {
            console.error(chalk.red(error.message));
            await this.showMainMenu();
        }
    }

    waitForRoomJoin() {
        // Override the message handler to detect when we join a room
        const originalHandleMessage = this.chatClient.handleMessage.bind(this.chatClient);
        
        this.chatClient.handleMessage = (message) => {
            const result = originalHandleMessage(message);
            
            if (message.type === 'joined_room') {
                this.startChatInterface();
            } else if (message.type === 'error') {
                setTimeout(() => this.showMainMenu(), 1000);
            }
        };
    }

    startChatInterface() {
        this.inChatMode = true;
        this.display.showChatIntro();
        this.inputHandler.setupInputBox();
    }

    cleanup() {
        this.inputHandler.cleanup();
        this.chatClient.close();
        this.display.setInputBoxActive(false);
    }
}

// Create CLI instance
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

// Start the CLI
cli.start();