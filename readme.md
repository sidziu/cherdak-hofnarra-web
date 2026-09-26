# Сайт театральной студии "Чердак Хофнарра"

## О проекте
Проект включает в себя серверную и клиентскую часть, предназначен для получения информации о театральной студии и записи на актуальные спектакли.
Разработчики:
- Бычков Д.В.
- Тян Д.В.

## Установка и запуск

### Backend
Требуется установленный Docker.

1. Скопируйте файл .env.example. Переименуйте его в .env и заполните согласно образцу.
```dotenv
DB_USER= # логин
DB_PASSWORD= # пароль
DB_NAME= # название базы данных
DB_PORT= # публичный порт

DATABASE_URL=postgresql://логин:пароль@postgres:5432/название # порт не меняем

PORT= # порт сервера
SERVER_URL=http://localhost:3001 # общедоступный URL без бэкслэша в конце
JWT_SECRET= # секретный ключ
```

2. Создайте образ и запустите сервер.
```sh
docker compose up
```

3. Создайте администратора.
```sh
docker compose exec -it server sh
npm run create_admin -- ваш_пароль
exit
```

### Дамп базы данных
Дамп базы данных создаётся при помощи стандартных утилит PostgreSQL после верификации при помощи Prisma. Учтите: дамп не копирует фотографии, хранящиеся на сервере.
1. Создание дампа: 
```sh
pg_dump -U username -h host -p port -d database_name -F c -b -v -f backup.dump
```
2. Восстановление в существующую чистую БД:
```sh
pg_restore -U username -h host -p port -d database_name -v backup.dump
```
3. Восстановление с перезаписью:
```sh
pg_restore -U username -h host -p port -d database_name --clean --if-exists -v backup.dump
```

### Frontend
```bash
cd client
npm i
npm run dev
```
