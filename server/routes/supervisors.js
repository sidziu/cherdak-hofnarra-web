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
        const supervisors = await db.orm.public.Supervisor.orderBy((s) => s.orderNo.asc()).all();

        const supervisorsWithUrls = supervisors.map(supervisor => ({
            id: supervisor.selfId,
            orderNo: supervisor.orderNo,
            name: supervisor.name,
            role: supervisor.role,
            contact_info: supervisor.contactInfo,
            image: supervisor.image,
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
    const { name, role, contact_info } = request.body;
    const file = request.file;
    
    try {
        if (!name?.trim() || !role?.trim() || !contact_info?.trim() || !file) {
            if (file) {
                await fs.unlink(file.path);
            }
            return response.status(400).json({ 
                message: "Необходимо заполнить все текстовые поля и загрузить изображение." 
            });
        }

        const newSupervisor = await db.orm.public.Supervisor.create({
            name: name.trim(),
            role: role.trim(),
            contactInfo: contact_info.trim(),
            image: file.filename
        })

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
        
        if(file){
            await fs.unlink(file);
        }
    }
});

// Удалить руководителя по ID
router.delete("/:id", authMiddleware, async function (request, response) {
    try {
        const id = request.params.id;

        const supervisorToDelete = await db.orm.public.Supervisor
        .where({ selfId: id })
        .select('selfId', 'image')
        .first();

        if (!supervisorToDelete) {
            return response.status(404).json({ message: "Руководитель с указанным ID не найден." });
        }

        const imagePath = path.join(__dirname, "..", "public", "images", "supervisors", supervisorToDelete.image);
        try {
            await fs.unlink(imagePath);
        } catch (fileError) {
            logger.warn(`Файл изображения не был найден на диске для удаления: ${imagePath}`);
        }

        await db.orm.public.Supervisor.where({ selfId: id }).delete();

        response.json({ message: "Запись руководителя и его портрет успешно удалены." });

    } catch (error) {
        logger.error("Ошибка при удалении руководителя:", error);
        response.status(500).json({ message: "Ошибка сервера при попытке удаления данных." });
    }
});

// Поменять порядок отображения руководителей
router.patch("/swap", authMiddleware, async function (request, response) {
    try {
        const { id1, id2 } = request.body;

        if (!id1 || !id2) {
            return response.status(400).json({ message: "Необходимо передать id1 и id2." });
        }

        await db.transaction(async (tx) => {
            const supervisor1 = await tx.orm.public.Supervisor
                .where({ selfId: id1 })
                .select("selfId", "orderNo")
                .first();

            const supervisor2 = await tx.orm.public.Supervisor
                .where({ selfId: id2 })
                .select("selfId", "orderNo")
                .first();

            if (!supervisor1 || !supervisor2) {
                throw new Error("Один или оба руководителя не найдены.");
            }

            if (supervisor1.selfId === supervisor2.selfId) {
                return;
            }

            const tempOrderNo = supervisor1.orderNo;

            await tx.orm.public.Supervisor
                .where({ selfId: id1 })
                .update({ orderNo: supervisor2.orderNo });

            await tx.orm.public.Supervisor
                .where({ selfId: id2 })
                .update({ orderNo: tempOrderNo });
        });

        response.json({ message: "Порядок руководителей успешно изменён." });

    } catch (error) {
        if (error.message === "Один или оба руководителя не найдены.") {
            return response.status(404).json({ message: error.message });
        }

        logger.error("Ошибка при смене позиций руководителей:", error);
        response.status(500).json({ message: "Ошибка сервера при смене позиций." });
    }
});

export default router;
