const jwt = require("jsonwebtoken");
const logger = require("./logger");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET || "default_secret";

module.exports = (req, res, next) => {
    // Клиент должен присылать заголовок: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn(`Попытка доступа, токен не передан.`);
        return res.status(401).json({ message: "Нет доступа. Требуется авторизация." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Сохраняем данные админа в объект запроса
        next();
    } catch (error) {
        logger.warn(`Попытка доступа с неверным токеном: ${req.ip}`);
        return res.status(403).json({ message: "Недействительный или просроченный токен." });
    }
};