# backend-course-2025-6

Express-сервер для інвентаризації пристроїв з підтримкою CRUD-операцій, пошуку та завантаження фото.

## Поточна структура проєкту

```text
backend-course-2025-6/
├─ app.js
├─ main.js
├─ package.json
├─ RegisterForm.html
├─ SearchForm.html
├─ cache/
├─ config/
│  ├─ cli.js
│  └─ upload.js
├─ routes/
│  ├─ inventoryRoutes.js
│  ├─ searchRoutes.js
│  └─ staticRoutes.js
├─ store/
│  └─ inventoryStore.js
└─ utils/
   └─ photoUrl.js
```

## Що за що відповідає

- `main.js` - точка входу, читає CLI-параметри, створює app, запускає сервер.
- `app.js` - збирає Express-додаток, підключає middleware та роутери.
- `config/cli.js` - обробка параметрів `--host`, `--port`, `--cache`, створення cache-директорії.
- `config/upload.js` - конфігурація `multer` для завантаження фото.
- `routes/inventoryRoutes.js` - `/inventory`, `/register`, операції з фото та видалення.
- `routes/searchRoutes.js` - пошук пристрою (`GET /search`, `POST /search`).
- `routes/staticRoutes.js` - віддача HTML-форм.
- `store/inventoryStore.js` - in-memory сховище інвентарю.
- `utils/photoUrl.js` - генерація URL для фото.

## Встановлення і запуск

1. Встановіть залежності:

```bash
npm install
```

2. Запуск у dev-режимі:

```bash
npm run dev
```

3. Запуск без nodemon:

```bash
npm start
```

Значення за замовчуванням у `npm start`:
- `host`: `localhost`
- `port`: `3000`
- `cache`: `./cache`

## Запуск із власними параметрами

```bash
node main.js --host 127.0.0.1 --port 4000 --cache ./cache
```

Якщо передаєте параметри додатку через `nodemon`, обов'язково ставте `--` перед аргументами програми:

```bash
nodemon main.js -- --host localhost --port 3000 --cache ./cache
```

## HTML-форми

Після запуску:
- `http://localhost:3000/RegisterForm.html`
- `http://localhost:3000/SearchForm.html`

## Swagger

Інтерактивна документація API доступна за адресою:
- `http://localhost:3000/api-docs`

Через Swagger UI можна:
- переглядати всі endpoint-и;
- дивитися приклади payload;
- тестувати запити прямо з браузера (`Try it out`).

## Команди для перевірки API (Windows PowerShell / CMD)

Нижче послідовний сценарій перевірки. Запускайте, коли сервер уже працює.

1. Перевірити, що список порожній/доступний:

```bash
curl http://localhost:3000/inventory
```

2. Створити пристрій без фото:

```bash
curl -X POST http://localhost:3000/register ^
  -F "inventory_name=Laptop" ^
  -F "description=Office device"
```

3. Створити пристрій з фото:

```bash
curl -X POST http://localhost:3000/register ^
  -F "inventory_name=Phone" ^
  -F "description=With photo" ^
  -F "photo=@C:/path/to/photo.jpg"
```

4. Отримати список і скопіювати `id` потрібного елемента:

```bash
curl http://localhost:3000/inventory
```

5. Отримати елемент за `id`:

```bash
curl http://localhost:3000/inventory/<ID>
```

6. Оновити назву/опис:

```bash
curl -X PUT http://localhost:3000/inventory/<ID> ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Laptop Pro\",\"description\":\"Updated\"}"
```

7. Пошук через POST (вимога лабораторної):

```bash
curl -X POST http://localhost:3000/search ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "id=<ID>&has_photo=true"
```

8. Додаткова сумісність: пошук через GET (опційно):

```bash
curl "http://localhost:3000/search?id=<ID>&includePhoto=true"
```

9. Оновити фото:

```bash
curl -X PUT http://localhost:3000/inventory/<ID>/photo ^
  -F "photo=@C:/path/to/new-photo.jpg"
```

10. Отримати фото:

```bash
curl http://localhost:3000/inventory/<ID>/photo --output downloaded-photo.jpg
```

11. Видалити елемент:

```bash
curl -X DELETE http://localhost:3000/inventory/<ID>
```

12. Перевірити, що після видалення повертається 404:

```bash
curl http://localhost:3000/inventory/<ID>
```

## Коротка специфіка endpoint-ів

1. `GET /inventory`
- `200 OK`, масив елементів.

2. `POST /register`
- `multipart/form-data`: `inventory_name` (required), `description` (optional), `photo` (optional).
- `201 Created` або `400 Bad Request`.

3. `GET /inventory/:id`
- `200 OK` або `404 Not found`.

4. `PUT /inventory/:id`
- body: `name` та/або `description`.
- `200 OK` або `404 Not found`.

5. `GET /inventory/:id/photo`
- `200 OK` (image/jpeg) або `404 Not found`.

6. `PUT /inventory/:id/photo`
- `multipart/form-data`, поле `photo`.
- `200 OK` або `404 Not found`.

7. `DELETE /inventory/:id`
- `200 OK` або `404 Not found`.

8. `POST /search`
- `application/x-www-form-urlencoded`: `id`, `has_photo=true`.
- `200 OK` або `404 Not Found`.

9. `GET /search?id=<id>&includePhoto=true` (додатково)
- `200 OK` або `404 Not Found`.

## Postman

У репозиторій додано готову колекцію:
- `collection.json`

Що робити:
1. Відкрий Postman.
2. `Import` -> обери файл `collection.json`.
3. Задай значення змінних `baseUrl`, `itemId`, `photoPath`, `newPhotoPath`.
4. Запускай запити по черзі для перевірки всіх вимог.

## Відповідність вимогам (чекліст)

- Реєстрація пристрою (`POST /register`, `multipart/form-data`) - виконано.
- Список інвентарю (`GET /inventory`) - виконано.
- Отримання речі (`GET /inventory/:id`) - виконано.
- Оновлення даних (`PUT /inventory/:id`, JSON) - виконано.
- Отримання фото (`GET /inventory/:id/photo`, `Content-Type: image/jpeg`) - виконано.
- Оновлення фото (`PUT /inventory/:id/photo`) - виконано.
- Видалення (`DELETE /inventory/:id`) - виконано.
- Пошук з форми (`POST /search`, `x-www-form-urlencoded`, `id`, `has_photo`) - виконано.
- Форма реєстрації (`GET /RegisterForm.html`) - виконано.
- Форма пошуку (`GET /SearchForm.html`) - виконано.
- Невідомий/непідтримуваний метод -> `405 Method not allowed` - виконано.
- Успішні запити мають `200`, `POST /register` має `201` - виконано.
- Postman collection (`collection.json`) у репозиторії - виконано.

## Нотатки

- Дані інвентарю зберігаються в пам'яті процесу (після перезапуску сервера список очищається).
- Фото зберігаються в директорії `cache`.
- Для невідомих маршрутів повертається `405 Method not allowed`.
