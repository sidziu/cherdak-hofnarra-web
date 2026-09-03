import fsSync from "fs";
import winston from "winston";

if (!fsSync.existsSync("logs")) {
    fsSync.mkdirSync("logs", { recursive: true });
}

// -- LOGGER INIT --
const logger = winston.createLogger({
    level: 'http',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }) 
    ]
});

export default logger;
