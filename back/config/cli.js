const fs = require('fs');
const { program } = require('commander');

function getServerConfig(argv = process.argv) {
    program
        .helpOption(false)
        .requiredOption('-h, --host <host>', 'адреса сервера')
        .requiredOption('-p, --port <port>', 'порт сервера')
        .requiredOption('-c, --cache <cache>', 'шлях до директорії кешу');

    program.parse(argv);
    const { host, port, cache } = program.opts();

    if (!fs.existsSync(cache)) {
        fs.mkdirSync(cache, { recursive: true });
    }

    return { host, port, cache };
}

module.exports = getServerConfig;
