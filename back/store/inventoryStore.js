const fs = require('fs');
const path = require('path');

let inventory = [];
let dataFilePath = null;

// Допоміжна функція для збереження в JSON
function saveToFile() {
    if (!dataFilePath) return;
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(inventory, null, 2));
    } catch (error) {
        console.error('Помилка при збереженні даних:', error.message);
    }
}

// Ініціалізація: прочитати дані з файлу
function initialize(filePath) {
    dataFilePath = filePath;
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            inventory = JSON.parse(data) || [];
            console.log(`✓ Дані завантажені з ${filePath}`);
        } else {
            inventory = [];
            saveToFile();
            console.log(`✓ Новий файл даних створений: ${filePath}`);
        }
    } catch (error) {
        console.error(`Помилка при завантаженні даних: ${error.message}`);
        inventory = [];
    }
}

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
    saveToFile();
    return newItem;
}

function updateItem(id, { name, description }) {
    const item = findById(id);
    if (!item) return null;

    if (name) item.name = name;
    if (description) item.description = description;

    saveToFile();
    return item;
}

function updatePhoto(id, photoFilename) {
    const item = findById(id);
    if (!item) return null;

    item.photo = photoFilename;
    saveToFile();
    return item;
}

function removeItem(id) {
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return null;

    const deleted = inventory[index];
    inventory.splice(index, 1);
    saveToFile();
    return deleted;
}

module.exports = {
    initialize,
    getAll,
    findById,
    addItem,
    updateItem,
    updatePhoto,
    removeItem
};
