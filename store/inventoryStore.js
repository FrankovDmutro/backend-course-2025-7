const inventory = [];

function getAll() {
    return inventory;
}

function findById(id) {
    return inventory.find(item => item.id === id);
}

function addItem({ name, description = '', photo = null }) {
    const newItem = {
        id: Date.now().toString(),
        name,
        description,
        photo
    };

    inventory.push(newItem);
    return newItem;
}

function updateItem(id, { name, description }) {
    const item = findById(id);
    if (!item) return null;

    if (name) item.name = name;
    if (description) item.description = description;

    return item;
}

function updatePhoto(id, photoFilename) {
    const item = findById(id);
    if (!item) return null;

    item.photo = photoFilename;
    return item;
}

function removeItem(id) {
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return null;

    const deleted = inventory[index];
    inventory.splice(index, 1);
    return deleted;
}

module.exports = {
    getAll,
    findById,
    addItem,
    updateItem,
    updatePhoto,
    removeItem
};
