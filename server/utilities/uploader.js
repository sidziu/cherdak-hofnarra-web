import multer from "multer";
import path from "path";
import fsSync from "fs";

import logger from "./logger.js";
const __dirname = import.meta.dirname;

// TODO: закрыть уязвимость с неограниченным размером файла
function createUploader(subfolderPath, allowedExtensions) {
    const destPath = path.join(__dirname, "..", "public", subfolderPath);    
    logger.info(`Инициализация Multer по пути ${destPath}`);    
    if (!fsSync.existsSync(destPath)) {
        fsSync.mkdirSync(destPath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, destPath);            
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            const fileExt = path.extname(file.originalname).toLowerCase();
            cb(null, file.fieldname + "-" + uniqueSuffix + fileExt);
        }
    });

    return multer({
        storage: storage,
        fileFilter: function (req, file, cb) {
            const ext = path.extname(file.originalname).toLowerCase();
            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error(`Неподдерживаемый формат файла. Разрешены только: ${allowedExtensions.join(", ")}`), false);
            }
        }
    });
}

export { createUploader };
