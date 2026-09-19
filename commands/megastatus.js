const { proto, downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs     = require('fs');
const fspath = require('path');
const { tmpdir } = require('os');
const sharp  = require('sharp');
const { exec } = require('child_process');

const MAX_AUDIO_BYTES = 16 * 1024 * 1024;

/**
 * Sends status scoped to current group members
 */
async function sendGroupScopedStatus(sock, groupJid, content, options = {}) {
    if (!groupJid.endsWith('@g.us')) {
        throw new Error('Only works in groups');
    }

    let participants = [];
    try {
        const meta = await sock.groupMetadata(groupJid);
        participants = meta.participants
            .map(p => p.id)
            .filter(id => id !== sock.user?.id);

        if (participants.length === 0) throw new Error('No members');
    } catch (err) {
        throw new Error(`Group fetch failed: ${err.message}`);
    }

    const statusOptions = {
        broadcast: true,
        statusJidList: participants,
        backgroundColor: options.backgroundColor || '#000000',
        font: options.font || 0,
        ...options
    };

    try {
        const result = await sock.sendMessage('status@broadcast', content, statusOptions);
        console.log(`[GSTATUS] Sent | ${participants.length} recipients | Key: ${result?.key?.id}`);
        return result;
    } catch (err) {
        console.error('[GSTATUS SEND ERROR]', err.message || err);
        throw err;
    }
}

// ── Document → status resolution ──────────────────────────────────────────────
// Statuses on WhatsApp don't support posting a raw "document" the way normal
// chat messages do — status@broadcast only really renders text/image/video.
// A documentMessage is really just a file-picker wrapper around whatever the
// actual bytes are, so we look at its real mimetype/filename and route it:
//   - PDF          -> render first page to a JPEG, post as image
//   - image/*      -> post as image
//   - video/*      -> post as video
//   - audio/*      -> post as audio (re-encoded to opus/ogg if needed)
//   - anything else -> unsupported, caller falls back to text

function detectDocumentKind(mimetype, filename) {
    const mt = (mimetype || '').toLowerCase();
    const fn = (filename || '').toLowerCase();
    if (/^image\//.test(mt) || /\.(jpe?g|png|webp|gif|bmp)$/.test(fn)) return 'image';
    if (/^video\//.test(mt) || /\.(mp4|mkv|mov|webm|avi|3gp)$/.test(fn)) return 'video';
    if (/^audio\//.test(mt) || /\.(mp3|ogg|opus|m4a|wav|aac)$/.test(fn)) return 'audio';
    if (/pdf/.test(mt) || /\.pdf$/.test(fn)) return 'pdf';
    return 'unsupported';
}

async function pdfToImage(buf) {
    const ts        = Date.now();
    const pdfPath   = fspath.join(tmpdir(), `mgdoc_${ts}.pdf`);
    const outPrefix = fspath.join(tmpdir(), `mgdoc_${ts}`);
    const pngPath   = `${outPrefix}-1.png`;
    try {
        fs.writeFileSync(pdfPath, buf);
        await new Promise((resolve, reject) => {
            exec(
                `pdftoppm -png -r 200 -f 1 -l 1 "${pdfPath}" "${outPrefix}"`,
                err => err ? reject(new Error(`pdftoppm failed: ${err.message}`)) : resolve()
            );
        });
        if (!fs.existsSync(pngPath)) throw new Error('pdftoppm produced no output');
        const jpegBuf = await sharp(pngPath)
            .flatten({ background: '#ffffff' })
            .jpeg({ quality: 90 })
            .toBuffer();
        if (!jpegBuf || jpegBuf.length === 0) throw new Error('PDF\u2192JPEG conversion produced empty buffer');
        return jpegBuf;
    } finally {
        try { fs.unlinkSync(pdfPath); } catch (_) {}
        try { fs.unlinkSync(pngPath); } catch (_) {}
    }
}

function probeIsOpus(buf) {
    const { spawn } = require('child_process');
    return new Promise(resolve => {
        const ff = spawn('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_streams', 'pipe:0']);
        const chunks = [];
        ff.stdout.on('data', c => chunks.push(c));
        ff.on('error', () => resolve(false));
        ff.on('close', () => {
            try {
                const info = JSON.parse(Buffer.concat(chunks).toString());
                resolve((info.streams || []).some(s => s.codec_name === 'opus' && s.codec_type === 'audio'));
            } catch { resolve(false); }
        });
        ff.stdin.write(buf); ff.stdin.end();
    });
}

function toOpus(inputBuffer) {
    const { spawn } = require('child_process');
    return new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
            '-v', 'error', '-i', 'pipe:0',
            '-map', '0:a:0', '-map_metadata', '-1',
            '-c:a', 'libopus', '-ar', '48000', '-ac', '1',
            '-b:a', '64k', '-vbr', 'on', '-compression_level', '10',
            '-af', 'aresample=resampler=swr', '-f', 'ogg', 'pipe:1'
        ]);
        const chunks = [], errChunks = [];
        ff.stdout.on('data', c => chunks.push(c));
        ff.stderr.on('data', c => errChunks.push(c));
        ff.on('error', err => reject(new Error(`ffmpeg spawn failed: ${err.message}`)));
        ff.on('close', code => {
            const output = Buffer.concat(chunks);
            if (code === 0 && output.length > 0) return resolve(output);
            reject(new Error(`ffmpeg exited ${code}. stderr: ${Buffer.concat(errChunks).toString().slice(0, 500)}`));
        });
        ff.stdin.on('error', () => {});
        ff.stdin.write(inputBuffer); ff.stdin.end();
    });
}

