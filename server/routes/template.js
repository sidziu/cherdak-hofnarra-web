const express = require("express");
const router = express.Router();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 3001;

const logger = require("../utilities/logger");

const fs = require("fs").promises
const path = require("path")
const { readJsonFile, writeJsonFile } = require("../utilities/db");
const createUploader = require("../utilities/uploader");

const authMiddleware = require("../utilities/authMiddleware");

// paste

module.exports = router