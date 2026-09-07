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

// Добавить новую дату показа
router.post("/", authMiddleware, async function (request, response) {
    try {
        const { performanceReferenceID, scene, date, activestate } = request.body;

        const isActive = activestate === 'true' || activestate === true || activestate === '1' || activestate === 1;

        if (!performanceReferenceID || !scene?.trim() || !date || activestate === undefined) {
            return response.status(400).json({ message: "Необходимо заполнить все поля расписания." });
        }

        if (isNaN(new Date(date).getTime())) {
            return response.status(400).json({ message: "Неверный формат даты." });
        }

        const newEvent = db.orm.public.Event.create({
            performanceId: performanceReferenceID,
            activeState: isActive,
            scene: scene,
            date: new Date(date).toISOString(),
        })

        response.status(201).json({ message: "Дата показа успешно добавлена в афишу!", event: newEvent });

    } catch (error) {
        logger.error("Ошибка при добавлении даты события:", error);
        response.status(500).json({ message: "Ошибка сервера при сохранении расписания." });
    }
});

// Переключить состояние activestate у конкретного показа
router.patch("/:id/toggle-active", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;

        const eventToToggle = await db.orm.public.Event
            .where({ selfId: id })
            .select('activeState')
            .first();

        if (!eventToToggle) {
            return response.status(404).json({ message: "Показ с указанным ID не найден." });
        }

        await db.orm.public.Event
            .where({ selfId: id })
            .update({ activeState: !eventToToggle.activeState });

        response.json({ message: "Состояние изменено.", activestate: !eventToToggle.activeState });
    } catch (error) {
        logger.error("Ошибка при изменении состояния:", error);
        response.status(500).json({ message: "Ошибка сервера при изменении состояния." });
    }
});

// Удалить конкретную дату показа
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;

        const eventToDelete = await db.orm.public.Event
            .where({ selfId: id })
            .first();

        if (!eventToDelete) {
            return response.status(404).json({ message: "Показ не найден." });
        }

        await db.orm.public.Event.where({ selfId: id }).delete();

        response.json({ message: "Показ успешно удален." });
    } catch (error) {
        logger.error("Ошибка при удалении показа:", error);
        response.status(500).json({ message: "Ошибка сервера при удалении показа." });
    }
});

// -- REGISTRATION --
// Получить список гостей по ID события
router.get("/:boundEventID/guests", authMiddleware, async function(request, response) {
    try {
        const boundEventID = request.params.boundEventID;

        const boundedGuests = await db.orm.public.Registration
            .where({ eventId: boundEventID })
            .all();
        
        const guests = boundedGuests.map(guest => ({
            boundEventID: boundEventID,
            individual_ID: guest.selfId,
            name: guest.name,
            surname: guest.surname,
            middleName: guest.middleName,
            phoneNumber: guest.phoneNumber,
            email: guest.email
        }))

        response.json(guests);

    } catch (error) {
        logger.error(`Ошибка при получении списка гостей для показа ${request.params.boundEventID}:`, error);
        response.status(500).json({ message: "Ошибка сервера при получении списка гостей." });
    }
});

// Удалить ВСЕХ гостей, привязанных к конкретному событию (boundEventID)
router.delete("/:boundEventID/guests", authMiddleware, async function (request, response) {
    try {
        const boundEventID = request.params.boundEventID;

        const guestsToDelete = await db.orm.public.Registration
            .where({ eventId: boundEventID })
            .first();

        if (!guestsToDelete) {
            return response.status(404).json({ message: "Ни один гость не записался на этот показ." });
        }

        await db.orm.public.Registration
            .where({ eventId: boundEventID })
            .deleteAll();

        response.json({ message: "Все записи регистрации на данный показ успешно аннулированы." });

    } catch (error) {
        logger.error(`Ошибка авто-очистки гостей для показа ID ${request.params.id}:`, error);
        response.status(500).json({ message: "Ошибка сервера при очистке списка гостей." });
    }
});

export default router;