async function safeToOpus(buf) {
    if (await probeIsOpus(buf)) return buf;
    return toOpus(buf);
}

// Resolves a downloaded "document" buffer into { kind, buffer } ready to post
// as a status, or throws if the document type isn't something a status can
// represent (e.g. a .zip or .docx — those just don't have a status form).
async function resolveDocumentForStatus(buf, mimetype, filename) {
    const kind = detectDocumentKind(mimetype, filename);
    if (kind === 'pdf') {
        return { kind: 'image', buffer: await pdfToImage(buf) };
    }
    if (kind === 'image' || kind === 'video') {
        return { kind, buffer: buf };
    }
    if (kind === 'audio') {
        return { kind: 'audio', buffer: await safeToOpus(buf) };
    }
    throw new Error(`Unsupported document type for status (mimetype: ${mimetype || 'unknown'})`);
}

/**
 * Command handler: .gstatus [caption] (reply to media optional)
 */
async function handleMegaStatus(sock, message, chatId, textAfterCommand) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ Use .megastatus only in groups' });
        return;
    }

    const caption = textAfterCommand.trim() || '';

    let content = { text: caption || ' ' }; // default blank/fallback text

    // Check for quoted message with media
    const quotedContext = message.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quotedContext?.quotedMessage;

    if (quotedMsg) {
        try {
            // Download media from the quoted message
            const buffer = await downloadMediaMessage(
                { key: quotedContext.stanzaId ? { ...quotedContext, remoteJid: chatId } : message.key, message: quotedMsg },
                'buffer',
                {},
                { logger: sock.logger || console, reuploadRequest: sock.updateMediaMessage }
            );

            const msgType = Object.keys(quotedMsg)[0]; // e.g. imageMessage, videoMessage

            if (msgType === 'imageMessage') {
                content = { image: buffer, caption: caption || quotedMsg.imageMessage?.caption || ' ' };
            } else if (msgType === 'videoMessage') {
                content = { video: buffer, caption: caption || quotedMsg.videoMessage?.caption || ' ' };
            } else if (msgType === 'stickerMessage') {
                content = { sticker: buffer };
            } else if (msgType === 'documentMessage') {
                // Documents can't be posted as-is to status@broadcast — resolve
                // to whatever real media type they actually are (or bail with
                // a clear text fallback if it's a type statuses can't show).
                const mimetype = quotedMsg.documentMessage?.mimetype || '';
                const filename = quotedMsg.documentMessage?.fileName || '';
                const docCaption = caption || quotedMsg.documentMessage?.caption || filename || ' ';

                try {
                    const resolved = await resolveDocumentForStatus(buffer, mimetype, filename);
                    if (resolved.kind === 'image') {
                        content = { image: resolved.buffer, caption: docCaption };
                    } else if (resolved.kind === 'video') {
                        content = { video: resolved.buffer, caption: docCaption };
                    } else if (resolved.kind === 'audio') {
                        if (resolved.buffer.length > MAX_AUDIO_BYTES) {
                            await sock.sendMessage(chatId, {
                                text: `❌ Audio too large (${(resolved.buffer.length / 1024 / 1024).toFixed(1)} MB). Max ${MAX_AUDIO_BYTES / 1024 / 1024} MB.`
                            }, { quoted: message });
                            return;
                        }
                        content = { audio: resolved.buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
                    }
                    console.log(`[GSTATUS] Document resolved as: ${resolved.kind} (${filename || mimetype})`);
                } catch (convErr) {
                    console.error('[GSTATUS DOCUMENT ERROR]', convErr.message || convErr);
                    await sock.sendMessage(chatId, {
                        text: `❌ Can't post this document type as a status: ${convErr.message}`
                    }, { quoted: message });
                    return;
                }
            } else {
                content = { text: caption || 'Quoted non-media message' };
            }

            console.log(`[GSTATUS] Quoted media type: ${msgType}`);
        } catch (downloadErr) {
            console.error('[GSTATUS DOWNLOAD ERROR]', downloadErr.message || downloadErr);
            content = { text: caption || 'Failed to download quoted media — posting text only' };
        }
    } else if (!caption) {
        await sock.sendMessage(chatId, { text: '❌ Reply to media or add text after .megastatus' });
        return;
    }

    try {
        await sendGroupScopedStatus(sock, chatId, content, {
            backgroundColor: '#1E90FF', // optional styling
            font: 2
        });

        await sock.sendMessage(chatId, { 
            text: ' *POSTED AS STATUS* !(scoped to only saved group members)\n> _BY MEGA-BOT_' 
        }, { quoted: message });
    } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Failed to post: ${err.message}` }, { quoted: message });
    }
}

module.exports = {
    handleMegaStatus
};
