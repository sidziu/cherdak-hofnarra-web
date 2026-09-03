import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import logger from "../utilities/logger.js";
import { readJsonFile } from "../utilities/db.js";

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || "default_secret";

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Введите логин и пароль." });
        }

        const adminData = await readJsonFile("admin.json", null);

        if (!adminData || adminData.username !== username) {
            return res.status(401).json({ message: "Неверный логин или пароль." });
        }

        const isMatch = await bcrypt.compare(password, adminData.passwordHash);

        if (!isMatch) {
            logger.warn(`Неудачная попытка входа для пользователя ${username}`);
            return res.status(401).json({ message: "Неверный логин или пароль." });
        }

        const token = jwt.sign(
            { username: adminData.username, role: "admin" },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        logger.info(`Администратор ${username} вошел в систему.`);
        
        res.json({
            message: "Успешный вход!",
            token: token
        });

    } catch (error) {
        logger.error("Ошибка при авторизации:", error);
        res.status(500).json({ message: "Ошибка сервера при авторизации." });
    }
});

export default router;
