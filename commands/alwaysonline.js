'use strict';

/**
 * alwaysonline.js
 * ────────────────────────────────────────────────────────────────────────────
 * Keeps the bot's WhatsApp account showing as "online" (and therefore
 * delivering messages with double-tick / no "last seen") even while the
 * phone itself has no data connection, as long as enabled.
 *
 * When disabled, the bot never artificially announces presence — WhatsApp
 * falls back to the phone's real presence (last seen, single-tick when the
 * phone has no data).
 *
 * Mechanism:
 *   sock.sendPresenceUpdate('available') tells WA the (linked) device is
 *   active. Presence expires after ~10s, so we re-send on an interval while
 *   enabled. Calling sendPresenceUpdate('unavailable') once on disable lets
 *   WA fall back to the phone's own presence.
 * ────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

const isOwnerOrSudo = require('../lib/isOwner');

const PRESENCE_INTERVAL_MS = 8_000; // presence expires ~10s server-side

// Per-process interval handle. One bot instance == one socket == one timer.
let _intervalHandle = null;

function getConfigPath() {
    return path.join(
        global.BOT_DATA_DIR || path.join(__dirname, '../data'),
        'alwaysonline.json'
    );
}

function loadState() {
    try {
        const p = getConfigPath();
        if (!fs.existsSync(p)) return { enabled: false };
        const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (typeof cfg.enabled !== 'boolean') cfg.enabled = false;
        return cfg;
    } catch { return { enabled: false }; }
}

function saveState(state) {
    try { fs.writeFileSync(getConfigPath(), JSON.stringify(state, null, 2)); }
    catch (e) { console.error('[ALWAYSONLINE] Config save error:', e); }
}

// Backwards/forwards-compatible alias matching the anticall/pmblocker pattern.
const readState = loadState;

// ─── Presence loop control ─────────────────────────────────────────────────

function stopPresenceLoop() {
    if (_intervalHandle) {
        clearInterval(_intervalHandle);
        _intervalHandle = null;
    }
}

function startPresenceLoop(sock) {
    stopPresenceLoop(); // never stack multiple intervals

    _intervalHandle = setInterval(async () => {
        try {
            if (!sock?.user) return; // not connected yet
            await sock.sendPresenceUpdate('available');
        } catch (e) {
            // Non-fatal — presence calls can transiently fail right after
            // (re)connect before creds.me.name is populated.
            console.error('[ALWAYSONLINE] presence update error:', e.message);
        }
    }, PRESENCE_INTERVAL_MS);
}

/**
 * Call once when the socket connects (connection === 'open').
 * Starts or stops the presence loop based on the saved state, and re-checks
 * the saved state so a hot-reload of the connection picks up config changes.
 * @param {object} sock - the active Baileys socket
 */
function startAlwaysOnline(sock) {
    const state = loadState();
    if (state.enabled) {
        startPresenceLoop(sock);
        // Fire one immediately so we don't wait the first interval tick.
        sock.sendPresenceUpdate('available').catch(() => {});
    } else {
        stopPresenceLoop();
        // Counteract markOnlineOnConnect:true which fires 'available' on every
        // reconnect. Without this, the bot stays online even with Always Online off.
        if (sock?.user) {
            sock.sendPresenceUpdate('unavailable').catch(() => {});
        }
    }
}

/**
 * Call on disconnect/cleanup so no stray interval keeps firing on a dead
 * socket between reconnect attempts.
 */
function stopAlwaysOnline() {
    stopPresenceLoop();
}

// ─── Command handler ───────────────────────────────────────────────────────

async function alwaysOnlineCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner  = await isOwnerOrSudo(senderId, sock, chatId);
    if (!message.key.fromMe && !isOwner)
        return sock.sendMessage(chatId, { text: '*Only the bot owner can use this command.*' }, { quoted: message });

    const state = loadState();

    if (!match) {
        return sock.sendMessage(chatId, {
            text:
                `*ALWAYS ONLINE*\n\n` +
                `Current Status: ${state.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
                `*.alwaysonline on* - Bot stays online (no last seen, double-tick) even if phone is offline\n` +
                `*.alwaysonline off* - Bot shows real phone presence (last seen / single-tick if phone is offline)`
        }, { quoted: message });
    }

    if (match === 'on') {
        state.enabled = true;
        saveState(state);
        startPresenceLoop(sock);
        sock.sendPresenceUpdate('available').catch(() => {});
        return sock.sendMessage(chatId, { text: '*Always Online enabled ✅*\n\nBot will now appear online at all times.' }, { quoted: message });
    }

    if (match === 'off') {
        state.enabled = false;
        saveState(state);
        stopPresenceLoop();
        // Let WA fall back to the phone's real presence.
        try { await sock.sendPresenceUpdate('unavailable'); } catch {}
        return sock.sendMessage(chatId, { text: '*Always Online disabled ❌*\n\nBot will now reflect the phone\'s real presence (last seen / offline).' }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '*Invalid command. Use .alwaysonline on/off*' }, { quoted: message });
}

module.exports = {
    alwaysOnlineCommand,
    startAlwaysOnline,
    stopAlwaysOnline,
    readState,
    loadState,
};
