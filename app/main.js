const path = require('path');
const startServer = require('../back/bootstrapServer');

startServer({
    appNodeModulesPath: path.join(__dirname, 'node_modules'),
    envFilePath: path.join(__dirname, '.env'),
    dataFilePath: path.join(__dirname, 'data.json'),
    rootDir: __dirname,
    startMessage: 'Сервер запущено'
});