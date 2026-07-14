const express = require("express");
const router = express.Router();
const PORT = process.env.PORT || 3001;

const logger = require("../utilities/logger");

const fs = require("fs").promises
const path = require("path")
const { readJsonFile, writeJsonFile } = require("../utilities/db");
const createUploader = require("../utilities/uploader");

const authMiddleware = require("../utilities/authMiddleware");

// Удалить конкретного гостя по его ID
router.delete("/:individual_ID", authMiddleware, async function (request, response) {
    try {
        const individual_ID = parseInt(request.params.individual_ID, 10);
        const registrations = await readJsonFile("registrations.json");

        const guestExists = registrations.some(r => r.individual_ID === individual_ID);
        if (!guestExists) {
            return response.status(404).json({ message: "Гость с указанным ID не найден." });
        }

        const updatedRegistrations = registrations.filter(r => r.individual_ID !== individual_ID);
        await writeJsonFile("registrations.json", updatedRegistrations);

        response.json({ message: "Запись гостя успешно удалена из системы." });

    } catch (error) {
        logger.error(`Ошибка при удалении гостя ${request.params.individual_ID}:`, error);
        response.status(500).json({ message: "Ошибка сервера при удалении записи." });
    }
});

// Регистрация гостя на показ
router.post("/", async function (request, response) {
    try {
        const { boundEventID, surname, firstName, lastName, email, phoneNumber } = request.body;

        const cleanSurname = surname?.trim();
        const cleanFirstName = firstName?.trim();
        const cleanLastName = lastName?.trim();
        const cleanEmail = email?.trim() || undefined;
        const cleanPhone = phoneNumber?.trim() || undefined;

        // Проверка обязательных текстовых полей
        if (!boundEventID || !cleanSurname || !cleanFirstName || !cleanLastName) {
            return response.status(400).json({ message: "Необходимо заполнить ФИО участника и выбрать показ." });
        }

        // Email и Телефон могут быть undefined, но НЕ оба сразу
        if (!cleanEmail && !cleanPhone) {
            return response.status(400).json({ 
                message: "Необходимо указать хотя бы один вид контактных данных: Email или Номер телефона." 
            });
        }

        // Существует ли данный показ в афише
        const events = await readJsonFile("events.json");
        const eventExists = events.some(e => e.eventID === parseInt(boundEventID, 10));
        if (!eventExists) {
            return response.status(404).json({ message: "Показ спектакля с таким ID отсутствует в расписании." });
        }

        const registrations = await readJsonFile("registrations.json");

        // Проверяем на дубликаты
        // Одинаковое ФИО + одинаковый телефон ИЛИ одинаковое ФИО + одинаковый email на ОДНО событие запрещены
        const isDuplicate = registrations.some(r => {
            const sameEvent = r.boundEventID === parseInt(boundEventID, 10);
            
            const sameFIO = r.surname.toLowerCase() === cleanSurname.toLowerCase() &&
                            r.firstName.toLowerCase() === cleanFirstName.toLowerCase() &&
                            r.lastName.toLowerCase() === cleanLastName.toLowerCase();

            const sameEmail = cleanEmail && r.email && r.email.toLowerCase() === cleanEmail.toLowerCase();
            const samePhone = cleanPhone && r.phoneNumber && r.phoneNumber === cleanPhone;

            return sameEvent && sameFIO && (sameEmail || samePhone);
        });

        if (isDuplicate) {
            return response.status(400).json({ 
                message: "Вы уже записаны на этот показ спектакля." 
            });
        }

        // Создаем карточку нового гостя
        const newGuest = {
            boundEventID: parseInt(boundEventID, 10),
            individual_ID: Date.now() + Math.floor(Math.random() * 1000),
            surname: cleanSurname,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: cleanEmail,
            phoneNumber: cleanPhone
        };

        registrations.push(newGuest);
        await writeJsonFile("registrations.json", registrations);

        response.status(201).json({
            message: "Вы успешно записались на показ!",
            guest: newGuest
        });

    } catch (error) {
        logger.error("Ошибка при регистрации гостя:", error);
        response.status(500).json({ message: "Ошибка сервера при попытке регистрации." });
    }
});

module.exports = router