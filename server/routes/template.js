import express from "express";
import fs from "fs/promises";
import path from "path";

import logger from "../utilities/logger.js";
import { readJsonFile, writeJsonFile } from "../utilities/db.js";
import { createUploader } from "../utilities/uploader.js";
import authMiddleware from "../utilities/authMiddleware.js";

const __dirname = import.meta.dirname;

const router = express.Router();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 3001;

// paste

export default router;