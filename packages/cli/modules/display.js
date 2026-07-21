const chalk = require('chalk');

class Display {
    constructor() {
        this.inputBoxActive = false;
        this.suggestionsActive = false;
        this.suggestionLines = 0;
        this.redrawCallback = null;
        this.incognito = false;
        this.incognitoMode = null;
        this.hideMessages = false;
        this.seederActive = false;
        this._timeline = [];
        this._seedTimer = null;
    }

    _pushTimeline(kind, line) {
        this._timeline.push({ kind, line });
        if (this._timeline.length > 200) this._timeline.shift();
    }

    toggleHide() {
        this.hideMessages = !this.hideMessages;
        process.stdout.write('\x1Bc');
        const filter = this.hideMessages ? e => e.kind === 'seed' : () => true;
        this._timeline.filter(filter).forEach(e => console.log(e.line));
        if (this.redrawCallback) this.redrawCallback();
    }

    boot(text) {
        if (this.incognitoMode) return this.incognitoMode.formatBoot(text);
        return text;
    }

    logLine(level, mod, text) {
        if (this.incognitoMode) return this.incognitoMode.formatError(text);
        return text;
    }

    startSeeder() {
        this.seederActive = true;
        this._scheduleSeed();
    }

    stopSeeder() {
        this.seederActive = false;
        if (this._seedTimer) clearTimeout(this._seedTimer);
    }

    _scheduleSeed() {
        if (!this.seederActive) return;
        const delay = 1500 + Math.random() * 5000;
        this._seedTimer = setTimeout(() => this._seedTick(), delay);
    }

    _seedTick() {
        if (!this.seederActive || !this.incognitoMode) return;
        const wasInputActive = this.inputBoxActive;
        if (this.inputBoxActive) this.clearInputBox();

        const line = this.incognitoMode.seedLine();
        this._pushTimeline('seed', line);
        console.log(line);

        if (wasInputActive && this.redrawCallback) this.redrawCallback();
        this._scheduleSeed();
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
        if (this.incognito && this.incognitoMode) {
            const line = this.incognitoMode.formatMessage(message.nickname, message.message, message.timestamp);
            this._pushTimeline('real', line);
            if (this.hideMessages) return;
            const wasInputActive = this.inputBoxActive;
            if (this.inputBoxActive) this.clearInputBox();
            console.log(line);
            if (wasInputActive && this.redrawCallback) this.redrawCallback();
            return;
        }

        const time = new Date(message.timestamp).toLocaleTimeString();
        const isOwnMessage = message.nickname === currentNickname;

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

        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    displaySystemMessage(text) {
        if (this.incognito && this.incognitoMode) {
            const line = this.incognitoMode.formatSystem(text);
            this._pushTimeline('real', line);
            if (this.hideMessages) return;
            const wasInputActive = this.inputBoxActive;
            if (this.inputBoxActive) this.clearInputBox();
            if (this.suggestionsActive) this.clearEmojiSuggestions();
            console.log(line);
            if (wasInputActive && this.redrawCallback) this.redrawCallback();
            return;
        }

        const wasInputActive = this.inputBoxActive;

        if (this.inputBoxActive) {
            this.clearInputBox();
        }
        if (this.suggestionsActive) {
            this.clearEmojiSuggestions();
        }

        console.log(chalk.yellow(`🔔 ${text}`));

        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    showHelpMessage(gameCommands) {
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

        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    showGameContent(gameData) {
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

        if (wasInputActive && this.redrawCallback) {
            this.redrawCallback();
        }
    }

    clearInputBox() {
        if (!this.inputBoxActive) return;
        process.stdout.write('[2K');
        process.stdout.write('[1G');
    }

    redrawInputBox(currentInput, cursorPosition) {
        if (!this.inputBoxActive) {
            this.inputBoxActive = true;
        }

        this.clearInputBox();

        const prompt = (this.incognito && this.incognitoMode) ? this.incognitoMode.prompt : chalk.blue('> ');
        const displayText = currentInput;

        process.stdout.write(prompt + displayText);

        const totalPromptLength = 2;
        const targetPosition = totalPromptLength + cursorPosition;

        process.stdout.write('[1G');
        process.stdout.write(`[${targetPosition + 1}G`);
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

        this.clearEmojiSuggestions();

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

        process.stdout.write(`[${suggestions.length + 1}A`);
    }

    clearEmojiSuggestions() {
        if (!this.suggestionsActive || this.suggestionLines === 0) {
            return;
        }

        process.stdout.write('[s');

        process.stdout.write('\n');
        for (let i = 0; i < this.suggestionLines; i++) {
            process.stdout.write('[2K');
            if (i < this.suggestionLines - 1) {
                process.stdout.write('[1B');
            }
        }

        process.stdout.write(`[${this.suggestionLines}A`);

        this.suggestionsActive = false;
        this.suggestionLines = 0;
    }

    updateSelectedSuggestion(suggestions, selectedIndex) {
        if (!this.suggestionsActive || !suggestions || suggestions.length === 0) {
            return;
        }

        process.stdout.write('\n');

        suggestions.forEach((suggestion, index) => {
            const isSelected = index === selectedIndex;
            const prefix = isSelected ? chalk.bgBlue.white(' ► ') : '   ';
            const emoji = chalk.yellow(suggestion.emoji);
            const shortcut = chalk.gray(suggestion.shortcut);
            const description = chalk.dim(suggestion.description);

            process.stdout.write('[2K');
            process.stdout.write('[1G');
            process.stdout.write(prefix + emoji + ' ' + shortcut + ' ' + description);

            if (index < suggestions.length - 1) {
                process.stdout.write('\n');
            }
        });

        process.stdout.write(`[${suggestions.length}A`);
    }
}

module.exports = Display;
