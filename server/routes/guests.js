import express from "express";
import fs from "fs/promises";
import path from "path";

import { db } from "../prisma/db.ts";
import logger from "../utilities/logger.js";
import { readJsonFile, writeJsonFile } from "../utilities/json_io.js";
import { createUploader } from "../utilities/uploader.js";
import authMiddleware from "../utilities/authMiddleware.js";

import { and, or, not } from '@prisma/orm-postgres/orm-client';

const __dirname = import.meta.dirname;

const router = express.Router();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 3001;

// Удалить конкретного гостя по его ID
router.delete("/:individual_ID", authMiddleware, async function (request, response) {
    try {
        const individual_ID = request.params.individual_ID;

        const guestExists = db.orm.public.Registration
            .where({ selfId: individual_ID })
            .first();
        
        if (!guestExists) {
            return response.status(404).json({ message: "Гость с указанным ID не найден." });
        }

        await db.orm.public.Registration.where({ selfId: individual_ID }).delete();

        response.json({ message: "Запись гостя успешно удалена из системы." });

    } catch (error) {
        logger.error(`Ошибка при удалении гостя ${request.params.individual_ID}:`, error);
        response.status(500).json({ message: "Ошибка сервера при удалении записи." });
    }
});

// Регистрация гостя на показ
router.post("/", async function (request, response) {
    try {
        const { boundEventID, surname, name, middleName, email, phoneNumber } = request.body;

        const cleanSurname = surname?.trim();
        const cleanFirstName = name?.trim();
        const cleanMiddleName = middleName?.trim();
        const cleanEmail = email?.trim() || undefined;
        const cleanPhone = phoneNumber?.trim() || undefined;

        // Проверка обязательных текстовых полей
        if (!boundEventID || !cleanSurname || !cleanFirstName || !cleanMiddleName) {
            return response.status(400).json({ message: "Необходимо заполнить ФИО участника и выбрать показ." });
        }

        // Email и Телефон могут быть undefined, но НЕ оба сразу
        if (!cleanEmail && !cleanPhone) {
            return response.status(400).json({ 
                message: "Необходимо указать Email или номер телефона." 
            });
        }

        // Существует ли данный показ в афише
        const eventExists = await db.orm.public.Event
            .where({ selfId: boundEventID })
            .first();

        if (!eventExists) {
            return response.status(404).json({ message: "Показ спектакля с таким ID отсутствует в расписании." });
        }

        // Проверяем на дубликаты
        // ФИО
        let duplicateQuery = db.orm.public.Registration
            .where({ eventId: boundEventID })
            .where((n) => n.surname.ilike(cleanSurname))
            .where((n) => n.name.ilike(cleanFirstName))
            .where((n) => n.middleName.ilike(cleanMiddleName))
        
        // E-mail ИЛИ номер телефона
        if(cleanEmail && cleanPhone){
            duplicateQuery = duplicateQuery.where((r) => or(
                r.email.ilike(cleanEmail),
                r.phoneNumber.eq(cleanPhone)
            ));
        } else if (cleanEmail) {
            duplicateQuery = duplicateQuery.where((r) => r.email.ilike(cleanEmail));
        } else {
            duplicateQuery = duplicateQuery.where((r) => r.phoneNumber.eq(cleanPhone));
        }

        const isDuplicate = await duplicateQuery.first();

        if (isDuplicate) {
            return response.status(400).json({ 
                message: "Вы уже записаны на этот показ спектакля." 
            });
        }

        // Создаем карточку нового гостя
        const newGuest = await db.orm.public.Registration.create({
            eventId: boundEventID,
            surname: cleanSurname,
            name: cleanFirstName,
            middleName: cleanMiddleName,
            email: cleanEmail,
            phoneNumber: cleanPhone
        });

        response.status(201).json({
            message: "Вы успешно записались на показ!",
            guest: newGuest
        });

    } catch (error) {
        logger.error("Ошибка при регистрации гостя:", error);
        response.status(500).json({ message: "Ошибка сервера при попытке регистрации." });
    }
});

export default router;
