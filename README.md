# backend-course-2025-7

## Чому запити йдуть через app, а не напряму в back

У цьому проєкті сервіс app працює як gateway (reverse proxy) і єдина публічна точка входу.

- app (Nginx) відкритий назовні на порту 3000.
- back (Node.js API) доступний тільки всередині Docker-мережі та не має опублікованого порту на хості.
- front (статичний HTML) також внутрішній.

Тому весь клієнтський трафік іде на http://localhost:3000, а app маршрутизує його далі:

- API-шляхи та документація йдуть у back.
- HTML-сторінки та інші статичні шляхи йдуть у front.

Це налаштовано тут:

- експозиція сервісів: compose.yml
- правила gateway: app/nginx.gateway.conf

Переваги такого підходу:

- Одна URL-адреса для браузера, тестів і API-клієнтів.
- back не відкритий напряму назовні.
- Єдина точка для маршрутизації та proxy-заголовків.

## Потік запиту

1. Клієнт надсилає запит на http://localhost:3000
2. app перевіряє шлях за конфігом Nginx
3. Якщо шлях відповідає regex для API, app проксить запит на http://back:3001
4. Інакше app проксить запит на http://front:80
5. back виконує бізнес-логіку і повертає відповідь через app

## Правила маршрутизації (поточні)

У app/nginx.gateway.conf:

- / перенаправляє на /RegisterForm.html
- /(inventory|register|search|api-docs)(/.*)? -> back:3001
- усі інші шляхи -> front:80

## Огляд сервісів

- app: Nginx gateway, публічний, порт 3000
- back: API-сервіс (Express), внутрішній
- front: сервер статичних HTML, внутрішній
- db: PostgreSQL, внутрішній

## Запуск через Docker

З кореня проєкту:

1. Зібрати та запустити:

   docker compose up -d --build

2. Перевірити статус:

   docker compose ps

3. Подивитися логи за потреби:

   docker compose logs -f app
   docker compose logs -f back

## Тестування endpoint-ів без Postman

Є готовий smoke-test скрипт:

- scripts/smoke-test-docker.js

Запуск:

node scripts/smoke-test-docker.js

Опційно можна передати свій base URL:

BASE_URL=http://localhost:3000 node scripts/smoke-test-docker.js

Скрипт перевіряє ключові endpoint-и:

- GET /inventory
- POST /register
- GET /inventory/:id
- PUT /inventory/:id
- GET /search
- GET /api-docs
- DELETE /inventory/:id
- GET /inventory/:id after delete

## Корисний troubleshooting

Якщо запити повертають 502:

1. Перевір стан контейнера back:

   docker compose ps

2. Перевір логи бекенда:

   docker compose logs --tail=200 back

3. Виконай чисту перебудову:

   docker compose down
   docker compose up -d --build

За потреби перебудуй без кешу:

- docker compose build --no-cache
- docker compose up -d
