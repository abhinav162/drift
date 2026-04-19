const chalk = require('chalk');

const MAP_W = 50;
const MAP_H = 20;

const STYLES = [
    { color: (s) => chalk.greenBright(s),   name: 'Green'   },
    { color: (s) => chalk.redBright(s),     name: 'Red'     },
    { color: (s) => chalk.yellowBright(s),  name: 'Yellow'  },
    { color: (s) => chalk.blueBright(s),    name: 'Blue'    },
    { color: (s) => chalk.magentaBright(s), name: 'Magenta' },
    { color: (s) => chalk.cyanBright(s),    name: 'Cyan'    },
];

class SnakeRenderer {
    clearScreen()    { process.stdout.write('\x1b[2J\x1b[H'); }
    home()           { process.stdout.write('\x1b[H'); }
    hideCursor()     { process.stdout.write('\x1b[?25l'); }
    showCursor()     { process.stdout.write('\x1b[?25h'); }

    // ── Waiting lobby ────────────────────────────────────────────────────────
    renderWaiting(roomCode, players) {
        this.clearScreen();
        const lines = [];
        lines.push(chalk.cyanBright.bold('\n  ╔══════════════════════════╗'));
        lines.push(chalk.cyanBright.bold('  ║   🐍  SNAKE  ARENA  🐍   ║'));
        lines.push(chalk.cyanBright.bold('  ╚══════════════════════════╝\n'));
        lines.push(`  Room Code: ${chalk.yellow.bold(roomCode)}`);
        lines.push(chalk.gray('  Share this code with friends!\n'));
        lines.push(`  Players joined: ${chalk.green.bold(players.length)} / need at least ${chalk.white(2)}\n`);
        players.forEach((name, i) => {
            const st = STYLES[i % STYLES.length];
            lines.push(`    ${st.color('●')} ${chalk.white(name)}`);
        });
        lines.push(chalk.gray('\n  Waiting for players to join…'));
        lines.push(chalk.gray('  Ctrl+C to exit'));
        process.stdout.write(lines.join('\n') + '\n');
    }

    // ── Countdown ────────────────────────────────────────────────────────────
    renderCountdown(count, players) {
        this.clearScreen();
        const lines = [];
        lines.push(chalk.cyanBright.bold('\n  ╔══════════════════════════╗'));
        lines.push(chalk.cyanBright.bold('  ║   🐍  SNAKE  ARENA  🐍   ║'));
        lines.push(chalk.cyanBright.bold('  ╚══════════════════════════╝\n'));
        if (count === 0) {
            lines.push(chalk.greenBright.bold('         ██████╗  ██████╗ ██╗'));
            lines.push(chalk.greenBright.bold('        ██╔════╝ ██╔═══██╗██║'));
            lines.push(chalk.greenBright.bold('        ██║  ███╗██║   ██║██║'));
            lines.push(chalk.greenBright.bold('        ██║   ██║██║   ██║╚═╝'));
            lines.push(chalk.greenBright.bold('        ╚██████╔╝╚██████╔╝██╗'));
            lines.push(chalk.greenBright.bold('         ╚═════╝  ╚═════╝ ╚═╝\n'));
        } else {
            lines.push(chalk.yellowBright.bold(`\n               ${count}…\n`));
        }
        lines.push(chalk.gray('  Players:'));
        players.forEach((name, i) => {
            const st = STYLES[i % STYLES.length];
            lines.push(`    ${st.color('●')} ${chalk.white(name)}`);
        });
        lines.push(chalk.gray('\n  Controls: WASD or ↑ ↓ ← →  |  Q to quit'));
        process.stdout.write(lines.join('\n') + '\n');
    }

    // ── In-game ──────────────────────────────────────────────────────────────
    render(state, myNickname) {
        // Build cell grid
        const grid = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(null));

        if (state.food) grid[state.food.y][state.food.x] = { type: 'food' };

        state.players.forEach(player => {
            if (!player.alive || !player.snake.length) return;
            player.snake.forEach((seg, idx) => {
                if (seg.x >= 0 && seg.x < MAP_W && seg.y >= 0 && seg.y < MAP_H) {
                    grid[seg.y][seg.x] = {
                        type: idx === 0 ? 'head' : 'body',
                        si: player.styleIndex,
                        me: player.nickname === myNickname,
                    };
                }
            });
        });

        const out = [];

        // Title row
        out.push(chalk.cyanBright.bold('  🐍 SNAKE ARENA') +
                 chalk.gray('  ') +
                 chalk.white.bold('SCOREBOARD'));

