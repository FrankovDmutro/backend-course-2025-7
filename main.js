const getServerConfig = require('./config/cli');
const createUpload = require('./config/upload');
const createApp = require('./app');
const inventoryStore = require('./store/inventoryStore');

const { host, port, cache } = getServerConfig();
const upload = createUpload(cache);

const app = createApp({
    host,
    port,
    cache,
    upload,
    inventoryStore,
    rootDir: __dirname
});

app.listen(port, host, () => {
    console.log(`Сервер запущено на http://${host}:${port}`);
    console.log(`Кеш директорія: ${cache}`);
});