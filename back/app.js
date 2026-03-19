const express = require('express');
const swaggerUi = require('swagger-ui-express');
const createInventoryRoutes = require('./routes/inventoryRoutes');
const createSearchRoutes = require('./routes/searchRoutes');
const createStaticRoutes = require('./routes/staticRoutes');
const createOpenApiSpec = require('./docs/openapi');

function createApp({ host, port, cache, upload, inventoryStore, rootDir = process.cwd() }) {
    const app = express();
    const openApiSpec = createOpenApiSpec({ host, port });

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

    app.use(createInventoryRoutes({ host, port, cache, upload, inventoryStore }));
    app.use(createSearchRoutes({ host, port, inventoryStore }));
    app.use(createStaticRoutes({ rootDir }));

    app.use((req, res) => {
        res.status(405).send('Method not allowed');
    });

    return app;
}

module.exports = createApp;
