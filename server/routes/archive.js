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

const uploadArchivePhotos = createUploader("images/archive", [".png", ".jpg", ".jpeg", ".webp"]);

// Получить весь архив
router.get("/", async function(request, response) {
    try {
        let archive = await readJsonFile("archive.json", []);
        const persons = await readJsonFile("persons.json", []);

        let hasChanges = false;

        const cleanedArchive = archive.map(item => {
            const originalActorsList = item.actors || [];
            
            // Фильтруем ID, оставляем только те, которые есть в persons.json
            const validActors = originalActorsList.filter(actorId => 
                persons.some(p => p.id === actorId)
            );

            if (validActors.length !== originalActorsList.length) {
                hasChanges = true;
                return {
                    ...item,
                    actors: validActors
                };
            }
            return item;
        });

        // Если были обнаружены изменения, перезаписываем базу данных архивных выступлений
        if (hasChanges) {
            logger.info("В архиве обнаружены ссылки на удаленных актеров. База данных архива успешно очищена.");
            await writeJsonFile("archive.json", cleanedArchive);
            archive = cleanedArchive;
        }

        const archiveWithUrls = archive.map(item => {
            const mappedActors = (item.actors || []).map(actorId => {
                const actor = persons.find(p => p.id === actorId);
                if (!actor) return null;
                
                return {
                    id: actor.id,
                    name: actor.name,
                    role: actor.role,
                    imageUrl: `${SERVER_URL}/images/persons/${actor.image}`
                };
            }).filter(actor => actor !== null);

            return {
                ...item,
                imageUrl: `${SERVER_URL}/images/events/${item.image}`,
                photoUrls: item.photos.map(photo => `${SERVER_URL}/images/archive/${photo}`),
                actors: mappedActors 
            };
        });

        response.json(archiveWithUrls);

    } catch (error) {
        logger.error("Ошибка при чтении архива:", error);
        response.status(500).json({ message: "Ошибка сервера при загрузке архива." });
    }
});

// Удаление элемента архива по ID
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const archive = await readJsonFile("archive.json", []);

        const itemToDelete = archive.find(item => item.id === id);
        if (!itemToDelete) {
            return response.status(404).json({ message: "Запись в архиве не найдена." });
        }

        const updatedArchive = archive.filter(item => item.id !== id);
        await writeJsonFile("archive.json", updatedArchive);

        // Удаляем все дополнительные фотографии спектакля с диска
        for (const photo of itemToDelete.photos) {
            const photoPath = path.join(__dirname, "..", "public", "images", "archive", photo);
            try {
                await fs.unlink(photoPath);
            } catch (err) {
                logger.warn(`Не удалось удалить фото из галереи: ${photoPath}`);
            }
        }

        // Проверка использования постера в других записях перед удалением
        const perfData = await readJsonFile("performances.json", []);
        
        const isUsedInPerformances = perfData.some(p => p.image === itemToDelete.image);
        const isUsedInOtherArchiveRecords = archive.some(item => item.id !== id && item.image === itemToDelete.image);

        if (!isUsedInPerformances && !isUsedInOtherArchiveRecords) {
            const mainImagePath = path.join(__dirname, "..", "public", "images", "events", itemToDelete.image);
            try {
                await fs.unlink(mainImagePath);
            } catch (err) {
                logger.warn(`Главное изображение не найдено в афише для удаления: ${mainImagePath}`);
            }
        } else {
            logger.info(`Главное изображение ${itemToDelete.image} не удалено, так как используется в Афише или других записях.`);
        }

        response.json({ message: "Архивное событие успешно удалено." });

    } catch (error) {
        logger.error("Ошибка при удалении из архива:", error);
        response.status(500).json({ message: "Ошибка сервера при удалении записи." });
    }
});

// - ДОБАВЛЕНИЕ МЕДИА -
// Загрузить фотографии спектакля в архив
router.post("/:id/photos", authMiddleware, uploadArchivePhotos.array("photos", 20), async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const files = request.files;

        if (!files || files.length === 0) {
            return response.status(400).json({ message: "Необходимо выбрать файлы для загрузки." });
        }

        const archive = await readJsonFile("archive.json", []);

        const itemIndex = archive.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            for (const file of files) { await fs.unlink(file.path); }
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        const fileNames = files.map(file => file.filename);
        archive[itemIndex].photos.push(...fileNames);

        await writeJsonFile("archive.json", archive);

        response.json({ message: "Фотографии добавлены!", photos: archive[itemIndex].photos });
    } catch (error) {
        logger.error("Ошибка при загрузке фото в архив:", error);
        response.status(500).json({ message: "Ошибка сервера." });
    }
});

