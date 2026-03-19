const path = require('path');
const Module = require('module');

const appNodeModulesPath = path.resolve(__dirname, '../app/node_modules');
process.env.NODE_PATH = process.env.NODE_PATH
    ? `${process.env.NODE_PATH}${path.delimiter}${appNodeModulesPath}`
    : appNodeModulesPath;
Module._initPaths();

require('dotenv').config({ path: path.resolve(__dirname, '../app/.env') });

const getServerConfig = require('./config/cli');
const createUpload = require('./config/upload');
const createApp = require('./app');
const inventoryStore = require('./store/inventoryStore');

const { host, port, cache } = getServerConfig();
const upload = createUpload(cache);

const dataFilePath = path.resolve(__dirname, '../app/data.json');
inventoryStore.initialize(dataFilePath);

const app = createApp({
    host,
    port,
    cache,
    upload,
    inventoryStore,
    rootDir: path.resolve(__dirname, '..'),
    enableStaticRoutes: false
});

app.listen(port, host, () => {
    console.log(`API сервер запущено на http://${host}:${port}`);
    console.log(`Кеш директорія: ${cache}`);
    console.log(`Дані зберігаються в: ${dataFilePath}`);
});
