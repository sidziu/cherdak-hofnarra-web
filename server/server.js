// -- DEPENDENCIES --
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fsSync from "fs";
import multer from "multer";

import authRouter from "./routes/auth.js";
import supervisorsRouter from "./routes/supervisors.js";
import personsRouter from "./routes/persons.js";
import aboutRouter from "./routes/about.js";
import performancesRouter from "./routes/performances.js";
import archiveRouter from "./routes/archive.js";
import eventsRouter from "./routes/events.js";
import guestsRouter from "./routes/guests.js";

import logger from "./utilities/logger.js";

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 3001;
const __dirname = import.meta.dirname;

const app = express();

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
app.use("/api/auth", authRouter);
app.use("/api/supervisors", supervisorsRouter);
app.use("/api/persons", personsRouter);
app.use("/api/about", aboutRouter);
app.use("/api/performances", performancesRouter);
app.use("/api/archive", archiveRouter);
app.use("/api/events", eventsRouter);
app.use("/api/guests", guestsRouter);

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

    logger.info(`Сервер прослушивает порт ${PORT}. Доступ по адресу ${SERVER_URL}.`);
});
