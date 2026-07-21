const chalk = require('chalk');

class Display {
    constructor() {
        this.inputBoxActive = false;
        this.suggestionsActive = false;
        this.suggestionLines = 0;
        this.redrawCallback = null;
        this.incognito = false;
    }

    moduleFor(nickname) {
        const pool = ['auth.session', 'cache.redis', 'http.worker', 'queue.consumer', 'db.pool', 'net.gateway'];
        let hash = 0;
        for (let i = 0; i < nickname.length; i++) hash += nickname.charCodeAt(i);
        return pool[hash % pool.length];
    }

    levelFor(nickname) {
        let hash = 0;
        for (let i = 0; i < nickname.length; i++) hash += nickname.charCodeAt(i) * (i + 1);
        return (hash % 4 === 0) ? 'DEBUG' : 'INFO';
    }

    logLine(level, module, text) {
        const now = new Date();
        const ts = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0') + '.' +
            String(now.getMilliseconds()).padStart(3, '0');
        const lvl = level.padEnd(5);
        return `${ts} [${lvl}] ${module}  ${text}`;
    }

    boot(text) {
        return this.logLine('INFO', 'boot', text);
    }

    sysLog(level, text) {
        return this.logLine(level, 'net.pool', text);
    }

    startSeeder() {
        this.seederActive = true;
        this._pidCounter = 1000 + Math.floor(Math.random() * 50000);
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
        if (!this.seederActive) return;
        const wasInputActive = this.inputBoxActive;
        if (this.inputBoxActive) this.clearInputBox();

        const line = this._fakeProcessLine();
        console.log(line);

        if (wasInputActive && this.redrawCallback) this.redrawCallback();
        this._scheduleSeed();
    }

    _fakeProcessLine() {
        const cmds = [
            '/usr/lib/systemd/systemd-journald', '/usr/bin/dockerd -H fd://',
            '/usr/sbin/nginx: worker process', 'postgres: autovacuum launcher',
            '/usr/bin/containerd', 'node /app/server.js', 'python3 worker.py',
            '/usr/sbin/sshd -D', 'redis-server *:6379', '/usr/bin/grafana-server',
            'java -jar /opt/kafka/kafka.jar', '/usr/lib/systemd/systemd --user',
            'kworker/u8:2-events_unbound', 'containerd-shim-runc-v2',
            '/usr/bin/dbus-daemon --session', 'sleep 30', 'cron -f',
            '/usr/sbin/rsyslogd -n', 'php-fpm: pool www', 'haproxy -f /etc/haproxy.cfg'
        ];
        const users = ['root', 'www-data', 'postgres', 'redis', 'nobody', 'systemd+', 'daemon'];
        const states = ['S', 'R', 'S', 'S', 'D', 'S', 'S', 'I'];

        const pid = this._pidCounter++;
        if (this._pidCounter > 65000) this._pidCounter = 1000;
        const user = users[Math.floor(Math.random() * users.length)];
        const pri = Math.floor(Math.random() * 30);
        const ni = pri > 19 ? (pri - 20) : 0;
        const virt = (Math.floor(Math.random() * 2000) + 100) + 'M';
        const res = (Math.floor(Math.random() * 500) + 10) + 'M';
        const shr = (Math.floor(Math.random() * 80) + 4) + 'M';
        const state = states[Math.floor(Math.random() * states.length)];
        const cpu = (Math.random() * 12).toFixed(1);
        const mem = (Math.random() * 8).toFixed(1);
        const time = Math.floor(Math.random() * 200) + ':' + String(Math.floor(Math.random() * 60)).padStart(2, '0') + '.' + String(Math.floor(Math.random() * 100)).padStart(2, '0');
        const cmd = cmds[Math.floor(Math.random() * cmds.length)];

        const pidStr = String(pid).padStart(7);
        const userStr = user.padEnd(9);
        const priStr = String(pri).padStart(3);
        const niStr = String(ni).padStart(4);
        const virtStr = virt.padStart(7);
        const resStr = res.padStart(6);
        const shrStr = shr.padStart(6);
        const cpuStr = cpu.padStart(5);
        const memStr = mem.padStart(5);
        const timeStr = time.padStart(9);

        const line = `${pidStr} ${userStr} ${priStr} ${niStr} ${virtStr} ${resStr} ${shrStr} ${state} ${cpuStr} ${memStr} ${timeStr} ${cmd}`;

        if (parseFloat(cpu) > 8) return chalk.red(line);
        if (parseFloat(cpu) > 4) return chalk.yellow(line);
        if (state === 'D') return chalk.red(line);
        return chalk.green(line);
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
        if (this.incognito) {
            const wasInputActive = this.inputBoxActive;
            if (this.inputBoxActive) this.clearInputBox();
            const mod = this.moduleFor(message.nickname);
            const level = this.levelFor(message.nickname);
            console.log(this.logLine(level, mod, message.message));
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
        if (this.incognito) {
            const wasInputActive = this.inputBoxActive;
            if (this.inputBoxActive) this.clearInputBox();
            if (this.suggestionsActive) this.clearEmojiSuggestions();
            let logText = text;
            if (text.includes('joined the room')) logText = 'peer connected';
            else if (text.includes('left the room')) logText = 'peer disconnected';
            console.log(this.sysLog('INFO', logText));
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

        const prompt = this.incognito ? '$ ' : chalk.blue('> ');
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