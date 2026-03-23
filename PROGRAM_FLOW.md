# Як працює програма: покроково, з викликами функцій і Docker запуском

## 1) Загальна ідея архітектури

У Docker працюють 4 сервіси:

- `app` - Nginx gateway (єдиний публічний порт `3000`)
- `back` - Node.js/Express API (внутрішній порт `3001`)
- `front` - Nginx зі статичними HTML
- `db` - PostgreSQL

Потік трафіку:

1. Клієнт звертається на `http://localhost:3000`
2. `app/nginx.gateway.conf` маршрутизує:
   - `/inventory`, `/register`, `/search`, `/api-docs` -> `back:3001`
   - інші шляхи -> `front:80`
3. `back` обробляє бізнес-логіку
4. Дані зберігаються в PostgreSQL (у Docker) або JSON (локально), залежно від `STORAGE_BACKEND`

---

## 2) Які entrypoint-и і навіщо їх два

### `back/main.js`

Основний entrypoint для Docker-сервісу `back`.

- У `compose.yml` для `back` задано: `command: ["node", "./back/main.js"]`
- Передає в bootstrap параметри запуску API-режиму:
  - `enableStaticRoutes: false`
  - шляхи до `app/.env`, `app/data.json`, `app/node_modules`

### `app/main.js`

Локальний entrypoint для запуску через `npm --prefix ./app run start|dev`.

- Використовує той самий bootstrap `back/bootstrapServer.js`
- Запускає сервер з контексту папки `app`
- Зручний для локального запуску без Docker

Обидва entrypoint-и використовують одну спільну функцію запуску `startServer(...)`.

---

## 3) Детальний старт бекенда: ланцюжок викликів

Нижче порядок викликів у рантаймі для Docker (`node ./back/main.js`).

### Крок 1. `back/main.js`

Викликає:

```js
startServer({ ... })
```

з параметрами:

- `appNodeModulesPath`
- `envFilePath`
- `dataFilePath`
- `rootDir`
- `enableStaticRoutes`
- `startMessage`

### Крок 2. `back/bootstrapServer.js -> startServer(...)`

#### 2.1 `initNodePath(appNodeModulesPath)`

- Оновлює `process.env.NODE_PATH`
- Викликає `Module._initPaths()`
- Потрібно, щоб залежності знаходилися з `app/node_modules`

#### 2.2 `require('dotenv').config({ path: envFilePath })`

- Завантажує змінні оточення з `app/.env`

#### 2.3 Завантаження модулів конфігурації

Після налаштування `NODE_PATH` підтягуються:

- `getServerConfig = require('./config/cli')`
- `createUpload = require('./config/upload')`
- `createApp = require('./app')`

Далі обирається сховище:

```js
const storageBackend = (process.env.STORAGE_BACKEND || 'json').toLowerCase();
const inventoryStore = storageBackend === 'postgres'
    ? require('./store/inventoryStorePg')
    : require('./store/inventoryStore');
```

#### 2.4 `getServerConfig()` із `back/config/cli.js`

- Парсить CLI/env (`host`, `port`, `cache`)
- Перевіряє коректність порту
- Створює директорію кешу, якщо немає
- Повертає `{ host, port, cache }`

#### 2.5 `createUpload(cache)` із `back/config/upload.js`

- Створює `multer.diskStorage(...)`
- destination -> cache directory
- filename -> `Date.now() + extension`

#### 2.6 `await inventoryStore.initialize(dataFilePath)`

Викликається залежно від бекенду збереження:

- JSON режим (`inventoryStore.js`): читає/створює `data.json`
- PostgreSQL режим (`inventoryStorePg.js`): перевіряє конект `SELECT 1`

#### 2.7 `createApp({ ... })` із `back/app.js`

Формує Express app:

- `express.json()`
- `express.urlencoded(...)`
- Swagger UI на `/api-docs` через `createOpenApiSpec({host, port})`
- Підключає роутери:
  - `createInventoryRoutes(...)`
  - `createSearchRoutes(...)`
  - `createStaticRoutes(...)` (тільки якщо `enableStaticRoutes=true`)
- Fallback: `405 Method not allowed`

#### 2.8 `app.listen(port, host, ...)`

- Запускає HTTP сервер
- Логує URL, cache path, тип сховища

---

## 4) Виклики функцій у маршрутах (API)

## 4.1 `GET /inventory`

Ланцюжок:

1. `inventoryRoutes.js` -> handler `router.get('/inventory', ...)`
2. `inventoryStore.getAll()`
3. Для кожного item:
   - якщо є `photo`, будує `photo_url` через `buildPhotoUrl(req, item.id)`
4. Повертає масив JSON

## 4.2 `POST /register`

Ланцюжок:

1. `upload.single('photo')` (multer) зберігає файл у cache
2. Валідація `inventory_name`
3. `inventoryStore.addItem({ name, description, photo })`
4. `201 Created` + створений item

