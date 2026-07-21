const chalk = require('chalk');

const modules = ['auth.session', 'cache.redis', 'http.worker', 'queue.consumer', 'db.pool', 'net.gateway'];

function hashNickname(nickname) {
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) hash += nickname.charCodeAt(i);
    return hash;
}

function moduleFor(nickname) {
    return modules[hashNickname(nickname) % modules.length];
}

function levelFor(nickname) {
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) hash += nickname.charCodeAt(i) * (i + 1);
    return (hash % 4 === 0) ? 'DEBUG' : 'INFO';
}

function timestamp() {
    const now = new Date();
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0') + '.' +
        String(now.getMilliseconds()).padStart(3, '0');
}

function logLine(level, mod, text) {
    return `${timestamp()} [${level.padEnd(5)}] ${mod}  ${text}`;
}

const seedMessages = [
    'gc pause 12ms', 'health check ok', 'tls cert refresh', 'retry backoff 200ms',
    'connection pool drained', 'cache miss key=user:9281', 'upstream timeout 3.2s',
    'rate limit bucket refill', 'compaction complete 4.1MB freed', 'heartbeat ack seq=4201',
    'shard rebalance started', 'dns lookup 1.4ms', 'audit flush 128 events',
    'memory pressure 78%', 'snapshot write 2.3s', 'leader election round 3',
    'token refresh 401 retry', 'circuit breaker half-open', 'queue depth 847',
    'ssl handshake 45ms'
];

function randomLevel() {
    const r = Math.random();
    if (r < 0.05) return 'ERROR';
    if (r < 0.20) return 'WARN';
    if (r < 0.35) return 'DEBUG';
    return 'INFO';
}

function colorByLevel(line, level) {
    if (level === 'ERROR') return chalk.red(line);
    if (level === 'WARN') return chalk.yellow(line);
    if (level === 'DEBUG') return chalk.gray(line);
    return line;
}

module.exports = {
    name: 'syslog',
    prompt: '$ ',

    formatMessage(nickname, text) {
        const mod = moduleFor(nickname);
        const level = levelFor(nickname);
        const line = logLine(level, mod, text);
        return colorByLevel(line, level);
    },

    formatSystem(text) {
        let logText = text;
        if (text.includes('joined the room')) logText = 'peer connected';
        else if (text.includes('left the room')) logText = 'peer disconnected';
        return logLine('INFO', 'net.pool', logText);
    },

    formatError(text) {
        return chalk.red(logLine('ERROR', 'net.gateway', text));
    },

    formatBoot(text) {
        return logLine('INFO', 'boot', text);
    },

    seedLine() {
        const mod = modules[Math.floor(Math.random() * modules.length)];
        const msg = seedMessages[Math.floor(Math.random() * seedMessages.length)];
        const level = randomLevel();
        const line = logLine(level, mod, msg);
        return colorByLevel(line, level);
    }
};
