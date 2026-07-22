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

function bar(pct, width) {
    const filled = Math.round((pct / 100) * width);
    const empty = width - filled;
    const filledStr = '|'.repeat(filled);
    const emptyStr = ' '.repeat(empty);
    let colored;
    if (pct > 80) colored = chalk.red(filledStr);
    else if (pct > 50) colored = chalk.yellow(filledStr);
    else colored = chalk.green(filledStr);
    return '[' + colored + chalk.dim(emptyStr) + ']';
}

function header() {
    const cols = process.stdout.columns || 80;
    const barW = Math.min(30, cols - 20);
    const cpus = [
        Math.random() * 40 + 5,
        Math.random() * 25 + 2,
        Math.random() * 60 + 10,
        Math.random() * 20 + 1
    ];
    const memPct = 40 + Math.random() * 30;
    const swpPct = Math.random() * 15;
    const tasks = 180 + Math.floor(Math.random() * 40);
    const running = 1 + Math.floor(Math.random() * 3);
    const load1 = (0.5 + Math.random() * 2).toFixed(2);
    const load5 = (0.4 + Math.random() * 1.5).toFixed(2);
    const load15 = (0.3 + Math.random() * 1).toFixed(2);
    const upH = 2 + Math.floor(Math.random() * 200);
    const upM = Math.floor(Math.random() * 60);

    const lines = [];
    cpus.forEach((c, i) => {
        lines.push(`  ${i + 1} ${bar(c, barW)} ${c.toFixed(1)}%`);
    });
    lines.push(`  Mem ${bar(memPct, barW)} ${(memPct * 0.16).toFixed(1)}G/${(16).toFixed(1)}G`);
    lines.push(`  Swp ${bar(swpPct, barW)} ${(swpPct * 0.02).toFixed(1)}G/${(2).toFixed(1)}G`);
    lines.push('');
    lines.push(`  Tasks: ${chalk.bold(tasks)}, ${running} running`);
    lines.push(`  Load average: ${load1} ${load5} ${load15}`);
    lines.push(`  Uptime: ${upH}:${String(upM).padStart(2, '0')}`);
    lines.push('');
    lines.push(chalk.inverse(
        `  PID USER      PRI   NI    VIRT    RES    SHR S  CPU%  MEM%     TIME+ COMMAND`.padEnd(cols)
    ));
    return lines.join('\n');
}

function processLine(cpu, state, cmdOverride) {
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
    const cmd = cmdOverride || cmds[Math.floor(Math.random() * cmds.length)];

    return `${String(pid).padStart(7)} ${user.padEnd(9)} ${String(pri).padStart(3)} ${String(ni).padStart(4)} ${virt.padStart(7)} ${res.padStart(6)} ${shr.padStart(6)} ${state} ${cpu.padStart(5)} ${mem.padStart(5)} ${time.padStart(9)} ${cmd}`;
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

    header() {
        return header();
    },

    formatMessage(nickname, text) {
        const cpu = (Math.random() * 6 + 0.5).toFixed(1);
        const state = 'S';
        const cmd = `node ${nickname}.worker --msg="${text.slice(0, 40)}"`;
        const line = processLine(cpu, state, cmd);
        return chalk.white(line);
    },

    formatSystem(text) {
        let cmd;
        if (text.includes('joined')) cmd = '/usr/sbin/sshd: session opened';
        else if (text.includes('left')) cmd = '/usr/sbin/sshd: session closed';
        else cmd = `systemd-logind: ${text.slice(0, 50)}`;
        const cpu = (Math.random() * 2).toFixed(1);
        const line = processLine(cpu, 'S', cmd);
        return chalk.cyan(line);
    },

    formatError(text) {
        const cmd = `[kworker/0:1] error: ${text.slice(0, 40)}`;
        const line = processLine('0.0', 'D', cmd);
        return chalk.red(line);
    },

    formatBoot(text) {
        const cmd = `systemd[1]: ${text}`;
        const line = processLine('0.1', 'S', cmd);
        return chalk.white(line);
    },

    seedLine() {
        const cpu = (Math.random() * 12).toFixed(1);
        const state = states[Math.floor(Math.random() * states.length)];
        const line = processLine(cpu, state);
        return colorize(line, cpu, state);
    }
};
