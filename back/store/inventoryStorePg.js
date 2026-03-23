const { Pool } = require('pg');

let pool = null;
const dbLogsEnabled = (process.env.DB_VERBOSE_LOGS || process.env.NODE_ENV !== 'production').toString() !== 'false';

function logDb(message) {
    if (dbLogsEnabled) {
        console.log(`[DB] ${message}`);
    }
}


function getPool() {
    if (!pool) {
        pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            database: process.env.DB_NAME || process.env.POSTGRES_DB || 'inventory',
            user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
            password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres'
        });
    }
    return pool;
}

async function initialize() {
    const client = await getPool().connect();
    try {
        await client.query('SELECT 1');
        console.log('✓ PostgreSQL підключено');
        logDb('healthcheck SELECT 1 ok');
    } finally {
        client.release();
    }
}

async function getAll() {
    try {
        const { rows } = await getPool().query(
            'SELECT id, name, description, photo FROM inventory_items ORDER BY created_at DESC'
        );
        logDb(`getAll -> ${rows.length} rows`);
        return rows;
    } catch (error) {
        console.error('[DB] getAll failed:', error.message);
        throw error;
    }
}

async function findById(id) {
    try {
        const { rows } = await getPool().query(
            'SELECT id, name, description, photo FROM inventory_items WHERE id = $1 LIMIT 1',
            [id]
        );
        logDb(`findById(${id}) -> ${rows[0] ? 'found' : 'not found'}`);
        return rows[0] || null;
    } catch (error) {
        console.error(`[DB] findById(${id}) failed:`, error.message);
        throw error;
    }
}

async function addItem({ name, description = '', photo = null }) {
    const id = Date.now().toString();
    try {
        const { rows } = await getPool().query(
            `INSERT INTO inventory_items (id, name, description, photo)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, description, photo`,
            [id, name, description, photo]
        );
        logDb(`addItem -> inserted id=${id}, name="${name}"`);
        return rows[0];
    } catch (error) {
        console.error('[DB] addItem failed:', error.message);
        throw error;
    }
}

async function updateItem(id, { name, description }) {
    const existing = await findById(id);
    if (!existing) return null;

    const nextName = typeof name === 'string' && name.trim() ? name : existing.name;
    const nextDescription = typeof description === 'string' ? description : existing.description;

    try {
        const { rows } = await getPool().query(
            `UPDATE inventory_items
             SET name = $2,
                 description = $3,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, name, description, photo`,
            [id, nextName, nextDescription]
        );

        logDb(`updateItem(${id}) -> ${rows[0] ? 'updated' : 'not found'}`);
        return rows[0] || null;
    } catch (error) {
        console.error(`[DB] updateItem(${id}) failed:`, error.message);
        throw error;
    }
}

async function updatePhoto(id, photoFilename) {
    try {
        const { rows } = await getPool().query(
            `UPDATE inventory_items
             SET photo = $2,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, name, description, photo`,
            [id, photoFilename]
        );

        logDb(`updatePhoto(${id}) -> ${rows[0] ? 'updated' : 'not found'}`);
        return rows[0] || null;
    } catch (error) {
        console.error(`[DB] updatePhoto(${id}) failed:`, error.message);
        throw error;
    }
}

async function removeItem(id) {
    try {
        const { rows } = await getPool().query(
            'DELETE FROM inventory_items WHERE id = $1 RETURNING id, name, description, photo',
            [id]
        );

        logDb(`removeItem(${id}) -> ${rows[0] ? 'deleted' : 'not found'}`);
        return rows[0] || null;
    } catch (error) {
        console.error(`[DB] removeItem(${id}) failed:`, error.message);
        throw error;
    }
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
