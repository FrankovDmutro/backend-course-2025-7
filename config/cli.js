const fs = require('fs');
const { Command } = require('commander');

function getServerConfig(argv = process.argv) {
    const program = new Command();

    program
        .helpOption(false)
        .option('-h, --host <host>', 'адреса сервера', process.env.SERVER_HOST || 'localhost')
        .option('-p, --port <port>', 'порт сервера', process.env.PORT || '3000')
        .option('-c, --cache <cache>', 'шлях до директорії кешу', process.env.CACHE_DIR || './cache');

    program.parse(argv);
    const { host, port, cache } = program.opts();

    if (!fs.existsSync(cache)) {
        fs.mkdirSync(cache, { recursive: true });
    }

    return { host, port, cache };
}

module.exports = getServerConfig;
