import multer from "multer";
import path from "path";
import fsSync from "fs";
import fs from "fs/promises";
import sharp from "sharp";

import logger from "./logger.js";
const __dirname = import.meta.dirname;

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".avif"]);

sharp.cache(false);

// извлечение списка файлов из req независимо от типа вызова
function extractFiles(req) {
    if (req.file) return [req.file];
    if (Array.isArray(req.files)) return req.files;
    if (req.files && typeof req.files === "object") {
        return Object.values(req.files).flat();
    }
    return [];
}

function createUploader(subfolderPath, allowedExtensions, maxFileSize = 200 * 1024 * 1024) {
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

    const upload = multer({
        storage: storage,
        limits: {
            fileSize: maxFileSize
        },
        fileFilter: function (req, file, cb) {
            const ext = path.extname(file.originalname).toLowerCase();
            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error(`Неподдерживаемый формат файла. Разрешены только: ${allowedExtensions.join(", ")}`), false);
            }
        }
    });

    // Функция-обёртка для конвертации изображений
    const wrapWithSharp = (multerMiddleware) => {
        return (req, res, next) => {
            multerMiddleware(req, res, async (err) => {
                if (err) {
                    return next(err);
                }

                const files = extractFiles(req);
                if (files.length === 0) {
                    return next();
                }

                try {
                    await Promise.all(files.map(async (file) => {
                        const ext = path.extname(file.originalname).toLowerCase();
                        const isImage = (file.mimetype && file.mimetype.startsWith("image/") && file.mimetype !== "image/svg+xml") ||
                            IMAGE_EXTENSIONS.has(ext);

                        // Конвертируем только если это изображение и оно еще не в формате .webp
                        if (isImage && ext !== ".webp") {
                            const parsedPath = path.parse(file.filename);
                            const newFilename = `${parsedPath.name}.webp`;
                            const newPath = path.join(destPath, newFilename);

                            const inputBuffer = await fs.readFile(file.path);

                            // Конвертация в WebP
                            await sharp(inputBuffer, { animated: true })
                                .webp({ quality: 80 })
                                .toFile(newPath);

                            await fs.unlink(file.path);

                            // Обновляем данные файла в объекте запроса
                            file.path = newPath;
                            file.filename = newFilename;
                            file.mimetype = "image/webp";

                            const stat = await fs.stat(newPath);
                            file.size = stat.size;
                        }
                    }));

                    next();
                } catch (conversionError) {
                    logger.error("Ошибка при конвертации файлов в WebP:", conversionError);

                    // Очищаем уже записанные на диск файлы при сбое
                    for (const file of files) {
                        try {
                            if (file.path && fsSync.existsSync(file.path)) {
                                await fs.unlink(file.path);
                            }
                        } catch (cleanupErr) {
                            logger.error(`Не удалось удалить файл ${file.path}:`, cleanupErr);
                        }
                    }

                    next(conversionError);
                }
            });
        };
    };

    return {
        single: (fieldName) => wrapWithSharp(upload.single(fieldName)),
        array: (fieldName, maxCount) => wrapWithSharp(upload.array(fieldName, maxCount)),
        fields: (fields) => wrapWithSharp(upload.fields(fields)),
        any: () => wrapWithSharp(upload.any()),
        none: () => upload.none()
    };
}

export { createUploader };
