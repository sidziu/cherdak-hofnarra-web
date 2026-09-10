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
        const archive = await db.orm.public.Archive
            .include('actors', (actor) => actor.include('person'))
            .include('events')
            .all();

        const archiveWithUrls = archive.map(item => {
            const mappedActors = item.actors.map(link => {
                const person = link.person;
                return {
                    id: person.selfId,
                    name: person.name,
                    role: person.role,
                    imageUrl: `${SERVER_URL}/images/persons/${person.image}`
                }
            });

            return {
                id: item.selfId,
                title: item.title,
                mainPhoto: item.mainPhoto,
                genre: item.genre,
                director: item.director,
                description: item.description,
                duration: item.duration,
                rating: item.rating,
                photos: item.photos,
                videos: item.videos, // currently external URLs only
                events: item.events.map(event => ({
                    eventId: event.selfId,
                    date: new Date(event.date.replace(' ', 'T') + 'Z'),
                    scene: event.scene,
                })),
                imageUrl: `${SERVER_URL}/images/events/${item.image}`,
                mainPhotoUrl: item.mainPhoto? `${SERVER_URL}/images/archive/${item.mainPhoto}` : undefined,
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

// Получить конкретуню запись в архиве
router.get("/:id", async function(request, response) {
    try {
        const id = request.params.id;

        const archive = await db.orm.public.Archive
            .where({ selfId: id })
            .include('actors', (actor) => actor.include('person'))
            .include('events')
            .all();

        if(archive.length == 0){
            return response.status(404).json({ message: 'Архивная запись не найдена.' })
        }

        const archiveWithUrls = archive.map(item => {
            const mappedActors = item.actors.map(link => {
                const person = link.person;
                return {
                    id: person.selfId,
                    name: person.name,
                    role: person.role,
                    imageUrl: `${SERVER_URL}/images/persons/${person.image}`
                }
            });

            return {
                id: item.selfId,
                title: item.title,
                mainPhoto: item.mainPhoto,
                genre: item.genre,
                director: item.director,
                description: item.description,
                duration: item.duration,
                rating: item.rating,
                photos: item.photos,
                videos: item.videos, // currently external URLs only
                events: item.events.map(event => ({
                    eventId: event.selfId,
                    date: new Date(event.date.replace(' ', 'T') + 'Z'),
                    scene: event.scene,
                })),
                imageUrl: `${SERVER_URL}/images/events/${item.image}`,
                mainPhotoUrl: item.mainPhoto? `${SERVER_URL}/images/archive/${item.mainPhoto}` : undefined,
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
        const id = request.params.id;

        const entryToDelete = await db.orm.public.Archive
            .where({ selfId: id })
            .delete();
        if (!entryToDelete) {
            return response.status(404).json({ message: "Запись в архиве не найдена." });
        }

        // Удаляем все дополнительные фотографии спектакля с диска
        for (const photo of entryToDelete.photos) {
            const photoPath = path.join(__dirname, "..", "public", "images", "archive", photo);
            try {
                await fs.unlink(photoPath);
            } catch (err) {
                logger.warn(`Не удалось удалить фото из галереи: ${photoPath}`);
            }
        }

        // Проверка использования постера в других записях перед удалением
        const isUsedInPerformances = await db.orm.public.Performance
            .where({ image: entryToDelete.image })
            .first();
        
        const isUsedInOtherArchiveRecords = await db.orm.public.Archive
            .where({ image: entryToDelete.image })
            .first();

        if (!isUsedInPerformances && !isUsedInOtherArchiveRecords) {
            const mainImagePath = path.join(__dirname, "..", "public", "images", "events", entryToDelete.image);
            try {
                await fs.unlink(mainImagePath);
            } catch (err) {
                logger.warn(`Главное изображение не найдено в афише для удаления: ${mainImagePath}`);
            }
        } else {
            logger.info(`Главное изображение ${entryToDelete.image} не удалено, так как используется в Афише или других архивных записях.`);
        }

        response.json({ message: "Архивное событие успешно удалено." });

    } catch (error) {
        logger.error("Ошибка при удалении из архива:", error);
        response.status(500).json({ message: "Ошибка сервера при удалении записи." });
    }
});

// - ДОБАВЛЕНИЕ / УДАЛЕНИЕ МЕДИА -
// Загрузить фотографии спектакля в архив
router.post("/:id/photos", authMiddleware, uploadArchivePhotos.array("photos", 20), async function (request, response) {
    try {
        const id = request.params.id;
        const files = request.files;

        if (!files || files.length === 0) {
            return response.status(400).json({ message: "Необходимо выбрать файлы для загрузки." });
        }

        const archiveEntry = await db.orm.public.Archive
            .where({ selfId: id })
            .first();
        
        if (!archiveEntry) {
            for (const file of files) { await fs.unlink(file.path); }
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        const fileNames = files.map(file => file.filename);
        const allPhotos = [...archiveEntry.photos, ...fileNames];
        
        await db.orm.public.Archive
            .where({ selfId: id })
            .update({ photos: allPhotos });

        response.json({ message: "Фотографии добавлены!", photos: allPhotos });
    } catch (error) {
        logger.error("Ошибка при загрузке фото в архив:", error);
        response.status(500).json({ message: "Ошибка сервера." });
    }
});

// Выбрать "главную" фотографию
router.patch("/:id/main-photo", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;
        const { photoFilename } = request.body;
        
        const cleanPhotoFilename = photoFilename.trim()

        if(!photoFilename){
            return response.status(400).json({ message: "Необходимо выбрать фотографию." });
        }

        const archiveEntry = await db.orm.public.Archive
            .where({ selfId: id })
            .first();

        if(!archiveEntry){
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        if(!archiveEntry.photos.includes(cleanPhotoFilename)){
            return response.status(404).json({ message: "Такой фотографии не существует." });
        }

        await db.orm.public.Archive
            .where({ selfId: id })
            .update({ mainPhoto: cleanPhotoFilename });
        
        response.json({
            message: "Главная фотография назначена.",
            photo: cleanPhotoFilename
        });
    } catch (error) {
        
    }

});

// Добавить ссылку на видео
router.post("/:id/videos", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;
        const { videoUrl } = request.body;

        const cleanVideo = videoUrl?.trim();
        if (!cleanVideo) {
            return response.status(400).json({ message: "Ссылка не может быть пустой." });
        }

        const archiveEntry = await db.orm.public.Archive
            .where({ selfId: id })
            .first();

        if (!archiveEntry) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        if (archiveEntry.videos.includes(cleanVideo)) {
            return response.status(400).json({ message: "Такое видео уже добавлено." });
        }

        const updatedVideos = [...archiveEntry.videos, cleanVideo];

        const updatedArchive = await db.orm.public.Archive
            .where({ selfId: id })
            .update({ videos: updatedVideos });

        response.json({ 
            message: "Видео успешно добавлено!", 
            videos: updatedArchive.videos 
        });

    } catch (error) {
        logger.error("Ошибка при добавлении видео:", error);
        response.status(500).json({ message: "Ошибка сервера." });
    }
});

// Удалить фотографию из галереи
router.delete("/:id/photos", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;
        const { photoName } = request.body;

        const archiveEntry = await db.orm.public.Archive
            .where({ selfId: id })
            .first();

        if (!archiveEntry) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        const updatedPhotos = archiveEntry.photos.filter(photo => photo !== photoName);

        await db.orm.public.Archive
            .where({ selfId: id })
            .update({ photos: updatedPhotos });
        
        const photoPath = path.join(__dirname, "..", "public", "images", "archive", photoName);

        try {
            await fs.unlink(photoPath);
        } catch (err) {
            logger.warn(`Файл не найден: ${photoPath}`);
        };

        // Если удалённая фотография выбрана "главной", очищаем это поле
        if(archiveEntry.mainPhoto == photoName){
            await db.orm.public.Archive
                .where({ selfId: id })
                .update({ mainPhoto: null});
        }

        response.json({
            message: "Фотография удалена.",
            photos: updatedPhotos
        });

    } catch (error) {
        logger.error(error);
        response.status(500).json({ message: "Ошибка сервера." });
    }
});

// Удалить ссылку на видео
router.delete("/:id/videos", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;
        const { videoUrl } = request.body;

        const cleanVideo = videoUrl?.trim();

        const archiveItem = await db.orm.public.Archive
            .where({ selfId: id })
            .first();

        if (!archiveItem) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        const updatedVideos = archiveItem.videos.filter(url => url !== cleanVideo);

        const updatedArchive = await db.orm.public.Archive
            .where({ selfId: id })
            .update({ videos: updatedVideos });

        response.json({ 
            message: "Видео удалено!", 
            videos: updatedArchive.videos 
        });

    } catch (error) {
        logger.error("Ошибка при удалении видео:", error);
        response.status(500).json({ message: "Ошибка сервера." });

    }
});

