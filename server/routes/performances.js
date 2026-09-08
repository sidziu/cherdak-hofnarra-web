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

const uploadEvent = createUploader("images/events", [".png", ".jpg", ".jpeg", ".webp"]);

// Получить список событий (спектакли) и связанных с ним постановок (время спектакля)
router.get("/", async function(request, response) {
    try {
        const now = new Date();

        // Деактивация просроченных ивентов
        const deactivatedCount = await db.orm.public.Event
            .where({ activeState: true })
            .where( (e) => e.date.lt(now) )
            .updateAndCount({ activeState: false });

        if (deactivatedCount > 0) {
            logger.info(
                `Обнаружены устаревшие показы. ${deactivatedCount} переведено в неактивное состояние.`
            );
        }

        const performances = await db.orm.public.Performance
            .select(
                "selfId",
                "title",
                "genre",
                "director",
                "description",
                "duration",
                "rating",
                "image"
            )
            .include('events')
            .all();

        const groupedData = performances.map(perf => ({
            id: perf.selfId,
            title: perf.title,
            genre: perf.genre,
            director: perf.director,
            description: perf.description,
            duration: perf.duration,
            rating: perf.rating,
            imageUrl: `${SERVER_URL}/images/events/${perf.image}`,
            performances: perf.events.map(e => ({
                eventID: e.selfId,
                activestate: e.activeState,
                scene: e.scene,
                // преобразование к ISO 8601
                // исходная строка: YYYY-MM-DD HH:MM:SS.SSS
                date: new Date(e.date.replace(' ', 'T') + 'Z') 
            }))
        }));

        response.json(groupedData);

    } catch (error) {
        logger.error("Ошибка чтения базы данных афиши:", error);
        response.status(500).json({ message: "Ошибка сервера при загрузке афиши." });
    }
});

// Добавить спектакль
router.post("/", authMiddleware, uploadEvent.single("image"), async function (request, response) {
    const file = request.file;

    try {
        const { title, genre, director, description, duration, rating } = request.body;        

        const parsedDuration = parseInt(duration, 10);

        if (
            !title?.trim() || !genre?.trim() || !director?.trim() || 
            !description?.trim() || isNaN(parsedDuration) || !rating?.trim() || !file
        ) {
            if (file) await fs.unlink(file.path);
            return response.status(400).json({ message: "Необходимо заполнить все поля спектакля и загрузить постер." });
        }

        const newPerformance = await db.orm.public.Performance.create({
            title: title.trim(),
            genre: genre.trim(),
            director: director.trim(),
            description: description.trim(),
            duration: parsedDuration,
            rating: rating.trim(),
            image: file.filename
        })

        response.status(201).json({ message: "Спектакль добавлен!", performance: newPerformance });
    } catch (error) {
        logger.error("Ошибка при сохранении спектакля:", error);
        response.status(500).json({ message: "Ошибка сервера при сохранении спектакля." });

        if(file){
            await fs.unlink(file.path);
        }
    }
});

// Удаление спектакля
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;
        
        const perfToDelete = await db.orm.public.Performance
            .where({ selfId: id })
            .select('selfId', 'image')
            .first();
        if (!perfToDelete){
            return response.status(404).json({ message: "Спектакль с указанным ID не найден." });
        }
        
        const isUsedInArchive = await db.orm.public.Archive
            .where({ image: perfToDelete.image })
            .first();

        if (!isUsedInArchive) {
            try {
                await fs.unlink(path.join(__dirname, "..", "public", "images", "events", perfToDelete.image));
            } catch (e) { 
                logger.warn("Картинка спектакля не найдена для удаления."); 
            }
        } else {
            logger.info(`Постер ${perfToDelete.image} не удален с диска, так как используется в архиве.`);
        }

        await db.orm.public.Performance.where({ selfId: id }).delete();

        response.json({ message: "Спектакль и все его показы удалены." });
    } catch (error) {
        logger.error("Ошибка при удалении спектакля:", error);
        response.status(500).json({ message: "Ошибка сервера при удалении." });
    }
});

// Копирование спектакля в архив
router.post("/:id/archive", authMiddleware, async function (request, response) {
    try {
        let responseMessage = 'Спектакль скопирован в архив.\n';
        const id = request.params.id;

        const performanceToArchive = await db.orm.public.Performance
            .where({ selfId: id })
            .include('events')
            .first();

        if (!performanceToArchive) {
            return response.status(404).json({ message: "Спектакль не найден в базе данных афиши." });
        }

        // Проверяем, есть ли одноимённый спектакль в архиве
        const isArchived = await db.orm.public.Archive
            .where((a) => a.title.ilike(performanceToArchive.title))
            .first();
        if (isArchived) {
            responseMessage += 'Внимание: в архиве сейчас находится не менее 2-х копий этого спектакля.';
        }

        const dates = performanceToArchive.events.map(event => event.date);

        const archivedPerformance = await db.orm.public.Archive.create({
            title: performanceToArchive.title,
            genre: performanceToArchive.genre,
            director: performanceToArchive.director,
            description: performanceToArchive.description,
            duration: performanceToArchive.duration,
            rating: performanceToArchive.rating,
            image: performanceToArchive.image,
            dates: dates,
        });

        logger.info(`Спектакль ID: ${id} скопирован в архив.`);

        response.status(201).json({ 
            message: responseMessage,
            isArchived: Boolean(isArchived),
            archivedPerformance: archivedPerformance 
        });

    } catch (error) {
        logger.error("Ошибка при переносе в архив:", error);
        response.status(500).json({ message: "Ошибка сервера при переносе данных." });
    }
});

export default router;
