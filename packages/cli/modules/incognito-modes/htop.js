const chalk = require('chalk');

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

let pidCounter = 1000 + Math.floor(Math.random() * 50000);

function processLine(cpu, state) {
    const pid = pidCounter++;
    if (pidCounter > 65000) pidCounter = 1000;
    const user = users[Math.floor(Math.random() * users.length)];
    const pri = Math.floor(Math.random() * 30);
    const ni = pri > 19 ? (pri - 20) : 0;
    const virt = (Math.floor(Math.random() * 2000) + 100) + 'M';
    const res = (Math.floor(Math.random() * 500) + 10) + 'M';
    const shr = (Math.floor(Math.random() * 80) + 4) + 'M';
    const mem = (Math.random() * 8).toFixed(1);
    const time = Math.floor(Math.random() * 200) + ':' + String(Math.floor(Math.random() * 60)).padStart(2, '0') + '.' + String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const cmd = cmds[Math.floor(Math.random() * cmds.length)];

    const line = `${String(pid).padStart(7)} ${user.padEnd(9)} ${String(pri).padStart(3)} ${String(ni).padStart(4)} ${virt.padStart(7)} ${res.padStart(6)} ${shr.padStart(6)} ${state} ${cpu.padStart(5)} ${mem.padStart(5)} ${time.padStart(9)} ${cmd}`;
    return line;
}

function colorize(line, cpu, state) {
    if (parseFloat(cpu) > 8) return chalk.red(line);
    if (parseFloat(cpu) > 4) return chalk.yellow(line);
    if (state === 'D') return chalk.red(line);
    return chalk.green(line);
}

module.exports = {
    name: 'htop',
    prompt: '$ ',

    formatMessage(nickname, text) {
        const modules = ['auth.session', 'cache.redis', 'http.worker', 'queue.consumer', 'db.pool', 'net.gateway'];
        let hash = 0;
        for (let i = 0; i < nickname.length; i++) hash += nickname.charCodeAt(i);
        const mod = modules[hash % modules.length];
        let levelHash = 0;
        for (let i = 0; i < nickname.length; i++) levelHash += nickname.charCodeAt(i) * (i + 1);
        const level = (levelHash % 4 === 0) ? 'DEBUG' : 'INFO';
        const now = new Date();
        const ts = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0') + '.' +
            String(now.getMilliseconds()).padStart(3, '0');
        const line = `${ts} [${level.padEnd(5)}] ${mod}  ${text}`;
        if (level === 'DEBUG') return chalk.gray(line);
        return line;
    },

    formatSystem(text) {
        let logText = text;
        if (text.includes('joined the room')) logText = 'peer connected';
        else if (text.includes('left the room')) logText = 'peer disconnected';
        const now = new Date();
        const ts = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0') + '.' +
            String(now.getMilliseconds()).padStart(3, '0');
        return `${ts} [INFO ] net.pool  ${logText}`;
    },

    formatError(text) {
        const now = new Date();
        const ts = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0') + '.' +
            String(now.getMilliseconds()).padStart(3, '0');
        return chalk.red(`${ts} [ERROR] net.gateway  ${text}`);
    },

    formatBoot(text) {
        const now = new Date();
        const ts = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0') + '.' +
            String(now.getMilliseconds()).padStart(3, '0');
        return `${ts} [INFO ] boot  ${text}`;
    },

    seedLine() {
        const cpu = (Math.random() * 12).toFixed(1);
        const state = states[Math.floor(Math.random() * states.length)];
        const line = processLine(cpu, state);
        return colorize(line, cpu, state);
    }
};