// Запрос привязки Актёра к Архивному спектаклю
router.post("/:id/actors", authMiddleware, async function (request, response) {
    try {
        const archiveId = request.params.id;
        const { actorId } = request.body;

        if (!actorId) {
            return response.status(400).json({ message: "Нужно передать ID актера." });
        }

        const actor = await db.orm.public.Person
            .where({ selfId: actorId })
            .first();

        if (!actor) {
            return response.status(404).json({ message: "Этот актер не зарегистрирован в базе данных актеров." });
        }

        const archiveEntry = await db.orm.public.Archive
            .where({ selfId: archiveId })
            .first();

        if (!archiveEntry) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        await db.orm.public.ArchiveActor.create({
            archiveId: archiveId,
            personId: actorId
        })

        response.json({
            message: "Актер успешно добавлен в состав!",
        });

    } catch (error) {
        logger.error("Ошибка при добавлении актера к архиву:", error);
        response.status(500).json({ message: "Ошибка сервера при добавлении актера." });
    }
});

// Запрос отвязки Актёра от Архивного спектакля
router.delete("/:id/actors", authMiddleware, async function (request, response) {
    try {
        const archiveId = request.params.id;
        const { actorId } = request.body;

        const archiveEntry = await db.orm.public.Archive
            .where({ selfId: archiveId })
            .first();

        if (!archiveEntry) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        const deletedActor = await db.orm.public.ArchiveActor
            .where({ archiveId: archiveId })
            .where({ personId: actorId })
            .delete();

        if(!deletedActor){
            return response.status(404).json({ message: "Актер не привязан к данной архивной записи." });
        }

        response.json({
            message: "Актер удален из состава.",
            actor: deletedActor
        });

    } catch (error) {
        logger.error(error);
        response.status(500).json({ message: "Ошибка сервера при удалении актера." });
    }
});

