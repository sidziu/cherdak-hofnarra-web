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
        const persons = await db.orm.public.Person.orderBy((p) => p.orderNo.asc()).all();

        const personsWithUrls = persons.map(person => ({
            id: person.selfId,
            orderNo: person.orderNo,
            isActive: person.isActive,
            name: person.name,
            role: person.role,
            contact_info: person.contact_info,
            image: person.image,
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
    const { name, role, contact_info } = request.body;
    const file = request.file;
    
    try {
        if (!name?.trim() || !role?.trim() || !file) {
            if (file) {
                await fs.unlink(file.path);
            }
            return response.status(400).json({ 
                message: "Необходимо заполнить все текстовые поля и загрузить изображение." 
            });
        }

        const newPerson = await db.orm.public.Person.create({
            name: name.trim(),
            role: role.trim(),
            contactInfo: contact_info.trim() || null,
            image: file.filename
        });

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

        if(file){
            await fs.unlink(file);
        }
    }
});

// Удалить актёра по ID
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;

        const personToDelete = await db.orm.public.Person
        .where({ selfId: id })
        .select('selfId', 'image')
        .first();

        if (!personToDelete) {
            return response.status(404).json({ message: "Актер с указанным ID не найден." });
        }

        const imagePath = path.join(__dirname, "..", "public", "images", "persons", personToDelete.image);
        try {
            await fs.unlink(imagePath);
        } catch (fileError) {
            logger.warn(`Файл изображения не был найден на диске для удаления: ${imagePath}`);
        }

        await db.orm.public.Person.where({ selfId: id }).delete();

        response.json({ message: "Запись актера и его портрет успешно удалены." });

    } catch (error) {
        logger.error("Ошибка при удалении актера:", error);
        response.status(500).json({ message: "Ошибка сервера при попытке удаления данных." });
    }
});

// Поменять порядок отображения актёров
router.patch("/swap", authMiddleware, async function (request, response) {
    try {
        const { id1, id2 } = request.body;

        if (!id1 || !id2) {
            return response.status(400).json({ message: "Необходимо передать id1 и id2." });
        }

        await db.transaction(async (tx) => {
            const person1 = await tx.orm.public.Person
                .where({ selfId: id1 })
                .select("selfId", "orderNo")
                .first();

            const person2 = await tx.orm.public.Person
                .where({ selfId: id2 })
                .select("selfId", "orderNo")
                .first();

            if (!person1 || !person2) {
                throw new Error("Один или оба актёра не найдены.");
            }

            if (person1.selfId === person2.selfId) {
                return;
            }

            const tempOrderNo = person1.orderNo;

            await tx.orm.public.Person
                .where({ selfId: id1 })
                .update({ orderNo: person2.orderNo });

            await tx.orm.public.Person
                .where({ selfId: id2 })
                .update({ orderNo: tempOrderNo });
        });

        response.json({ message: "Порядок актеров успешно изменен." });

    } catch (error) {
        if (error.message === "Один или оба актёра не найдены.") {
            return response.status(404).json({ message: error.message });
        }

        logger.error("Ошибка при смене позиций актеров:", error);
        response.status(500).json({ message: "Ошибка сервера при смене позиций." });
    }
});

router.patch("/switch/:id", async function (request, response) {
    try {
        const id = request.params.id;

        const personToSwitch = await db.orm.public.Person.where({ selfId: id }).select('isActive').first();

        if(!personToSwitch){
            return response.status(404).json({ message: "Актер с указанным ID не найден." });
        }

        await db.orm.public.Person
            .where({ selfId: id })
            .update({ isActive: !personToSwitch.isActive });

        response.status(200).json({ message: 'Активность актёра переключена.' })

    } catch (error) {
        logger.error('Ошибка при переключении активности актёра:', error);
        response.status(500).json({ message: "Ошибка сервера при переключении состояния активности." })
    }
})

export default router;
