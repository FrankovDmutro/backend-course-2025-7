const express = require('express');
const buildPhotoUrl = require('../utils/photoUrl');

function shouldIncludePhoto(value) {
    return value === 'true' || value === 'on' || value === true || value === '1';
}

function createSearchRoutes({ inventoryStore }) {
    const router = express.Router();

    const handleSearch = (source, req, res) => {
        const id = source.id;
        const includePhoto = source.includePhoto || source.has_photo;
        const item = inventoryStore.findById(id);

        if (!item) return res.status(404).send('Not Found');

        const responseData = { ...item };
        if (shouldIncludePhoto(includePhoto)) {
            responseData.photo_link = buildPhotoUrl(req, id);
        }

        return res.status(200).json(responseData);
    };

    router.get('/search', (req, res) => handleSearch(req.query, req, res));
    router.post('/search', (req, res) => handleSearch(req.body, req, res));

    return router;
}

module.exports = createSearchRoutes;
