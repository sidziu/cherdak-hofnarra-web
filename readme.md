# Сайт театральной студии "Чердак Хофнарра"

## О проекте
Проект включает в себя серверную и клиентскую часть, предназначен для получения информации о театральной студии и записи на актуальные спектакли.
Разработчики:
- Бычков Д.В.
- Тян Д.В.

## Установка и запуск

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

3. Создайте администратора. Вводите команды по порядку.
```sh
docker compose exec -it server sh
npm run create_admin -- ваш_пароль
exit
```

### Дамп базы данных
Дамп базы данных создаётся при помощи утилит из контейнера с PostgreSQL. Дамп не копирует фотографии, хранящиеся на server/public.
1. Создание дампа: 
```sh
docker exec -t cherdak_hofnarra_postgres pg_dump -U cherdak_user -d cherdak_db -F c -b -v -f /tmp/backup.dump
docker cp cherdak_hofnarra_postgres:/tmp/backup.dump ./backup.dump
docker exec cherdak_hofnarra_postgres rm /tmp/backup.dump
```
2. Восстановление из дампа:
```sh
docker cp backup.dump cherdak_hofnarra_postgres:/backup.dump
docker exec -it cherdak_hofnarra_postgres pg_restore -U cherdak_user -d cherdak_db --no-owner --no-acl -v --clean /backup.dump
docker exec -it cherdak_hofnarra_postgres rm /backup.dump
```
3. Восстановление сохранённой папки public:
```sh
docker cp ./public/. cherdak_hofnarra_server:/app/public
```
