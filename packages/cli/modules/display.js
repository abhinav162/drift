const chalk = require('chalk');

class Display {
    constructor() {
        this.inputBoxActive = false;
        this.suggestionsActive = false;
        this.suggestionLines = 0;
        this.redrawCallback = null;
    }

    displayBanner() {
        console.log(chalk.magentaBright(`
    ██████╗ ██████╗ ██╗███████╗████████╗
    ██╔══██╗██╔══██╗██║██╔════╝╚══██╔══╝
    ██║  ██║██████╔╝██║█████╗     ██║
    ██║  ██║██╔══██╗██║██╔══╝     ██║
    ██████╔╝██║  ██║██║██║        ██║
    ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝
        `));
        console.log(chalk.blue.bold('           🚀 CLI'));
        console.log(chalk.gray('    Connect to chat rooms from your terminal!\n'));
    }

    showChatIntro() {
        console.log(chalk.cyan('💬 You are now in the chat!! Type your messages and press Enter.'));
        console.log(chalk.gray('Commands: "/quit" to leave'));
        console.log(chalk.gray('Commands: "/room" for room code'));
        console.log(chalk.gray('Commands: "/help" for help'));


        console.log(
            chalk.yellow.bold('\n✨ ~~~ ') +
            chalk.cyanBright.underline.bold(' P A S T I M E ') +
            chalk.yellow.bold(' ~~~ ✨\n')
        );

        console.log(chalk.gray('👉 ') + chalk.greenBright('/trivia') + chalk.white(' → Random trivias 🧠'));
        console.log(chalk.gray('👉 ') + chalk.blueBright('/fortune') + chalk.white(' → Quirky quotes 🍀'));
        console.log(chalk.gray('👉 ') + chalk.magentaBright('/art') + chalk.white(' → Fun ASCII art 🎨'));
        
        console.log(chalk.gray('\nOther Features:'));
        console.log(chalk.gray('👉 ') + chalk.yellowBright('/emojis') + chalk.white(' → Show emoji shortcuts 😊'));
        console.log(chalk.gray('👉 ') + chalk.gray('Type ":" for emoji suggestions (↑↓ to navigate, Tab to select)'));
        console.log(chalk.gray('👉 ') + chalk.gray('Use :) :D :heart: etc in messages for emojis!'));
    }

