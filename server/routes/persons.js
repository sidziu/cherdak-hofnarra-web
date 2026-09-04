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

const uploadPerson = createUploader("images/persons", [".png", ".jpg", ".jpeg", ".webp"]);

// Получить массив актёров
router.get("/", async function(request, response) {
    try {
        const persons = await readJsonFile("persons.json", []);

        const personsWithUrls = persons.map(person => ({
            ...person,
            imageUrl: `${SERVER_URL}/images/persons/${person.image}`
        }));

        response.json(personsWithUrls);

    } catch (error) {
        logger.error("Ошибка чтения базы данных актеров:", error);
        response.status(500).json({ message: "Ошибка сервера при загрузке актеров" });
    }
});

// Добавить нового актёра
router.post("/", authMiddleware, uploadPerson.single("image"), async function (request, response) {
    try {
        const { name, role, contact_info } = request.body;
        const file = request.file;

        if (!name?.trim() || !role?.trim() || !file) {
            if (file) {
                await fs.unlink(file.path);
            }
            return response.status(400).json({ 
                message: "Необходимо заполнить все текстовые поля и загрузить изображение." 
            });
        }

        const persons = await readJsonFile("persons.json", []);

        const newPerson = {
            id: Date.now() + Math.floor(Math.random() * 1000), 
            name: name.trim(),
            role: role.trim(),
            contact_info: contact_info.trim() || undefined,
            image: file.filename
        };

        persons.push(newPerson);

        await writeJsonFile("persons.json", persons);

        response.status(201).json({
            message: "Актер успешно добавлен!",
            person: {
                ...newPerson,
                imageUrl: `${SERVER_URL}/images/persons/${newPerson.image}`
            }
        });

    } catch (error) {
        logger.error("Ошибка при сохранении актера:", error);
        response.status(500).json({ message: "Ошибка сервера при сохранении данных" });
    }
});

// Удалить актёра по ID
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const persons = await readJsonFile("persons.json", []);

        const personToDelete = persons.find(person => person.id === id);

        if (!personToDelete) {
            return response.status(404).json({ message: "Актер с указанным ID не найден." });
        }

        const updatedPersons = persons.filter(person => person.id !== id);

        await writeJsonFile("persons.json", updatedPersons);

        const imagePath = path.join(__dirname, "..", "public", "images", "persons", personToDelete.image);
        try {
            await fs.unlink(imagePath);
        } catch (fileError) {
            logger.warn(`Файл изображения не был найден на диске для удаления: ${imagePath}`);
        }

        response.json({ message: "Запись актера и его портрет успешно удалены." });

    } catch (error) {
        logger.error("Ошибка при удалении актера:", error);
        response.status(500).json({ message: "Ошибка сервера при попытке удаления данных." });
    }
});

// Поменять местами актёров
router.patch("/swap", authMiddleware, async function (request, response) {
    try {
        const { id1, id2 } = request.body;

        if (!id1 || !id2) {
            return response.status(400).json({ message: "Необходимо передать id1 и id2." });
        }

        const persons = await readJsonFile("persons.json", []);

        const index1 = persons.findIndex(person => person.id === parseInt(id1));
        const index2 = persons.findIndex(person => person.id === parseInt(id2));

        if (index1 === -1 || index2 === -1) {
            return response.status(404).json({ message: "Один или оба актера не найдены." });
        }

        const temp = persons[index1];
        persons[index1] = persons[index2];
        persons[index2] = temp;

        await writeJsonFile("persons.json", persons);

        response.json({ message: "Порядок актеров успешно изменен." });

    } catch (error) {
        logger.error("Ошибка при смене позиций актеров:", error);
        response.status(500).json({ message: "Ошибка сервера при смене позиций." });
    }
});

export default router;