// - ДОБАВЛЕНИЕ / УДАЛЕНИЕ ДАТ ПОКАЗОВ -
// Добавить архивный показ
router.post("/:id/date", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;
        const { date, scene } = request.body;

        const cleanScene = scene?.trim() || "Основная сцена";
        const cleanDate = new Date(date);
        
        if (!cleanDate) {
            return response.status(400).json({ message: "Необходимо передать дату и время." });
        }

        const archiveEntry = await db.orm.public.Archive
            .where({ selfId: id })
            .first();

        if (!archiveEntry) {
            return response.status(404).json({ message: "Архивное событие не найдено." });
        }

        const existingEvent = await db.orm.public.ArchiveEvent
            .where({ archiveId: id })
            .where((e) => e.date.eq(cleanDate))
            .first();

        if (existingEvent) {
            return response.status(400).json({ message: "Такая дата показа уже добавлена к этому спектаклю." });
        }

        const newArchiveEvent = await db.orm.public.ArchiveEvent.create({
            archiveId: id,
            scene: cleanScene,
            date: cleanDate.toISOString(),
        });

        response.status(201).json({ 
            message: "Дата успешно добавлена.", 
            event: newArchiveEvent
        });

    } catch (error) {
        logger.error("Ошибка при добавлении даты:", error);
        response.status(500).json({ message: "Ошибка сервера." });
    }
});

// Удалить архивный показ
router.delete("/:archiveEntryId/date", authMiddleware, async function (request, response) {
    try {
        const id = request.params.archiveEntryId;
        const { eventId } = request.body;

        if(!eventId){
            return response.status(400).json({ message: "Нужно передать eventId." })
        }

        const deletedEvent = await db.orm.public.ArchiveEvent
            .where({ selfId: eventId, archiveId: id })
            .delete();

        if (!deletedEvent) {
            return response.status(404).json({ message: "Архивный показ не найден." });
        }

        response.json({ 
            message: "Дата удалена.", 
            event: deletedEvent
        });

    } catch (error) {
        logger.error("Ошибка при удалении даты:", error);
        response.status(500).json({ message: "Ошибка сервера." });

    }
});

export default router;