## 4.3 `GET /inventory/:id`

1. `inventoryStore.findById(id)`
2. Якщо не знайдено -> `404`
3. Інакше повертає item + `photo_url` (якщо є фото)

## 4.4 `PUT /inventory/:id`

1. `inventoryStore.updateItem(id, req.body)`
2. Якщо `null` -> `404`
3. Інакше `200` + updated item

## 4.5 `GET /inventory/:id/photo`

1. `inventoryStore.findById(id)`
2. Якщо немає item або photo -> `404`
3. `res.sendFile(path.resolve(cache, item.photo))`

## 4.6 `PUT /inventory/:id/photo`

1. `upload.single('photo')`
2. `inventoryStore.findById(id)`
3. Якщо item має старе фото -> видаляється старий файл з cache
4. `inventoryStore.updatePhoto(id, newFilename)`
5. `200 Photo updated`

## 4.7 `DELETE /inventory/:id`

1. `inventoryStore.removeItem(id)`
2. Якщо `null` -> `404`
3. Якщо у видаленого item було фото -> видаляється файл
4. `200 Deleted`

## 4.8 `GET /search` і `POST /search`

Обидва викликають внутрішню `handleSearch(source, req, res)`:

1. Береться `id` з query/body
2. `inventoryStore.findById(id)`
3. Якщо не знайдено -> `404 Not Found`
4. Якщо `includePhoto/has_photo` truthy -> додається `photo_link`
5. `200` + JSON

---

## 5) Як працює шар збереження даних

## 5.1 JSON (`back/store/inventoryStore.js`)

Основні функції:

- `initialize(filePath)`
- `getAll()`
- `findById(id)`
- `addItem(payload)`
- `updateItem(id, payload)`
- `updatePhoto(id, photoFilename)`
- `removeItem(id)`

Після змін викликається `saveToFile()` -> запис у JSON.

## 5.2 PostgreSQL (`back/store/inventoryStorePg.js`)

Основні функції ті самі за контрактом, але через SQL:

- `getPool()` створює `pg.Pool`
- `initialize()` перевіряє БД (`SELECT 1`)
- CRUD через SQL у таблиці `inventory_items`

Схема таблиці задається в `db/init/01-init.sql` і автоматично створюється при першому старті `db` контейнера.

---

## 6) Як OpenAPI/Swagger формується

1. `back/app.js` викликає `createOpenApiSpec({ host, port })`
2. `back/docs/openapi.js` повертає специфікацію OpenAPI 3.0.3
3. `swagger-ui-express` публікує документацію на `/api-docs`

---

## 7) Покроковий запуск через Docker

Виконуйте з кореня проєкту.

### 7.1 Зібрати і підняти контейнери

```bash
docker compose up -d --build
```

### 7.2 Перевірити стан сервісів

```bash
docker compose ps
```

Очікувано `app`, `back`, `front`, `db` у стані `running` (або `healthy` для db).

### 7.3 Переглянути логи при потребі

```bash
docker compose logs -f app
docker compose logs -f back
docker compose logs -f db
```

### 7.4 Відкрити сервіс у браузері

- `http://localhost:3000` -> редірект на `RegisterForm.html`
- `http://localhost:3000/api-docs` -> Swagger UI

### 7.5 Швидка перевірка API (автотест)

У проєкті є готовий smoke-test:

```bash
node scripts/smoke-test-docker.js
```

Скрипт перевіряє:

- `GET /inventory`
- `POST /register`
- `GET /inventory/:id`
- `PUT /inventory/:id`
- `GET /search`
- `GET /api-docs`
- `DELETE /inventory/:id`
- повторний `GET /inventory/:id` (має бути 404)

### 7.6 Зупинка

```bash
docker compose down
```

(Якщо потрібно видалити volume БД теж: `docker compose down -v`.)

---

## 8) Коротка послідовність одного запиту (приклад `POST /register`)

1. Клієнт -> `http://localhost:3000/register`
2. Nginx (`app`) -> проксі на `http://back:3001/register`
3. Express route `POST /register`
4. `multer` зберігає файл у cache
5. `inventoryStore.addItem(...)` -> INSERT у PostgreSQL (у Docker)
6. `201 Created` повертається назад через gateway клієнту

---

## 9) Де змінювати поведінку

- Маршрути API: `back/routes/*`
- Конфіг запуску/CLI: `back/config/cli.js`
- Upload і cache: `back/config/upload.js`
- Сховище JSON: `back/store/inventoryStore.js`
- Сховище PostgreSQL: `back/store/inventoryStorePg.js`
- Swagger: `back/docs/openapi.js`
- Gateway маршрутизація: `app/nginx.gateway.conf`
- Docker оркестрація: `compose.yml`

Цей документ можна використовувати як технічну карту для дебагу і onboarding.
