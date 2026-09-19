/**
 * commands/autosavestatus.js
 *
 * When the bot's own number replies to a status (fromMe = true),
 * downloads that status and sends it to the owner — exactly the
 * same destination and style as antidelete uses.
 *
 * Wire in main.js:
 *   const { handleStatusReply } = require('./commands/autosavestatus');
 *   // right after storeMessage block:
 *   await handleStatusReply(sock, message);
 */

const fs   = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TEMP_MEDIA_DIR)) fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });

// ─── Same owner resolution as antidelete ─────────────────────────────────────
// antidelete does: sock.user.id.split(':')[0] + '@s.whatsapp.net'
function getOwnerNumber(sock) {
    return sock.user.id.split(':')[0] + '@s.whatsapp.net';
}

// ─── Download with retry — same as antidelete ────────────────────────────────
async function downloadMedia(mediaObj, type, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const stream = await downloadContentFromMessage(mediaObj, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            if (buffer.length > 0) return buffer;
            throw new Error('Empty buffer');
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 600 * attempt));
        }
    }
}

function formatTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata', hour12: true,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

// ─── Send media — same as antidelete's sendRecoveredMedia ────────────────────
async function sendMedia(sock, toJid, mediaType, buffer, caption, mimetype, fileName, ptt) {
    switch (mediaType) {
        case 'image':
            await sock.sendMessage(toJid, { image: buffer, caption });
            break;
        case 'video':
            await sock.sendMessage(toJid, { video: buffer, caption });
            break;
        case 'audio':
            await sock.sendMessage(toJid, {
                audio:    buffer,
                mimetype: mimetype || 'audio/ogg; codecs=opus',
                ptt:      ptt || false,
            });
            break;
        case 'sticker':
            await sock.sendMessage(toJid, { sticker: buffer });
            break;
        case 'document':
            await sock.sendMessage(toJid, {
                document: buffer,
                mimetype: mimetype || 'application/octet-stream',
                fileName: fileName || 'status_file',
                caption,
            });
            break;
    }
}

/**
 * Main handler — call this on every message inside handleMessages.
 * Triggers only when fromMe=true AND the quoted message is from status@broadcast.
 */
async function handleStatusReply(sock, message) {
    try {
        if (!message?.message) return;

        // Only when the bot's own number sent the reply
        if (!message.key.fromMe) return;

        // Extract contextInfo from whatever message type wraps it
        const contextInfo =
            message.message?.extendedTextMessage?.contextInfo ||
            message.message?.imageMessage?.contextInfo        ||
            message.message?.videoMessage?.contextInfo        ||
            message.message?.audioMessage?.contextInfo        ||
            Object.values(message.message)[0]?.contextInfo;

        if (!contextInfo?.quotedMessage) return;

        // Must be replying to a status@broadcast
        if (contextInfo.remoteJid !== 'status@broadcast' &&
            message.key.remoteJid  !== 'status@broadcast') return;

        const quotedMsg     = contextInfo.quotedMessage;
        const quotedMsgType = Object.keys(quotedMsg)[0];
        const statusPoster  = contextInfo.participant || 'Unknown';
        const stanzaId      = contextInfo.stanzaId;
        const posterNum     = statusPoster.split('@')[0].split(':')[0];
        const ownerNumber   = getOwnerNumber(sock); // same as antidelete

        const header =
            `> *📌 SAVED STATUS*\n\n‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎` +
            `*👤 Posted By:* @${posterNum}\n` +
            `*🕒 Saved At:* ${formatTime()}`;

        // ── Text status ───────────────────────────────────────────────────────
        if (quotedMsgType === 'conversation' || quotedMsgType === 'extendedTextMessage') {
            const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
            if (!text) return;

            await sock.sendMessage(ownerNumber, {
                text:     `${header}\n\n*💬 Status Text:*\n${text}`,
                mentions: [statusPoster],
            });
            console.log(`[AutoSaveStatus] Text status saved from ${posterNum}`);
            return;
        }

        // ── Media types ───────────────────────────────────────────────────────
        const MEDIA_MAP = {
            imageMessage:    { type: 'image',    dlType: 'image'    },
            videoMessage:    { type: 'video',    dlType: 'video'    },
            audioMessage:    { type: 'audio',    dlType: 'audio'    },
            stickerMessage:  { type: 'sticker',  dlType: 'sticker'  },
            documentMessage: { type: 'document', dlType: 'document' },
        };

        const mediaEntry = MEDIA_MAP[quotedMsgType];
        if (!mediaEntry) return;

        const mediaObj = quotedMsg[quotedMsgType];

        // Reconstruct the message object downloadContentFromMessage needs
        const fakeMsg = {
            key: {
                remoteJid:   'status@broadcast',
                id:          stanzaId,
                fromMe:      false,
                participant: statusPoster,
            },
            message: quotedMsg,
        };

        let buffer;
        try {
            buffer = await downloadMedia(mediaObj, mediaEntry.dlType);
        } catch (dlErr) {
            console.error('[AutoSaveStatus] Download failed:', dlErr.message);
            await sock.sendMessage(ownerNumber, {
                text: `${header}\n\n⚠️ Could not download this status — it may have expired.`,
                mentions: [statusPoster],
            });
            return;
        }

        if (!buffer || buffer.length === 0) return;

        // Pull extra info from the media message
        const caption    = mediaObj?.caption     || '';
        const mimetype   = mediaObj?.mimetype    || '';
        const fileName   = mediaObj?.fileName    || 'status';
        const ptt        = mediaObj?.ptt         || false;

        const sendCaption = header + (caption ? `\n\n*📝 Caption:* ${caption}` : '');

        // Send header text first — holds all details
        const sentHeader = await sock.sendMessage(ownerNumber, {
            text:     `${header}${caption ? `\n\n*📝 Caption:* ${caption}` : ''}`,
            mentions: [statusPoster],
        });

        // Media quotes the header — no repeated caption or details
        const mediaPayload = {};
        if (mediaEntry.type === 'image')    mediaPayload.image    = buffer;
        if (mediaEntry.type === 'video')    mediaPayload.video    = buffer;
        if (mediaEntry.type === 'sticker')  mediaPayload.sticker  = buffer;
        if (mediaEntry.type === 'audio') {
            mediaPayload.audio    = buffer;
            mediaPayload.mimetype = mimetype || 'audio/ogg; codecs=opus';
            mediaPayload.ptt      = ptt;
        }
        if (mediaEntry.type === 'document') {
            mediaPayload.document = buffer;
            mediaPayload.mimetype = mimetype || 'application/octet-stream';
            mediaPayload.fileName = fileName || 'status';
        }
        await sock.sendMessage(ownerNumber, mediaPayload, { quoted: sentHeader });

        console.log(`[AutoSaveStatus] ${mediaEntry.type} status from ${posterNum} → sent to owner PM`);

    } catch (err) {
        console.error('[AutoSaveStatus] Error:', err.message);
    }
}

module.exports = { handleStatusReply };
