const fs = require('fs');
const { program } = require('commander');

function getServerConfig(argv = process.argv) {
    program
        .helpOption(false)
        .option('-h, --host <host>', 'адреса сервера', process.env.HOST || 'localhost')
        .option('-p, --port <port>', 'порт сервера', process.env.PORT || '3000')
        .option('-c, --cache <cache>', 'шлях до директорії кешу', process.env.CACHE_DIR || './cache');

    program.parse(argv);
    const { host, port, cache } = program.opts();
    const parsedPort = Number.parseInt(port, 10);

    if (Number.isNaN(parsedPort)) {
        throw new Error(`Невірний порт: ${port}`);
    }

    if (!fs.existsSync(cache)) {
        fs.mkdirSync(cache, { recursive: true });
    }

    return { host, port: parsedPort, cache };
}

module.exports = getServerConfig;
