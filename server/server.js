require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fsSync = require("fs")
const multer = require("multer");

const logger = require("./utilities/logger");

const app = express();
const PORT = process.env.PORT || 3001;

// -- MIDDLEWARE --
app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Логгер подключений
app.use((request, response, next) => {
    const start = Date.now();

    response.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl } = request;
        const { statusCode } = response;

        logger.http(`${method}: ${originalUrl} - response ${statusCode} - ${duration}ms`);
    });

    next();
});

// ROUTES
app.get("/", (request, response) => response.send("200"))
app.use("/api/auth", require("./routes/auth"));
app.use("/api/supervisors", require("./routes/supervisors"));
app.use("/api/persons", require("./routes/persons"));
app.use("/api/about", require("./routes/about"));
app.use("/api/performances", require("./routes/performances"));
app.use("/api/archive", require("./routes/archive"));
app.use("/api/events", require("./routes/events"));
app.use("/api/guests", require("./routes/guests"));

// -- ОБРАБОТЧИК ОШИБОК MULTER --
app.use((err, request, response, next) => {
    if (err instanceof multer.MulterError || (err.message && err.message.includes("Неподдерживаемый формат"))) {
        return response.status(400).json({ message: err.message });
    }
    next(err);
});

// Запуск
app.listen(PORT, function(){
    // Существует ли учётная запись администратора?
    const adminPath = path.join(__dirname, "data", "admin.json");

    if (!fsSync.existsSync(adminPath)) {
        logger.warn(
            "ВНИМАНИЕ: Файл учетной записи администратора 'data/admin.json' не найден! " +
            "Вход в панель управления будет невозможен.\n" +
            "Пожалуйста, запустите команду 'node create-admin.js [пароль]' в терминале для создания профиля."
        );
    };

    logger.info("Сервер запущен на localhost:" + PORT);
});
