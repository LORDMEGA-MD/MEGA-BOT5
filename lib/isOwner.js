const settings = require('../settings');
const { isSudo, bareNumber } = require('./index');

// ─── Simple in-memory cache ───────────────────────────────────────────────────
const ownerCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(senderId) {
    const entry = ownerCache.get(senderId);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        ownerCache.delete(senderId);
        return null;
    }
    return entry.result;
}

function setCache(senderId, result) {
    ownerCache.set(senderId, { result, expiry: Date.now() + CACHE_TTL });
    if (ownerCache.size > 500) {
        const firstKey = ownerCache.keys().next().value;
        ownerCache.delete(firstKey);
    }
}

async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    if (!senderId) return false;

    const cached = getCached(senderId);
    if (cached !== null) return cached;

    // ── Get owner number ──────────────────────────────────────────────────────
    let ownerNumber = settings.ownerNumber || '';
    try {
        const fs = require('fs');
        const path = require('path');
        const dataDir = global.BOT_DATA_DIR || path.join(process.cwd(), 'data');
        const ownerFile = path.join(dataDir, 'owner.json');
        if (fs.existsSync(ownerFile)) {
            const owners = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
            if (Array.isArray(owners) && owners[0]) {
                ownerNumber = owners[0];
            }
        }
    } catch {}

    // Always compare bare numbers — strips @lid / @s.whatsapp.net / :XX
    const ownerNum  = bareNumber(ownerNumber);
    const senderNum = bareNumber(senderId);

    // ── 1. Owner number match (works for both @lid and @s.whatsapp.net) ──────
    if (ownerNum && senderNum && senderNum === ownerNum) {
        setCache(senderId, true);
        return true;
    }

    // ── 2. MASTER_OWNER_JID match (set by bot-manager for minibots) ──────────
    if (global.MASTER_OWNER_JID) {
        const masterNum = bareNumber(global.MASTER_OWNER_JID);
        if (masterNum && senderNum === masterNum) {
            setCache(senderId, true);
            return true;
        }
    }

    // ── 3. Bot's own JID / LID ────────────────────────────────────────────────
    if (sock?.user?.id) {
        if (bareNumber(sock.user.id) === senderNum) {
            setCache(senderId, true);
            return true;
        }
    }
    if (sock?.user?.lid) {
        if (bareNumber(sock.user.lid) === senderNum) {
            setCache(senderId, true);
            return true;
        }
    }

    // ── 4. Sudo check — bareNumber comparison handles @lid vs @s.whatsapp.net
    try {
        const sudoResult = await isSudo(senderId);
        setCache(senderId, sudoResult);
        return sudoResult;
    } catch {
        setCache(senderId, false);
        return false;
    }
}

module.exports = isOwnerOrSudo;
