const fs = require('fs');
const path = require('path');
const express = require('express');
const buildPhotoUrl = require('../utils/photoUrl');

function createInventoryRoutes({ cache, upload, inventoryStore }) {
    const router = express.Router();

    router.get('/inventory', async (req, res) => {
        const items = await inventoryStore.getAll();
        const list = items.map(item => ({
            ...item,
            photo_url: item.photo ? buildPhotoUrl(req, item.id) : null
        }));

        res.status(200).json(list);
    });

    router.post('/register', upload.single('photo'), async (req, res) => {
        const { inventory_name, description } = req.body;

        if (!inventory_name) {
            return res.status(400).send('Bad Request: name is required');
        }

        const newItem = await inventoryStore.addItem({
            name: inventory_name,
            description: description || '',
            photo: req.file ? req.file.filename : null
        });

        return res.status(201).json(newItem);
    });

    router.get('/inventory/:id', async (req, res) => {
        const item = await inventoryStore.findById(req.params.id);
        if (!item) return res.status(404).send('Not found');

        return res.status(200).json({
            ...item,
            photo_url: item.photo ? buildPhotoUrl(req, item.id) : null
        });
    });

    router.put('/inventory/:id', async (req, res) => {
        const item = await inventoryStore.updateItem(req.params.id, req.body);
        if (!item) return res.status(404).send('Not found');

        return res.status(200).json(item);
    });

    router.get('/inventory/:id/photo', async (req, res) => {
        const item = await inventoryStore.findById(req.params.id);
        if (!item || !item.photo) return res.status(404).send('Not found');

        const photoPath = path.resolve(cache, item.photo);
        res.status(200).setHeader('Content-Type', 'image/jpeg');
        return res.sendFile(photoPath);
    });

    router.put('/inventory/:id/photo', upload.single('photo'), async (req, res) => {
        const item = await inventoryStore.findById(req.params.id);
        if (!item) return res.status(404).send('Not found');

        if (req.file) {
            if (item.photo) {
                const oldPath = path.join(cache, item.photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            await inventoryStore.updatePhoto(item.id, req.file.filename);
        }

        return res.status(200).send('Photo updated');
    });

    router.delete('/inventory/:id', async (req, res) => {
        const deleted = await inventoryStore.removeItem(req.params.id);
        if (!deleted) return res.status(404).send('Not found');

        if (deleted.photo) {
            const photoPath = path.join(cache, deleted.photo);
            if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
        }

        return res.status(200).send('Deleted');
    });

    return router;
}

module.exports = createInventoryRoutes;
