#!/usr/bin/env node

const DEFAULT_BASE_URL = 'http://localhost:3000';
const baseUrl = (process.env.BASE_URL || process.argv[2] || DEFAULT_BASE_URL).replace(/\/$/, '');

const results = [];

function logStep(name, passed, details) {
    results.push({ name, passed, details });
    const icon = passed ? '[PASS]' : '[FAIL]';
    console.log(`${icon} ${name} - ${details}`);
}

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, options);
    const contentType = response.headers.get('content-type') || '';

    let body;
    if (contentType.includes('application/json')) {
        body = await response.json();
    } else {
        body = await response.text();
    }

    return {
        status: response.status,
        body,
        headers: response.headers
    };
}

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function run() {
    console.log(`Running Docker endpoint smoke test against: ${baseUrl}`);

    try {
        const healthInventory = await request('/inventory');
        const inventoryOk = healthInventory.status === 200 && Array.isArray(healthInventory.body);
        logStep('GET /inventory', inventoryOk, `status=${healthInventory.status}`);

        const registerPayload = {
            inventory_name: `Smoke Device ${Date.now()}`,
            description: 'Created by smoke-test-docker.js'
        };

        const created = await request('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerPayload)
        });

        const createdOk = created.status === 201 && isObject(created.body) && !!created.body.id;
        logStep('POST /register', createdOk, `status=${created.status}`);
        if (!createdOk) {
            throw new Error('Cannot continue without created item id');
        }

        const itemId = created.body.id;

        const byId = await request(`/inventory/${itemId}`);
        const byIdOk = byId.status === 200 && isObject(byId.body) && byId.body.id === itemId;
        logStep('GET /inventory/:id', byIdOk, `status=${byId.status}, id=${itemId}`);

        const updated = await request(`/inventory/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Updated Smoke Device', description: 'Updated by smoke test' })
        });
        const updatedOk = updated.status === 200 && isObject(updated.body) && updated.body.name === 'Updated Smoke Device';
        logStep('PUT /inventory/:id', updatedOk, `status=${updated.status}`);

        const search = await request(`/search?id=${encodeURIComponent(itemId)}&includePhoto=true`);
        const searchOk = search.status === 200 && isObject(search.body) && search.body.id === itemId;
        logStep('GET /search?id=...&includePhoto=true', searchOk, `status=${search.status}`);

        const docs = await request('/api-docs');
        const docsOk = docs.status === 200 || docs.status === 301 || docs.status === 302;
        logStep('GET /api-docs', docsOk, `status=${docs.status}`);

        const deleted = await request(`/inventory/${itemId}`, { method: 'DELETE' });
        const deleteOk = deleted.status === 200;
        logStep('DELETE /inventory/:id', deleteOk, `status=${deleted.status}`);

        const afterDelete = await request(`/inventory/${itemId}`);
        const afterDeleteOk = afterDelete.status === 404;
        logStep('GET /inventory/:id after delete', afterDeleteOk, `status=${afterDelete.status}`);

        const failed = results.filter(step => !step.passed);
        console.log('');
        console.log(`Summary: ${results.length - failed.length}/${results.length} checks passed.`);

        if (failed.length > 0) {
            process.exitCode = 1;
            return;
        }

        process.exitCode = 0;
    } catch (error) {
        logStep('Unhandled error', false, error.message);
        process.exitCode = 1;
    }
}

run();
