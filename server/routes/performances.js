import express from "express";
import fs from "fs/promises";
import path from "path";

import logger from "../utilities/logger.js";
import { readJsonFile, writeJsonFile } from "../utilities/db.js";
import { createUploader } from "../utilities/uploader.js";
import authMiddleware from "../utilities/authMiddleware.js";

const __dirname = import.meta.dirname;

const router = express.Router();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 3001;

const uploadEvent = createUploader("images/events", [".png", ".jpg", ".jpeg", ".webp"]);

// Получить список событий
router.get("/", async function(request, response) {
    try {
        const events = await readJsonFile("events.json", []);
        const performances = await readJsonFile("performances.json", []);

        const now = new Date();
        let hasChanges = false;

        const checkedEvents = events.map(event => {
            if (event.activestate === true && new Date(event.date) < now) {
                hasChanges = true;
                return { ...event, activestate: false };
            }
            return event;
        });

        if (hasChanges) {
            logger.info("Обнаружены устаревшие показы. Переведены в неактивное состояние.");
            await writeJsonFile("events.json", checkedEvents);
        }

        const groupedData = performances.map(perf => {
            const perfEvents = checkedEvents.filter(e => e.performanceReferenceID === perf.id);

            perfEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

            const mappedEvents = perfEvents.map(e => ({
                activestate: e.activestate,
                eventID: e.eventID,
                scene: e.scene,
                date: e.date
            }));

            return {
                id: perf.id,
                title: perf.title,
                genre: perf.genre,
                director: perf.director,
                description: perf.description,
                duration: perf.duration,
                rating: perf.rating,
                imageUrl: `${SERVER_URL}/images/events/${perf.image}`,
                performances: mappedEvents
            };
        });

        response.json(groupedData);

    } catch (error) {
        logger.error("Ошибка чтения базы данных афиши:", error);
        response.status(500).json({ message: "Ошибка сервера при загрузке афиши." });
    }
});

// Добавить спектакль
router.post("/", authMiddleware, uploadEvent.single("image"), async function (request, response) {
    try {
        const { title, genre, director, description, duration, rating } = request.body;
        const file = request.file;

        const parsedDuration = parseInt(duration, 10);

        if (
            !title?.trim() || !genre?.trim() || !director?.trim() || 
            !description?.trim() || isNaN(parsedDuration) || !rating?.trim() || !file
        ) {
            if (file) await fs.unlink(file.path);
            return response.status(400).json({ message: "Необходимо заполнить все поля спектакля и загрузить постер." });
        }

        const performances = await readJsonFile("performances.json", []);

        const newPerformance = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            title: title.trim(),
            genre: genre.trim(),
            director: director.trim(),
            description: description.trim(),
            duration: parsedDuration,
            rating: rating.trim(),
            image: file.filename
        };

        performances.push(newPerformance);
        await writeJsonFile("performances.json", performances);

        response.status(201).json({ message: "Спектакль добавлен!", performance: newPerformance });
    } catch (error) {
        logger.error("Ошибка при сохранении спектакля:", error);
        response.status(500).json({ message: "Ошибка сервера при сохранении спектакля." });
    }
});

// Удаление спектакля
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        
        const perfData = await readJsonFile("performances.json", []);
        
        const perfToDelete = perfData.find(p => p.id === id);
        if (!perfToDelete) return response.status(404).json({ message: "Спектакль не найден." });

        // Проверка на использование фотографии в архиве и других спектаклях перед удалением с диска
        const archiveData = await readJsonFile("archive.json", []);
        
        const isUsedInArchive = archiveData.some(item => item.image === perfToDelete.image);
        const isUsedInOtherPerformances = perfData.some(p => p.id !== id && p.image === perfToDelete.image);

        if (!isUsedInArchive && !isUsedInOtherPerformances) {
            try {
                await fs.unlink(path.join(__dirname, "..", "public", "images", "events", perfToDelete.image));
            } catch (e) { 
                logger.warn("Картинка спектакля не найдена для удаления."); 
            }
        } else {
            logger.info(`Постер ${perfToDelete.image} не удален с диска, так как используется в других записях.`);
        }

        const updatedPerfs = perfData.filter(p => p.id !== id);
        await writeJsonFile("performances.json", updatedPerfs);

        // Каскадное удаление. Удаляем все события (показы), привязанные к этому спектаклю
        let eventsData = await readJsonFile("events.json", []);
        const initialLength = eventsData.length;
        eventsData = eventsData.filter(e => e.performanceReferenceID !== id);
        
        if (eventsData.length !== initialLength) {
            await writeJsonFile("events.json", eventsData);
            logger.info(`Удалены зависимые события для спектакля ID: ${id}`);
        }

        response.json({ message: "Спектакль и все его показы удалены." });
    } catch (error) {
        logger.error("Ошибка при удалении спектакля:", error);
        response.status(500).json({ message: "Ошибка сервера при удалении." });
    }
});

// Копирование спектакля в архив
router.post("/:id/archive", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);

        const perfData = await readJsonFile("performances.json", []);

        const perfIndex = perfData.findIndex(p => p.id === id);
        if (perfIndex === -1) {
            return response.status(404).json({ message: "Спектакль не найден в базе данных афиши." });
        }

        const performanceToArchive = perfData[perfIndex];

        const archive = await readJsonFile("archive.json", []);

        // Проверяем, нет ли его уже в архиве
        if (archive.some(item => item.id === id)) {
            return response.status(400).json({ message: "Этот спектакль уже находится в архиве." });
        }

        const archivedPerformance = {
            ...performanceToArchive,
            videos: [],
            photos: [],
            actors: []
        };

        archive.push(archivedPerformance);
        await writeJsonFile("archive.json", archive);

        logger.info(`Спектакль ID: ${id} скопирован в архив.`);

        response.status(201).json({ 
            message: "Спектакль успешно добавлен в архив!", 
            archivedPerformance 
        });

    } catch (error) {
        logger.error("Ошибка при переносе в архив:", error);
        response.status(500).json({ message: "Ошибка сервера при переносе данных." });
    }
});

export default router;
