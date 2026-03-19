const path = require('path');
const express = require('express');

function createStaticRoutes({ rootDir }) {
    const router = express.Router();
    const frontDir = path.resolve(rootDir, '../front');

    router.get('/RegisterForm.html', (req, res) => {
        res.sendFile(path.resolve(frontDir, 'RegisterForm.html'));
    });

    router.get('/SearchForm.html', (req, res) => {
        res.sendFile(path.resolve(frontDir, 'SearchForm.html'));
    });

    return router;
}

module.exports = createStaticRoutes;
