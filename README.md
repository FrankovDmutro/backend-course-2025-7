# backend-course-2025-7

Сервіс інвентаризації на Express з Docker-оточенням для звичайного запуску, dev-режиму з автоперезапуском і відлагодженням через Chrome DevTools.

## Що потрібно перед стартом

- Docker Desktop (або Docker Engine + Compose Plugin)
- Postman

## Файли конфігурації

- compose.yml: базовий запуск app + PostgreSQL
- compose.dev.yml: dev-override (nodemon, монтування коду, inspector порт)
- .env: локальні секрети і параметри запуску
- .env.sample: приклад змінних для репозиторію
- db/init.sql: SQL-ініціалізація БД при першому старті Postgres

## Налаштування .env

1. Якщо ще немає локального env-файлу, створіть .env на основі .env.sample.
2. Заповніть реальні значення.

Приклад мінімально необхідних змінних:

```env
SERVER_HOST=0.0.0.0
PORT=3000
CACHE_DIR=./cache

DB_HOST=db
DB_PORT=5432
DB_NAME=inventory
DB_USER=inventory_user
DB_PASSWORD=inventory_pass
DATABASE_URL=postgresql://inventory_user:inventory_pass@db:5432/inventory
```

## Запуск через Docker

Запуск прод-подібного режиму:

```bash
docker compose -f compose.yml up -d --build
```

Запуск dev-режиму (nodemon + debug):

```bash
docker compose -f compose.yml -f compose.dev.yml up -d --build
```

Перевірити статус контейнерів:

```bash
docker compose -f compose.yml -f compose.dev.yml ps
```

Подивитися логи app:

```bash
docker compose -f compose.yml -f compose.dev.yml logs app --tail 100
```

Зупинити контейнери:

```bash
docker compose -f compose.yml -f compose.dev.yml down
```

## Dev-режим: nodemon і hot reload

У dev-режимі сервіс запускається через nodemon всередині контейнера.

Ознаки коректної роботи:

- У логах є рядок з nodemon starting.
- Після зміни .js-файлу на диску у логах з'являється nodemon restarting due to changes.

Це означає, що застосунок перезапускається без перебудови контейнера.

## Відлагодження через Chrome (node --inspect)

У dev-конфігурації відкрито порт 9229 і запуск іде з inspect.

Як перевірити:

1. Запустіть dev-контейнери.
2. Відкрийте в Chrome адресу chrome://inspect/#devices.
3. Оберіть Open dedicated DevTools for Node.
4. Підключіться до процесу на localhost:9229.
5. Відкрийте будь-який handler у routes, поставте breakpoint.
6. Надішліть запит через Postman і переконайтесь, що виконання зупинилося на breakpoint.

Технічна перевірка inspector endpoint:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:9229/json/version
```

## Postman: перевірка API

У репозиторії є колекція:

- collection.json

Що зробити:

1. Import у Postman файлу collection.json.
2. Виставити змінні колекції:
- baseUrl = http://localhost:3000
- itemId = id елемента, створеного в попередньому запиті
- photoPath = шлях до локального зображення
- newPhotoPath = шлях до іншого зображення
3. Прогнати запити по черзі.

Очікування по статусах:

- GET /inventory -> 200
- POST /register -> 201
- GET /inventory/:id -> 200 або 404
- PUT /inventory/:id -> 200 або 404
- PUT /inventory/:id/photo -> 200 або 404
- GET /inventory/:id/photo -> 200 або 404
- POST /search -> 200 або 404
- DELETE /inventory/:id -> 200 або 404

## Корисні команди діагностики

Перезапуск тільки app-сервісу:

```bash
docker compose -f compose.yml -f compose.dev.yml restart app
```

Перевірити, що app відповідає:

```bash
curl http://localhost:3000/inventory
```

Подивитися останні логи БД:

```bash
docker compose -f compose.yml -f compose.dev.yml logs db --tail 100
```

## Скидання БД (якщо потрібно заново виконати init.sql)

Увага: команда нижче видаляє docker volume з даними Postgres.

```bash
docker compose -f compose.yml -f compose.dev.yml down -v
docker compose -f compose.yml -f compose.dev.yml up -d --build
```

## Доступні URL

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs
- Register form: http://localhost:3000/RegisterForm.html
- Search form: http://localhost:3000/SearchForm.html
