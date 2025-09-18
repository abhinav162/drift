const chalk = require('chalk');

class Display {
    constructor() {
        this.inputBoxActive = false;
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
        console.log(chalk.gray('👉 ') + chalk.gray('Use :) :D :heart: etc in messages for emojis!'));
    }

    displayMessage(message, currentNickname) {
        const time = new Date(message.timestamp).toLocaleTimeString();
        const isOwnMessage = message.nickname === currentNickname;

        if (this.inputBoxActive) {
            this.clearInputBox();
        }

        if (isOwnMessage) {
            console.log(chalk.gray(`[${time}] `) + chalk.blue.bold(`You: `) + message.message);
        } else {
            console.log(chalk.gray(`[${time}] `) + chalk.green.bold(`${message.nickname}: `) + message.message);
        }

        if (this.inputBoxActive) {
            // Note: redraw will be called by the input handler
        }
    }

    displaySystemMessage(text) {
        if (this.inputBoxActive) {
            this.clearInputBox();
        }

        console.log(chalk.yellow(`🔔 ${text}`));

        if (this.inputBoxActive) {
            // Note: redraw will be called by the input handler
        }
    }

    showHelpMessage(gameCommands) {
        if (this.inputBoxActive) {
            this.clearInputBox();
        }

        console.log(chalk.yellow('🎮 P A S T I M E:'));
        gameCommands.forEach(cmd => {
            console.log(chalk.gray(`  ${cmd.command.padEnd(10)} - ${cmd.description}`));
        });
        console.log(chalk.gray('  /help      - Show this help'));
        console.log(chalk.gray('  /room      - Show room code'));
        console.log(chalk.gray('  /quit      - Leave the room'));
    }

    showGameContent(gameData) {
        if (this.inputBoxActive) {
            this.clearInputBox();
        }

        console.log(gameData.header);
        gameData.content.forEach(line => {
            console.log(line);
        });
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
}

module.exports = Display;