// Добавить ссылку на видео
router.post("/:id/videos", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const { videoUrl } = request.body;

        if (!videoUrl?.trim()) {
            return response.status(400).json({ message: "Ссылка не может быть пустой." });
        }

        const archive = await readJsonFile("archive.json", []);

        const itemIndex = archive.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        archive[itemIndex].videos.push(videoUrl.trim());
        await writeJsonFile("archive.json", archive);

        response.json({ message: "Видео добавлено!", videos: archive[itemIndex].videos });
    } catch (error) {
        logger.error("Ошибка при добавлении видео:", error);
        response.status(500).json({ message: "Ошибка сервера." });
    }
});

// Удалить фотографию из галереи
router.delete("/:id/photos", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const { photoName } = request.body;

        const archive = await readJsonFile("archive.json", []);

        const itemIndex = archive.findIndex(item => item.id === id);
        if (itemIndex === -1) { return response.status(404).json({ message: "Архив не найден." }); }

        // Удаляем имя файла из массива в БД
        archive[itemIndex].photos = archive[itemIndex].photos.filter(photo => photo !== photoName);
        await writeJsonFile("archive.json", archive);

        // Удаляем физический файл с диска
        const photoPath = path.join(__dirname, "..", "public", "images", "archive", photoName);
        try { await fs.unlink(photoPath); } catch (err) { logger.warn(`Файл не найден: ${photoPath}`); }

        response.json({ message: "Фотография удалена.", photos: archive[itemIndex].photos });
    } catch (error) { logger.error(error); response.status(500).json({ message: "Ошибка сервера." }); }
});

// Удалить ссылку на видео
router.delete("/:id/videos", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const { videoUrl } = request.body;

        const archive = await readJsonFile("archive.json", []);

        const itemIndex = archive.findIndex(item => item.id === id);
        if (itemIndex === -1) { return response.status(404).json({ message: "Архив не найден." }); }

        archive[itemIndex].videos = archive[itemIndex].videos.filter(url => url !== videoUrl);
        await writeJsonFile("archive.json", archive);

        response.json({ message: "Видео удалено.", videos: archive[itemIndex].videos });
    } catch (error) { logger.error(error); response.status(500).json({ message: "Ошибка сервера." }); }
});

// Запрос привязки Актёра к Архивному спектаклю
router.post("/:id/actors", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const { actorId } = request.body;

        const parsedActorId = parseInt(actorId, 10);

        if (isNaN(parsedActorId)) {
            return response.status(400).json({ message: "Некорректный ID актера." });
        }

        const persons = await readJsonFile("persons.json", []);
        const actorExists = persons.some(p => p.id === parsedActorId);

        if (!actorExists) {
            return response.status(404).json({ message: "Этот актер не зарегистрирован в базе данных актеров." });
        }

        const archive = await readJsonFile("archive.json", []);

        const itemIndex = archive.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        // Инициализируем массив актеров, если его нет
        if (!archive[itemIndex].actors) {
            archive[itemIndex].actors = [];
        }

        if (archive[itemIndex].actors.includes(parsedActorId)) {
            return response.status(400).json({ message: "Этот актер уже привязан к данному спектаклю." });
        }

        archive[itemIndex].actors.push(parsedActorId);
        await writeJsonFile("archive.json", archive);

        response.json({ message: "Актер успешно добавлен в состав!", actors: archive[itemIndex].actors });

    } catch (error) {
        logger.error("Ошибка при добавлении актера к архиву:", error);
        response.status(500).json({ message: "Ошибка сервера при добавлении актера." });
    }
});

// Запрос отвязки Актёра от Архивного спектакля
router.delete("/:id/actors", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const { actorId } = request.body;

        const archive = await readJsonFile("archive.json", []);

        const itemIndex = archive.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return response.status(404).json({ message: "Архив не найден." });
        }

        archive[itemIndex].actors = (archive[itemIndex].actors || []).filter(aid => aid !== parseInt(actorId, 10));
        await writeJsonFile("archive.json", archive);

        response.json({ message: "Актер удален из состава.", actors: archive[itemIndex].actors });
    } catch (error) {
        logger.error(error);
        response.status(500).json({ message: "Ошибка сервера при удалении актера." });
    }
});

export default router;