    displayMessage(message, currentNickname) {
        const time = new Date(message.timestamp).toLocaleTimeString();
        const isOwnMessage = message.nickname === currentNickname;

        // Clear input and suggestions if active
        const wasInputActive = this.inputBoxActive;
        
        if (this.inputBoxActive) {
            this.clearInputBox();
        }
        if (this.suggestionsActive) {
            this.clearEmojiSuggestions();
        }

        if (isOwnMessage) {
            console.log(chalk.gray(`[${time}] `) + chalk.blue.bold(`You: `) + message.message);
        } else {
            console.log(chalk.gray(`[${time}] `) + chalk.green.bold(`${message.nickname}: `) + message.message);
        }

        // Restore input if it was active and we have a redraw callback
        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    displaySystemMessage(text) {
        // Clear input and suggestions if active
        const wasInputActive = this.inputBoxActive;
        
        if (this.inputBoxActive) {
            this.clearInputBox();
        }
        if (this.suggestionsActive) {
            this.clearEmojiSuggestions();
        }

        console.log(chalk.yellow(`🔔 ${text}`));

        // Restore input if it was active and we have a redraw callback
        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    showHelpMessage(gameCommands) {
        // Clear input and suggestions if active
        const wasInputActive = this.inputBoxActive;
        
        if (this.inputBoxActive) {
            this.clearInputBox();
        }
        if (this.suggestionsActive) {
            this.clearEmojiSuggestions();
        }

        console.log(chalk.yellow('🎮 P A S T I M E:'));
        gameCommands.forEach(cmd => {
            console.log(chalk.gray(`  ${cmd.command.padEnd(10)} - ${cmd.description}`));
        });
        console.log(chalk.gray('  /help      - Show this help'));
        console.log(chalk.gray('  /room      - Show room code'));
        console.log(chalk.gray('  /quit      - Leave the room'));
        
        // Restore input if it was active and we have a redraw callback
        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    showGameContent(gameData) {
        // Clear input and suggestions if active
        const wasInputActive = this.inputBoxActive;
        
        if (this.inputBoxActive) {
            this.clearInputBox();
        }
        if (this.suggestionsActive) {
            this.clearEmojiSuggestions();
        }

        console.log(gameData.header);
        gameData.content.forEach(line => {
            console.log(line);
        });
        
        // Restore input if it was active and we have a redraw callback
        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    clearInputBox() {
        if (!this.inputBoxActive) return;

        // Move to input line and clear it
        process.stdout.write('\u001b[2K'); // Clear entire line
        process.stdout.write('\u001b[1G'); // Move to beginning of line
    }

    redrawInputBox(currentInput, cursorPosition) {
        if (!this.inputBoxActive) {
            this.inputBoxActive = true;
        }

        // Clear the line and redraw
        this.clearInputBox();

        const prompt = chalk.blue('> ');
        const displayText = currentInput;

        process.stdout.write(prompt + displayText);

        // Position cursor correctly
        const totalPromptLength = 2; // '> ' length without ANSI codes
        const targetPosition = totalPromptLength + cursorPosition;

        // Move cursor to correct position
        process.stdout.write('\u001b[1G'); // Go to start of line
        process.stdout.write(`\u001b[${targetPosition + 1}G`); // Move to target position
    }

    setInputBoxActive(active) {
        this.inputBoxActive = active;
    }

    setRedrawCallback(callback) {
        this.redrawCallback = callback;
    }

    displayEmojiSuggestions(suggestions, selectedIndex = 0) {
        if (!suggestions || suggestions.length === 0) {
            this.clearEmojiSuggestions();
            return;
        }

        // Clear previous suggestions first
        this.clearEmojiSuggestions();

        // Move cursor to next line for suggestions
        process.stdout.write('\n');

        suggestions.forEach((suggestion, index) => {
            const isSelected = index === selectedIndex;
            const prefix = isSelected ? chalk.bgBlue.white(' ► ') : '   ';
            const emoji = chalk.yellow(suggestion.emoji);
            const shortcut = chalk.gray(suggestion.shortcut);
            const description = chalk.dim(suggestion.description);
            
            process.stdout.write(prefix + emoji + ' ' + shortcut + ' ' + description + '\n');
        });

        this.suggestionsActive = true;
        this.suggestionLines = suggestions.length;

        // Move cursor back to input line
        process.stdout.write(`\u001b[${suggestions.length + 1}A`); // Move up by number of suggestion lines + 1
    }

    clearEmojiSuggestions() {
        if (!this.suggestionsActive || this.suggestionLines === 0) {
            return;
        }

        // Save current cursor position
        process.stdout.write('\u001b[s');

        // Move to start of suggestions and clear them
        process.stdout.write('\n'); // Go to next line (where suggestions start)
        for (let i = 0; i < this.suggestionLines; i++) {
            process.stdout.write('\u001b[2K'); // Clear entire line
            if (i < this.suggestionLines - 1) {
                process.stdout.write('\u001b[1B'); // Move down one line
            }
        }

        // Move back to input line
        process.stdout.write(`\u001b[${this.suggestionLines}A`); // Move up by number of suggestion lines

        this.suggestionsActive = false;
        this.suggestionLines = 0;
    }

    updateSelectedSuggestion(suggestions, selectedIndex) {
        if (!this.suggestionsActive || !suggestions || suggestions.length === 0) {
            return;
        }

        // Move to suggestion area and redraw
        process.stdout.write('\n');
        
        suggestions.forEach((suggestion, index) => {
            const isSelected = index === selectedIndex;
            const prefix = isSelected ? chalk.bgBlue.white(' ► ') : '   ';
            const emoji = chalk.yellow(suggestion.emoji);
            const shortcut = chalk.gray(suggestion.shortcut);
            const description = chalk.dim(suggestion.description);
            
            // Clear line and redraw
            process.stdout.write('\u001b[2K'); // Clear entire line
            process.stdout.write('\u001b[1G'); // Move to beginning of line
            process.stdout.write(prefix + emoji + ' ' + shortcut + ' ' + description);
            
            if (index < suggestions.length - 1) {
                process.stdout.write('\n');
            }
        });

        // Move cursor back to input line
        process.stdout.write(`\u001b[${suggestions.length}A`); // Move up by number of suggestion lines
    }
}

module.exports = Display;