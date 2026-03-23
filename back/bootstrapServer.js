const path = require('path');
const Module = require('module');

function initNodePath(appNodeModulesPath) {
    process.env.NODE_PATH = process.env.NODE_PATH
        ? `${process.env.NODE_PATH}${path.delimiter}${appNodeModulesPath}`
        : appNodeModulesPath;
    Module._initPaths();
}

async function startServer({
    appNodeModulesPath,
    envFilePath,
    dataFilePath,
    rootDir,
    enableStaticRoutes = true,
    startMessage = 'Сервер запущено'
}) {
    initNodePath(appNodeModulesPath);
    require('dotenv').config({ path: envFilePath });

    // These dependencies resolve from app/node_modules, so load them after NODE_PATH setup.
    const getServerConfig = require('./config/cli');
    const createUpload = require('./config/upload');
    const createApp = require('./app');
    const storageBackend = (process.env.STORAGE_BACKEND || 'json').toLowerCase();
    const inventoryStore = storageBackend === 'postgres'
        ? require('./store/inventoryStorePg')
        : require('./store/inventoryStore');

    const { host, port, cache } = getServerConfig();
    const upload = createUpload(cache);
    await inventoryStore.initialize(dataFilePath);

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
        if (storageBackend === 'postgres') {
            console.log('Дані зберігаються в: PostgreSQL');
        } else {
            console.log(`Дані зберігаються в: ${dataFilePath}`);
        }
    });
}

module.exports = startServer;