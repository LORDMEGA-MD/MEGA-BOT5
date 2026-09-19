/**
 * lib/dataPath.js
 * Resolves data file paths per bot instance.
 * Each bot has its own data dir set via BOT_DATA_DIR env variable.
 * Falls back to ./data for backward compatibility.
 */

const path = require('path');
const fs = require('fs');

function getDataDir() {
    return global.BOT_DATA_DIR || process.env.BOT_DATA_DIR || path.join(process.cwd(), 'data');
}

function dataPath(filename) {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, filename);
}

module.exports = { dataPath, getDataDir };
