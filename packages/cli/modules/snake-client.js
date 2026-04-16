const WebSocket    = require('ws');
const chalk        = require('chalk');
const SnakeRenderer = require('./snake-renderer');

class SnakeClient {
    constructor() {
        this.ws           = null;
        this.nickname     = null;
        this.roomCode     = null;
        this.renderer     = new SnakeRenderer();
        this.state        = 'connecting'; // connecting|waiting|countdown|playing|dead|spectating|gameover
        this.playersList  = [];           // ordered nickname list (for countdown display)
        this.lastGameState = null;
        this.lastScoreboard = null;
        this.voteState    = null;         // { voters: [], votes: 0, total: 0 }
        this.inputListener = null;
        this.onReturnToMenu = null;       // callback when player quits to menu
    }

    // ── Connection ────────────────────────────────────────────────────────────
    connect() {
        return new Promise((resolve, reject) => {
            const serverUrl = process.env.DRIFT_WS_URL || 'wss://drift.abhinavaditya.com';
            this.ws = new WebSocket(serverUrl);
            this.ws.on('open',  () => resolve());
            this.ws.on('error', () => reject(new Error(
                'Could not connect to drift.abhinavaditya.com — check your internet connection.'
            )));
            this.ws.on('message', (raw) => {
                try { this.handleMessage(JSON.parse(raw.toString())); }
                catch (_) {}
            });
            this.ws.on('close', () => {
                this.renderer.showCursor();
                if (this.state !== 'gameover') {
                    process.stdout.write('\n');
                    console.log(chalk.red('💔 Connection lost.'));
                }
                this._teardownInput();
                if (this.onReturnToMenu) setTimeout(this.onReturnToMenu, 1500);
            });
        });
    }

    // ── Outbound messages ─────────────────────────────────────────────────────
    createRoom() {
        this._send({ type: 'snake_create', nickname: this.nickname });
    }

    joinRoom(code) {
        this._send({
            type: 'snake_join_room',
            roomCode: code.trim().toUpperCase(),
            nickname: this.nickname,
        });
    }

    _sendDirection(dir) {
        if (this.roomCode && this.state === 'playing')
            this._send({ type: 'snake_direction', roomCode: this.roomCode, direction: dir });
    }

    _sendVoteRestart() {
        if (this.roomCode && this.state === 'gameover')
            this._send({ type: 'snake_vote_restart', roomCode: this.roomCode });
    }

    _send(obj) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN)
            this.ws.send(JSON.stringify(obj));
    }

    // ── Inbound messages ──────────────────────────────────────────────────────
    handleMessage(msg) {
        switch (msg.type) {

            case 'snake_room_joined':
                this.roomCode    = msg.roomCode;
                this.playersList = msg.players;
                this.state       = 'waiting';
                this.renderer.renderWaiting(this.roomCode, this.playersList);
                break;

            case 'snake_player_joined':
                this.playersList = msg.players;
                if (this.state === 'waiting')
                    this.renderer.renderWaiting(this.roomCode, this.playersList);
                break;

            case 'snake_countdown':
                this.state = 'countdown';
                this.renderer.renderCountdown(msg.count, this.playersList);
                if (msg.count === 0) this.renderer.hideCursor();
                break;

            case 'snake_state': {
                this.lastGameState = msg;
                // Transition from countdown → playing on first state tick
                if (this.state === 'countdown' || this.state === 'waiting') {
                    this.state = 'playing';
                    this.renderer.hideCursor();
                }
                const me = msg.players.find(p => p.nickname === this.nickname);
                if (me && !me.alive && this.state === 'playing') {
                    this.state = 'spectating';
                }
                this.renderer.render(msg, this.nickname);
                break;
            }

            case 'snake_player_died':
                // Visual handled in next snake_state render; nothing extra needed
                break;

            case 'snake_game_over':
                this.state        = 'gameover';
                this.lastScoreboard = msg.scoreboard;
                this.voteState    = { voters: [], votes: 0, total: msg.scoreboard.length };
                this.renderer.showCursor();
                this.renderer.renderGameOver(msg.scoreboard, this.nickname, this.voteState);
                break;

            case 'snake_restart_vote':
                if (this.voteState) {
                    if (!this.voteState.voters.includes(msg.nickname))
                        this.voteState.voters.push(msg.nickname);
                    this.voteState.votes = msg.votes;
                    this.voteState.total = msg.total;
                }
                if (this.state === 'gameover')
                    this.renderer.renderGameOver(this.lastScoreboard, this.nickname, this.voteState);
                break;

            case 'snake_restarting':
                this.state       = 'countdown';
                this.voteState   = null;
                this.playersList = msg.players || this.playersList;
                break;

            case 'error':
                this.renderer.showCursor();
                process.stdout.write('\n');
                console.error(chalk.red(`❌ ${msg.message}`));
                setTimeout(() => {
                    this._teardownInput();
                    if (this.ws) { this.ws.close(); this.ws = null; }
                    if (this.onReturnToMenu) this.onReturnToMenu();
                }, 2000);
                break;
        }
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    setupInput() {
        if (!process.stdin.isTTY) return;
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        this.inputListener = (key) => {
            if (key === '\u0003') { this.cleanup(); process.exit(0); } // Ctrl+C

            // Arrow keys
            if (key === '\u001b[A') return this._sendDirection('up');
            if (key === '\u001b[B') return this._sendDirection('down');
            if (key === '\u001b[C') return this._sendDirection('right');
            if (key === '\u001b[D') return this._sendDirection('left');

            const k = key.toLowerCase();
            if (k === 'w') return this._sendDirection('up');
            if (k === 's') return this._sendDirection('down');
            if (k === 'd') return this._sendDirection('right');
            if (k === 'a') return this._sendDirection('left');

            if (k === 'r') return this._sendVoteRestart();

            if (k === 'q') {
                this.cleanup();
                if (this.onReturnToMenu) this.onReturnToMenu();
            }
        };

        process.stdin.on('data', this.inputListener);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    _teardownInput() {
        if (this.inputListener) {
            process.stdin.removeListener('data', this.inputListener);
            this.inputListener = null;
        }
        if (process.stdin.isTTY) {
            try { process.stdin.setRawMode(false); } catch (_) {}
            process.stdin.pause();
        }
    }

    cleanup() {
        this.renderer.showCursor();
        this._teardownInput();
        if (this.ws) { this.ws.close(); this.ws = null; }
    }
}

module.exports = SnakeClient;
