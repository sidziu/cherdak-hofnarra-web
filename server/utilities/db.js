const fs = require("fs").promises;
const path = require("path");
const v8 = require("v8");
const logger = require("./logger");

const dbCache = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 минут неактивности

// Очистка кэша при переполнении
function guardMemory() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapLimit = heapStats.heap_size_limit; // Максимально доступный лимит памяти
    const heapUsed = memUsage.heapUsed;          // Фактически занятая память

    if (heapUsed > heapLimit * 0.8) {
        logger.warn(`Критический уровень памяти! Сброс кэша для предотвращения OOM.`);
        for (const key in dbCache) { delete dbCache[key]; }
        if (global.gc) { try { global.gc(); } catch (e) { logger.warn("Не удалось принудительно запустить GC."); } }
    }
}

// Фоновый таймер для периодического удаления неактивного кэша
setInterval(() => {
    const now = Date.now();
    for (const fileName in dbCache) {
        if (now - dbCache[fileName].lastAccessed > CACHE_TTL_MS) {
            logger.info(`Файл ${fileName} вытеснен из кэша.`);
            delete dbCache[fileName];
        }
    }
}, 5 * 60 * 1000).unref();

// Путь к data теперь на уровень выше (..)
const dataDirPath = path.join(__dirname, "..", "data");

async function readJsonFile(fileName, defaultValue = []) {
    guardMemory();

    if (dbCache[fileName]) {
        logger.info(`Файл ${fileName} прочитан из кэша.`)
        dbCache[fileName].lastAccessed = Date.now()
        return structuredClone(dbCache[fileName].data);
    }

    const filePath = path.join(dataDirPath, fileName);

    try {
        logger.info(`Кэширование ${filePath}`)
        const fileData = await fs.readFile(filePath, "utf-8");
        const parsedData = JSON.parse(fileData);
        
        dbCache[fileName] = { 
            data: parsedData,
            lastAccessed: Date.now()
        };

        return structuredClone(parsedData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeJsonFile(fileName, defaultValue);
            return defaultValue;
        }
        throw error;
    }
}

async function writeJsonFile(fileName, data) {
    guardMemory();

    const filePath = path.join(dataDirPath, fileName);

    try {
        fs.mkdir(dataDirPath, { recursive: true });
        logger.info(`Файл обновлён: ${filePath}`)

        dbCache[fileName] = {
            data: structuredClone(data),
            lastAccessed: Date.now()
        };

        fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    
    } catch (error) {
        logger.error(`Ошибка записи файла ${fileName}:`, error);
        throw error;
    }
}

module.exports = { readJsonFile, writeJsonFile };
