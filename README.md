# backend-course-2025-7

## Коротко про проєкт

Це багатоконтейнерний проєкт на Docker Compose.

Головна ідея:
- зовні відкритий тільки один сервіс app на порту 3000;
- весь трафік проходить через Nginx gateway;
- back, front і db працюють у внутрішній Docker-мережі.

Тобто користувач завжди звертається лише до http://localhost:3000.

## Архітектура

Клієнт (Browser/Postman/curl)
-> app (Nginx gateway, порт 3000)
-> back (Express API, порт 3001 у внутрішній мережі)
-> db (PostgreSQL, порт 5432 у внутрішній мережі)

Окремо:
app (Nginx gateway) -> front (Nginx static, внутрішній)

## Чому порти виглядають заблокованими

У compose.yml проброшений на хост тільки порт app:

- 3000:3000

Для back/front/db немає секції ports, тому:
- back недоступний напряму з localhost:3001;
- front недоступний напряму;
- db недоступна напряму з хоста (без додаткового пробросу порту).

Це зроблено спеціально: одна публічна точка входу через gateway.

## Як працює Nginx gateway

Конфіг: app/nginx.gateway.conf

Правила:
1. / -> редірект на /RegisterForm.html
2. /(inventory|register|search|api-docs)(/.*)? -> проксі на back:3001
3. всі інші шляхи -> проксі на front:80

Отже:
- API йде у back;
- HTML/CSS/JS віддає front;
- для клієнта все виглядає як один сервер на localhost:3000.

## Ролі сервісів

- app: Nginx reverse proxy, єдина публічна точка входу
- back: Node.js/Express API з бізнес-логікою
- front: статичні HTML-сторінки
- db: PostgreSQL (внутрішній сервіс)

## Як Docker використовується в проєкті

1. Dockerfile збирає образ для back:
- базовий образ node:22-alpine;
- інсталяція залежностей з app/package.json;
- копіювання app, back, front у контейнер.

2. compose.yml підіймає всі сервіси разом:
- app, back, front, db;
- налаштовує залежності depends_on;
- для db є healthcheck;
- для db використовується volume db_data для збереження даних.

3. Контейнери спілкуються у внутрішній мережі за іменами сервісів:
- app звертається до back як back:3001;
- app звертається до front як front:80;
- back звертається до db як db:5432.

## Важливий факт для захисту

У поточній реалізації інвентар зберігається у JSON, а не в PostgreSQL.

Де це видно:
- back/store/inventoryStore.js читає/пише через fs;
- дані зберігаються у app/data.json;
- db/init/01-init.sql створює таблицю, але API зараз не виконує SQL-операції.

Тобто база підготовлена, але поточний storage для API файловий.

## Потік запиту (приклад POST /register)

1. Клієнт надсилає POST http://localhost:3000/register
2. app (Nginx) маршрутизує запит у back:3001
3. back обробляє запит через inventoryRoutes
4. inventoryStore додає запис у app/data.json
5. Відповідь повертається клієнту через app

## Запуск проєкту

З кореня проєкту:

```bash
docker compose up -d --build
docker compose ps
```

Логи:

```bash
docker compose logs -f app
docker compose logs -f back
docker compose logs -f db
```

Зупинка:

```bash
docker compose down
```

## Як перевірити, що все працює

1. Перевір API через gateway:

```bash
curl http://localhost:3000/inventory
```

2. Створи тестовий запис:

```bash
curl -X POST http://localhost:3000/register -F "inventory_name=Test item" -F "description=demo"
```

3. Перевір JSON у контейнері back:

```bash
docker compose exec back sh -lc "cat /usr/src/app/app/data.json"
```

4. Перевір таблицю в PostgreSQL:

```bash
docker compose exec db psql -U postgres -d inventory -c "SELECT COUNT(*) FROM inventory_items;"
```

Якщо після POST зростають дані в data.json, а не в таблиці, значить API зараз працює через файлове сховище.

## Швидкий текст для захисту

У проєкті реалізована gateway-архітектура: зовні доступний лише Nginx-контейнер app на порту 3000. Він маршрутизує API-запити в back, а статичні файли у front. Back/front/db ізольовані у внутрішній Docker-мережі без публічних портів. Проєкт підіймається через Docker Compose однією командою. На поточному етапі API зберігає інвентар у app/data.json, а PostgreSQL контейнер і схема вже підготовлені для переходу на SQL-збереження.
