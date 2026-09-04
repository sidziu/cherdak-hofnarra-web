import express from "express";
import fs from "fs/promises";
import path from "path";

import { db } from "../prisma/db.ts";
import logger from "../utilities/logger.js";
import { readJsonFile, writeJsonFile } from "../utilities/json_io.js";
import { createUploader } from "../utilities/uploader.js";
import authMiddleware from "../utilities/authMiddleware.js";

const __dirname = import.meta.dirname;

const router = express.Router();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 3001;

// Получить текст about
router.get("/", async function(request, response) {
    try {
        const aboutData = await readJsonFile("about.json", { text: "Информация о студии пока не добавлена." });
        response.json(aboutData);
    } catch (error) {
        logger.error("Ошибка чтения файла about.json:", error);
        response.status(500).json({ message: "Ошибка сервера при загрузке информации о студии." });
    }
});

// Обновить текст about
router.put("/", authMiddleware, async function(request, response) {
    try {
        const { text } = request.body;

        if (typeof text !== 'string') {
            return response.status(400).json({ message: "Поле text обязательно и должно быть строкой." });
        }

        const newAboutData = { text: text.trim() };

        await writeJsonFile("about.json", newAboutData);

        response.json({ 
            message: "Информация о студии успешно обновлена!", 
            data: newAboutData 
        });

    } catch (error) {
        logger.error("Ошибка при сохранении информации о студии:", error);
        response.status(500).json({ message: "Ошибка сервера при сохранении данных." });
    }
});

export default router;
