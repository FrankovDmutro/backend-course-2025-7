const path = require('path');
const Module = require('module');
const getServerConfig = require('./config/cli');
const createUpload = require('./config/upload');
const createApp = require('./app');
const inventoryStore = require('./store/inventoryStore');

function initNodePath(appNodeModulesPath) {
    process.env.NODE_PATH = process.env.NODE_PATH
        ? `${process.env.NODE_PATH}${path.delimiter}${appNodeModulesPath}`
        : appNodeModulesPath;
    Module._initPaths();
}

function startServer({
    appNodeModulesPath,
    envFilePath,
    dataFilePath,
    rootDir,
    enableStaticRoutes = true,
    startMessage = 'Сервер запущено'
}) {
    initNodePath(appNodeModulesPath);
    require('dotenv').config({ path: envFilePath });

    const { host, port, cache } = getServerConfig();
    const upload = createUpload(cache);
    inventoryStore.initialize(dataFilePath);

    const app = createApp({
        host,
        port,
        cache,
        upload,
        inventoryStore,
        rootDir,
        enableStaticRoutes
    });

    app.listen(port, host, () => {
        console.log(`${startMessage} на http://${host}:${port}`);
        console.log(`Кеш директорія: ${cache}`);
        console.log(`Дані зберігаються в: ${dataFilePath}`);
    });
}

module.exports = startServer;