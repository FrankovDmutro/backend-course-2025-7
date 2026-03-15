const path = require('path');
const express = require('express');

function createStaticRoutes({ rootDir }) {
    const router = express.Router();

    router.get('/RegisterForm.html', (req, res) => {
        res.sendFile(path.resolve(rootDir, 'RegisterForm.html'));
    });

    router.get('/SearchForm.html', (req, res) => {
        res.sendFile(path.resolve(rootDir, 'SearchForm.html'));
    });

    return router;
}

module.exports = createStaticRoutes;
