const fs = require('fs');

let inventory = [];
let dataFilePath = null;
const storeLogsEnabled = (process.env.DB_VERBOSE_LOGS || process.env.NODE_ENV !== 'production').toString() !== 'false';

function logStore(message) {
    if (storeLogsEnabled) {
        console.log(`[JSON] ${message}`);
    }
}

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
async function initialize(filePath) {
    dataFilePath = filePath;
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            inventory = JSON.parse(data) || [];
            console.log(`✓ Дані завантажені з ${filePath}`);
            logStore(`initialize -> loaded ${inventory.length} items`);
        } else {
            inventory = [];
            saveToFile();
            console.log(`✓ Новий файл даних створений: ${filePath}`);
            logStore('initialize -> created empty data file');
        }
    } catch (error) {
        console.error(`Помилка при завантаженні даних: ${error.message}`);
        inventory = [];
        logStore(`initialize -> fallback to empty store (${error.message})`);
    }
}

async function getAll() {
    logStore(`getAll -> ${inventory.length} items`);
    return inventory;
}

async function findById(id) {
    const item = inventory.find(existingItem => existingItem.id === id) || null;
    logStore(`findById(${id}) -> ${item ? 'found' : 'not found'}`);
    return item;
}

async function addItem({ name, description = '', photo = null }) {
    const newItem = {
        id: Date.now().toString(),
        name,
        description,
        photo
    };

    inventory.push(newItem);
    saveToFile();
    logStore(`addItem -> inserted id=${newItem.id}, name="${name}"`);
    return newItem;
}

async function updateItem(id, { name, description }) {
    const item = inventory.find(existingItem => existingItem.id === id);
    if (!item) return null;

    if (name) item.name = name;
    if (description) item.description = description;

    saveToFile();
    logStore(`updateItem(${id}) -> updated`);
    return item;
}

async function updatePhoto(id, photoFilename) {
    const item = inventory.find(existingItem => existingItem.id === id);
    if (!item) return null;

    item.photo = photoFilename;
    saveToFile();
    logStore(`updatePhoto(${id}) -> updated photo=${photoFilename}`);
    return item;
}

async function removeItem(id) {
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return null;

    const deleted = inventory[index];
    inventory.splice(index, 1);
    saveToFile();
    logStore(`removeItem(${id}) -> deleted`);
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
