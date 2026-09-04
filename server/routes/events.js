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

        const events = await readJsonFile("events.json", []);

        const newEvent = {
            eventID: Date.now() + Math.floor(Math.random() * 1000),
            performanceReferenceID: parseInt(performanceReferenceID, 10),
            activestate: isActive,
            scene: scene.trim(),
            date: new Date(date).toISOString()
        };

        events.push(newEvent);
        await writeJsonFile("events.json", events);

        response.status(201).json({ message: "Дата показа успешно добавлена в афишу!", event: newEvent });

    } catch (error) {
        logger.error("Ошибка при добавлении даты события:", error);
        response.status(500).json({ message: "Ошибка сервера при сохранении расписания." });
    }
});

// Переключить состояние activestate у конкретного показа
router.patch("/:id/toggle-active", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const events = await readJsonFile("events.json", []);

        const eventIndex = events.findIndex(event => event.eventID === id);

        if (eventIndex === -1) {
            return response.status(404).json({ message: "Показ с указанным ID не найден." });
        }

        events[eventIndex].activestate = !events[eventIndex].activestate;
        await writeJsonFile("events.json", events);

        response.json({ message: "Состояние изменено.", activestate: events[eventIndex].activestate });
    } catch (error) {
        logger.error("Ошибка при изменении состояния:", error);
        response.status(500).json({ message: "Ошибка сервера при изменении состояния." });
    }
});

// Удалить конкретную дату показа
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const events = await readJsonFile("events.json", []);

        const eventExists = events.some(event => event.eventID === id);

        if (!eventExists) {
            return response.status(404).json({ message: "Показ не найден." });
        }

        const updatedEvents = events.filter(event => event.eventID !== id);
        await writeJsonFile("events.json", updatedEvents);

        // КАСКАДНОЕ УДАЛЕНИЕ ЗРИТЕЛЕЙ ПОКАЗА
        const registrations = await readJsonFile("registrations.json");
        const updatedRegistrations = registrations.filter(r => r.boundEventID !== id);
        await writeJsonFile("registrations.json", updatedRegistrations);

        response.json({ message: "Показ успешно удален. Списки гостей очищены." });
    } catch (error) {
        logger.error("Ошибка при удалении показа:", error);
        response.status(500).json({ message: "Ошибка сервера при удалении показа." });
    }
});

// -- REGISTRATION --
// Получить список гостей по ID события
router.get("/:boundEventID/guests", authMiddleware, async function(request, response) {
    try {
        const boundEventID = parseInt(request.params.boundEventID, 10);

        const registrations = await readJsonFile("registrations.json");

        const guests = registrations.filter(r => r.boundEventID === boundEventID);

        response.json(guests);

    } catch (error) {
        logger.error(`Ошибка при получении списка гостей для показа ${request.params.boundEventID}:`, error);
        response.status(500).json({ message: "Ошибка сервера при получении списка гостей." });
    }
});

// Удалить ВСЕХ гостей, привязанных к конкретному событию (boundEventID)
router.delete("/:boundEventID/guests", authMiddleware, async function (request, response) {
    try {
        const boundEventID = parseInt(request.params.boundEventID, 10);
        const registrations = await readJsonFile("registrations.json");

        const updatedRegistrations = registrations.filter(r => r.boundEventID !== boundEventID);
        await writeJsonFile("registrations.json", updatedRegistrations);

        response.json({ message: "Все записи регистрации на данный показ успешно аннулированы." });

    } catch (error) {
        logger.error(`Ошибка авто-очистки гостей для показа ID ${request.params.id}:`, error);
        response.status(500).json({ message: "Ошибка сервера при очистке списка гостей." });
    }
});

export default router;
