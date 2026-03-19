const path = require('path');
const getServerConfig = require('../back/config/cli');
const createUpload = require('../back/config/upload');
const createApp = require('../back/app');
const inventoryStore = require('../back/store/inventoryStore');

const { host, port, cache } = getServerConfig();
const upload = createUpload(cache);

// Ініціалізуємо збереження даних в JSON
const dataFilePath = path.join(__dirname, 'data.json');
inventoryStore.initialize(dataFilePath);

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
    console.log(`Дані зберігаються в: ${dataFilePath}`);
});