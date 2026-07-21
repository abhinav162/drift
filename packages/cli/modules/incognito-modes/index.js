const htop = require('./htop');
const syslog = require('./syslog');

const modes = { htop, syslog };

function getMode(name) {
    return modes[name] || modes.htop;
}

module.exports = { modes, getMode };
