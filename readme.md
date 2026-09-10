# Сайт театральной студии "Чердак Хофнарра"

## О проекте
Проект включает в себя серверную и клиентскую часть, предназначен для получения информации о театральной студии и записи на актуальные спектакли.
Разработчики:
- Бычков Д.В.
- Тян Д.В.

## Установка и запуск

### Backend
Для корректной работы серверной части, требуется заранее установленный PostgreSQL >15 и node.js вместе с любым подходящим пакетным менеджером.
Здесь будет использоваться стандартный npm.
1. Установите необходимые зависимости:
```sh
cd server
npm install
```

2. Создайте учётную запись администратора:
```sh
npm run create_admin -- ваш_пароль
```

3. Cоздайте базу данных в PostgreSQL. Это можно сделать запросом через PSQL или pgAdmin:
```sql
CREATE DATABASE your_name_here;
```

4. Создайте файл .env и скопируйте в него содержимое .env.example.
Укажите адрес базы данных в отведённой строке:
user:password - учётные данные от базы данных,
localhost:5432 - IP-адрес базы данных,
your_name_here - название вашей базы данных.
```js
DATABASE_URL="postgresql://user:password@localhost:5432/your_name_here"
```

5. Верифицируйте базу данных:
```sh
npx prisma db update
npx prisma db sign
```

6. Запустите сервер.
```sh
npm run start
```

### Дамп базы данных
Дамп базы данных создаётся при помощи стандартных утилит PostgreSQL после верификации при помощи Prisma. Убедитесь, что утилиты pg_dump и pg_restore находятся в PATH, или укажите путь до них явно. Учтите: дамп не копирует фотографии, хранящиеся на сервере. Скопируйте их вручную из директории /server/public.
1. Создание дампа: 
```sh
pg_dump -U <username> -h <host> -p <port> -d <database_name> -F c -b -v -f backup.dump
```
2. Восстановление в существующую чистую БД:
```sh
pg_restore -U <username> -h <host> -p <port> -d <database_name> -v backup.dump
```
3. Восстановление с перезаписью:
```sh
pg_restore -U <username> -h <host> -p <port> -d <database_name> --clean --if-exists -v backup.dump
```

### Frontend
```bash
cd client
npm i
npm run dev
```
