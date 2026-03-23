const path = require('path');
const startServer = require('./bootstrapServer');

startServer({
    appNodeModulesPath: path.resolve(__dirname, '../app/node_modules'),
    envFilePath: path.resolve(__dirname, '../app/.env'),
    dataFilePath: path.resolve(__dirname, '../app/data.json'),
    rootDir: path.resolve(__dirname, '..'),
    enableStaticRoutes: false,
    startMessage: 'API сервер запущено'
}).catch((error) => {
    console.error('Помилка запуску API сервера:', error);
    process.exit(1);
});
