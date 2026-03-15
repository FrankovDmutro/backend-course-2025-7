const express = require('express');
const buildPhotoUrl = require('../utils/photoUrl');

function createSearchRoutes({ host, port, inventoryStore }) {
    const router = express.Router();

    const handleSearch = (source, res) => {
        const id = source.id;
        const includePhoto = source.includePhoto || source.has_photo;
        const item = inventoryStore.findById(id);

        if (!item) return res.status(404).send('Not Found');

        const responseData = { ...item };
        if (includePhoto === 'true' || includePhoto === 'on' || includePhoto === true || includePhoto === '1') {
            responseData.photo_link = buildPhotoUrl(host, port, id);
        }

        return res.status(200).json(responseData);
    };

    router.get('/search', (req, res) => handleSearch(req.query, res));
    router.post('/search', (req, res) => handleSearch(req.body, res));

    return router;
}

module.exports = createSearchRoutes;
