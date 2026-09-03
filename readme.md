# Сайт театральной студии "Чердак Хофнарра"

## О проекте
Проект включает в себя серверную и клиентскую часть, предназначен для получения информации о театральной студии и записи на актуальные спектакли.
Разработчики:
- Бычков Д.В.
- Тян Д.В.

## Установка и запуск

### Backend
Необходимо предварительно ввести URL PostgreSQL в .env. База данных уже должна быть создана, но пустой.

```bash
node create-admin.js [password]
npx prisma@latest db update
npx prisma@latest db sign
npm run start
```

### Frontend
```bash
cd client
npm i
npm run dev
```