        // Top border + scoreboard header divider
        out.push(chalk.gray('┌' + '─'.repeat(MAP_W) + '┐') +
                 chalk.gray('  ' + '─'.repeat(22)));

        // Game rows
        for (let y = 0; y < MAP_H; y++) {
            let row = chalk.gray('│');
            for (let x = 0; x < MAP_W; x++) {
                const c = grid[y][x];
                if (!c)                  { row += ' '; }
                else if (c.type === 'food') { row += chalk.yellow('*'); }
                else {
                    const st   = STYLES[c.si % STYLES.length];
                    const char = c.type === 'head' ? 'O' : 'o';
                    row += c.me ? chalk.white.bold(char) : st.color(char);
                }
            }
            row += chalk.gray('│');

            // Scoreboard column
            const entry = this._scoreEntry(state.players, y, myNickname);
            if (entry) row += '  ' + entry;

            out.push(row);
        }

        // Bottom border
        out.push(chalk.gray('└' + '─'.repeat(MAP_W) + '┘'));

        // Status bar
        const me = state.players.find(p => p.nickname === myNickname);
        if (me && !me.alive) {
            out.push(chalk.red.bold('\n  💀 YOU DIED  —  spectating  |  R = restart when game ends  |  Q = quit'));
        } else if (me) {
            out.push(
                chalk.gray('\n  Score: ') + chalk.yellow.bold(String(me.score).padEnd(4)) +
                chalk.gray(' Alive: ') + chalk.green(`${state.alivePlayers}/${state.players.length}`) +
                chalk.gray('  WASD / ↑↓←→ to move  |  Q to quit')
            );
        }

        this.home();
        process.stdout.write(out.join('\n') + '\n');
    }

    _scoreEntry(players, row, myNickname) {
        if (row === 0) return chalk.white.bold('PLAYER             PTS');
        if (row === 1) return chalk.gray('─'.repeat(22));
        const idx = row - 2;
        if (idx >= players.length) return '';
        const p  = players[idx];
        const st = STYLES[p.styleIndex % STYLES.length];
        const bullet  = p.alive ? st.color('●') : chalk.gray('✕');
        const nameRaw = p.nickname.substring(0, 14).padEnd(14);
        const name    = p.nickname === myNickname
            ? chalk.white.bold(nameRaw)
            : chalk.white(nameRaw);
        const score = chalk.yellow(String(p.score).padStart(4));
        return `${bullet} ${name} ${score}`;
    }

    // ── Game over ─────────────────────────────────────────────────────────────
    renderGameOver(scoreboard, myNickname, voteState = null) {
        this.clearScreen();
        const lines = [];
        lines.push(chalk.cyanBright.bold('\n  ╔══════════════════════════╗'));
        lines.push(chalk.cyanBright.bold('  ║       GAME  OVER         ║'));
        lines.push(chalk.cyanBright.bold('  ╚══════════════════════════╝\n'));
        lines.push(chalk.white.bold('  FINAL SCORES'));
        lines.push(chalk.gray('  ' + '─'.repeat(32)));

        const medals = ['🥇', '🥈', '🥉'];
        scoreboard.forEach((entry, i) => {
            const medal   = medals[i] || '  ';
            const st      = STYLES[i % STYLES.length];
            const isMe    = entry.nickname === myNickname;
            const nameRaw = entry.nickname.substring(0, 16).padEnd(16);
            const name    = isMe ? chalk.white.bold(nameRaw + ' (you)') : chalk.white(nameRaw);
            const pts     = chalk.yellow(`${entry.score} pts`);
            lines.push(`  ${medal}  ${st.color('●')} ${name}  ${pts}`);
        });

        lines.push(chalk.gray('\n  ' + '─'.repeat(32)));

        // Vote status
        if (voteState && voteState.voters.length > 0) {
            lines.push('');
            voteState.voters.forEach(name => {
                lines.push(chalk.green(`  ✓ ${name} wants to play again`));
            });
            lines.push(chalk.gray(`\n  ${voteState.votes}/${voteState.total} ready — waiting for everyone…`));
        }

        const iVoted = voteState && voteState.voters.includes(myNickname);
        if (iVoted) {
            lines.push(chalk.gray('\n  Waiting for others…   Q — quit to menu'));
        } else {
            lines.push(chalk.gray('\n  R — play again   |   Q — quit to menu'));
        }

        process.stdout.write(lines.join('\n') + '\n');
    }
}

module.exports = SnakeRenderer;
