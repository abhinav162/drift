const chalk = require('chalk');

class InputHandler {
    constructor(chatClient, display, games, emoji) {
        this.chatClient = chatClient;
        this.display = display;
        this.games = games;
        this.emoji = emoji;
        this.currentInput = '';
        this.cursorPosition = 0;
        this.inputBoxActive = false;
    }

    setupInputBox() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        this.inputBoxActive = true;
        this.currentInput = '';
        this.cursorPosition = 0;
        
        this.display.redrawInputBox(this.currentInput, this.cursorPosition);
        
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
        
        this.display.clearInputBox();
        
        if (message === '/quit') {
            console.log(chalk.yellow('👋 Leaving the room...'));
            this.cleanup();
            process.exit(0);
            return;
        }
        
        if (message === '/room') {
            console.log(chalk.cyan.bold(`📋 Current Room Code: ${this.chatClient.roomCode || 'Not in any room'}`));
            this.resetInput();
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
            return;
        }

        if (message === '/help') {
            const gameCommands = this.games.getAvailableCommands();
            const emojiCommands = [{ command: '/emojis', description: 'Show emoji shortcuts' }];
            this.display.showHelpMessage([...gameCommands, ...emojiCommands]);
            this.resetInput();
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
            return;
        }

        if (message === '/trivia') {
            const trivia = this.games.getRandomTrivia();
            this.display.showGameContent(trivia);
            this.resetInput();
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
            return;
        }

        if (message === '/fortune') {
            const fortune = this.games.getRandomFortune();
            this.display.showGameContent(fortune);
            this.resetInput();
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
            return;
        }

        if (message === '/art') {
            const art = this.games.getRandomArt();
            this.display.showGameContent(art);
            this.resetInput();
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
            return;
        }

        if (message === '/emojis') {
            this.showEmojiHelp();
            this.resetInput();
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
            return;
        }
        
        if (message !== '') {
            // Convert emoji shortcuts before sending
            const messageWithEmojis = this.emoji.convertEmojis(message);
            this.chatClient.sendMessage(messageWithEmojis);
        }
        
        this.resetInput();
        this.display.redrawInputBox(this.currentInput, this.cursorPosition);
    }

    handleBackspace() {
        if (this.cursorPosition > 0) {
            this.currentInput = this.currentInput.slice(0, this.cursorPosition - 1) + this.currentInput.slice(this.cursorPosition);
            this.cursorPosition--;
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
        }
    }

    handleLeftArrow() {
        if (this.cursorPosition > 0) {
            this.cursorPosition--;
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
        }
    }

    handleRightArrow() {
        if (this.cursorPosition < this.currentInput.length) {
            this.cursorPosition++;
            this.display.redrawInputBox(this.currentInput, this.cursorPosition);
        }
    }

    handleCharacter(char) {
        this.currentInput = this.currentInput.slice(0, this.cursorPosition) + char + this.currentInput.slice(this.cursorPosition);
        this.cursorPosition++;
        this.display.redrawInputBox(this.currentInput, this.cursorPosition);
    }

    resetInput() {
        this.currentInput = '';
        this.cursorPosition = 0;
    }

    showEmojiHelp() {
        if (this.inputBoxActive) {
            this.display.clearInputBox();
        }
        
        const categories = this.emoji.getEmojiHelp();
        
        console.log(chalk.yellow('😊 EMOJI SHORTCUTS:'));
        Object.keys(categories).forEach(category => {
            console.log(chalk.cyan(`\n${category}:`));
            categories[category].forEach(shortcut => {
                const emoji = this.emoji.emojiMap[shortcut];
                console.log(chalk.gray(`  ${shortcut.padEnd(12)} → ${emoji}`));
            });
        });
        console.log(chalk.gray('\nType emoji shortcuts in your messages to convert them!'));
        console.log(chalk.gray('Example: "Hello :) How are you? :thumbsup:"'));
    }


    cleanup() {
        if (this.inputBoxActive) {
            this.display.clearInputBox();
            this.inputBoxActive = false;
        }
        
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.pause();
        }
    }
}

module.exports = InputHandler;