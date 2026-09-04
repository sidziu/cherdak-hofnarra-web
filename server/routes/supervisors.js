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

const uploadSupervisor = createUploader("images/supervisors", [".png", ".jpg", ".jpeg", ".webp"]);

// Получить массив руководителей
router.get("/", async function(request, response) {
    try {
        const supervisors = await readJsonFile("supervisors.json", []);

        const supervisorsWithUrls = supervisors.map(supervisor => ({
            ...supervisor,
            imageUrl: `${SERVER_URL}/images/supervisors/${supervisor.image}`
        }));

        response.json(supervisorsWithUrls);

    } catch (error) {
        logger.error("Ошибка чтения базы данных руководителей:", error);
        response.status(500).json({ message: "Ошибка сервера при загрузке руководителей." });
    }
});

// Добавить руководителя
router.post("/", authMiddleware, uploadSupervisor.single("image"), async function (request, response) {
    try {
        const { name, role, contact_info } = request.body;
        const file = request.file;

        if (!name?.trim() || !role?.trim() || !contact_info?.trim() || !file) {
            if (file) {
                await fs.unlink(file.path);
            }
            return response.status(400).json({ 
                message: "Необходимо заполнить все текстовые поля и загрузить изображение." 
            });
        }

        const supervisors = await readJsonFile("supervisors.json", []);

        const newSupervisor = {
            id: Date.now() + Math.floor(Math.random() * 1000), 
            name: name.trim(),
            role: role.trim(),
            contact_info: contact_info.trim(),
            image: file.filename
        };

        supervisors.push(newSupervisor);

        await writeJsonFile("supervisors.json", supervisors);

        response.status(201).json({
            message: "Руководитель успешно добавлен!",
            supervisor: {
                ...newSupervisor,
                imageUrl: `${SERVER_URL}/images/supervisors/${newSupervisor.image}`
            }
        });

    } catch (error) {
        logger.error("Ошибка при сохранении руководителя:", error);
        response.status(500).json({ message: "Ошибка сервера при сохранении данных" });
    }
});

// Удалить руководителя по ID
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = parseInt(request.params.id);
        const supervisors = await readJsonFile("supervisors.json", []);

        const supervisorToDelete = supervisors.find(supervisor => supervisor.id === id);

        if (!supervisorToDelete) {
            return response.status(404).json({ message: "Руководитель с указанным ID не найден." });
        }

        const updatedSupervisors = supervisors.filter(supervisor => supervisor.id !== id);

        await writeJsonFile("supervisors.json", updatedSupervisors);

        const imagePath = path.join(__dirname, "..", "public", "images", "supervisors", supervisorToDelete.image);
        try {
            await fs.unlink(imagePath);
        } catch (fileError) {
            logger.warn(`Файл изображения не был найден на диске для удаления: ${imagePath}`);
        }

        response.json({ message: "Запись руководителя и его портрет успешно удалены." });

    } catch (error) {
        logger.error("Ошибка при удалении руководителя:", error);
        response.status(500).json({ message: "Ошибка сервера при попытке удаления данных." });
    }
});

// Поменять местами руководителей
router.patch("/swap", authMiddleware, async function (request, response) {
    try {
        const { id1, id2 } = request.body;

        if (!id1 || !id2) {
            return response.status(400).json({ message: "Необходимо передать id1 и id2." });
        }

        const supervisors = await readJsonFile("supervisors.json", []);

        const index1 = supervisors.findIndex(supervisor => supervisor.id === parseInt(id1));
        const index2 = supervisors.findIndex(supervisor => supervisor.id === parseInt(id2));

        if (index1 === -1 || index2 === -1) {
            return response.status(404).json({ message: "Один или оба руководителя не найдены." });
        }

        const temp = supervisors[index1];
        supervisors[index1] = supervisors[index2];
        supervisors[index2] = temp;

        await writeJsonFile("supervisors.json", supervisors);

        response.json({ message: "Порядок руководителей успешно изменен." });

    } catch (error) {
        logger.error("Ошибка при смене позиций руководителей:", error);
        response.status(500).json({ message: "Ошибка сервера при смене позиций." });
    }
});

export default router;
