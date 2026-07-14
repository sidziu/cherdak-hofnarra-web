// --- [ ИЗМЕНЕНО: Фабрика Multer вынесена в отдельный модуль. Обновлен путь к папке public ] ---
const multer = require("multer");
const path = require("path");
const fsSync = require("fs");
const logger = require("./logger");

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

module.exports = createUploader;
