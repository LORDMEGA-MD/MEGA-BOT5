const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const sharp  = require('sharp');
const webp   = require('node-webpmux');
const ffmpegPath = require('ffmpeg-static');
const settings   = require('../settings');

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

function tmpDir() {
    const dir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function tmpFile(prefix, ext) {
    return path.join(tmpDir(), `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext ? '.' + ext : ''}`);
}

function safeUnlink(...files) {
    for (const f of files) {
        try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    }
}

function safeRmDir(dir) {
    try { if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

// Always use ffmpeg-static binary — system ffmpeg has broken animated webp demuxer
function execAsync(cmd) {
    // Replace leading "ffmpeg" with the static binary path
    const resolved = cmd.replace(/^ffmpeg\b/, `"${ffmpegPath}"`);
    return new Promise((resolve, reject) => {
        exec(resolved, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) =>
            err ? reject(Object.assign(err, { stderr })) : resolve()
        );
    });
}

/**
 * Detect animated WebP by ANIM chunk presence.
 */
function isAnimatedWebp(buffer) {
    try {
        if (!buffer || buffer.length < 16) return false;
        if (buffer.toString('ascii', 0, 4) !== 'RIFF') return false;
        if (buffer.toString('ascii', 8, 12) !== 'WEBP') return false;
        return buffer.slice(12, Math.min(buffer.length, 65536)).toString('binary').includes('ANIM');
    } catch { return false; }
}

/**
 * Validate buffer is a real WebP.
 */
function isValidWebpBuffer(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
    return buffer.toString('ascii', 0, 4) === 'RIFF' &&
           buffer.toString('ascii', 8, 12) === 'WEBP';
}

// ---------------------------------------------------------------------------
// Sharp-based animated WebP frame extractor
//
// sharp(buffer, { pages: -1 }) loads ALL frames.
// The output PNG is a vertical sprite sheet: total height = pageHeight * pages.
// We slice it into individual frame PNGs and write them to frameDir.
//
// Returns: { frameCount, fps }
// ---------------------------------------------------------------------------

async function extractFramesToDir(webpBuffer, frameDir) {
    fs.mkdirSync(frameDir, { recursive: true });

    // Load all pages (frames) — sharp handles ANIM/ANMF natively via libvips
    const sharpInst = sharp(webpBuffer, { pages: -1, animated: true });
    const meta = await sharpInst.metadata();

    const frameCount = meta.pages || 1;
    // delay is an array of ms durations per frame; fall back to 100ms
    const delays = meta.delay || [];
    const avgDelay = delays.length > 0
        ? delays.reduce((a, b) => a + b, 0) / delays.length
        : 100;
    const fps = Math.min(Math.max(Math.round(1000 / Math.max(avgDelay, 1)), 8), 30);

    if (frameCount === 1) {
        // Static — just write one PNG
        const pngBuf = await sharp(webpBuffer).png().toBuffer();
        fs.writeFileSync(path.join(frameDir, 'frame_00000.png'), pngBuf);
        return { frameCount: 1, fps: 1 };
    }

   // Get sprite sheet — force RGBA so raw descriptor is always correct
const { data: sprite, info } = await sharp(webpBuffer, { pages: -1, animated: true })
    .ensureAlpha()   // guarantees 4-channel RGBA output
    .raw()           // raw pixels — avoids PNG re-decode overhead
    .toBuffer({ resolveWithObject: true });

const CHANNELS    = 4;  // ensureAlpha() always gives RGBA
const frameHeight = info.pageHeight || Math.floor(info.height / frameCount);
const frameWidth  = info.width;

// Slice each frame from the vertical sprite sheet
for (let i = 0; i < frameCount; i++) {
    const frameBuf = await sharp(sprite, {
        raw: { width: frameWidth, height: info.height, channels: CHANNELS }
    })
    .extract({ left: 0, top: i * frameHeight, width: frameWidth, height: frameHeight })
        .png()
        .toBuffer();

        const framePath = path.join(frameDir, `frame_${String(i).padStart(5, '0')}.png`);
        fs.writeFileSync(framePath, frameBuf);
    }

    return { frameCount, fps };
}

// ---------------------------------------------------------------------------
// EXIF builder for sticker metadata
// ---------------------------------------------------------------------------

function buildExif(packname) {
    const json = {
        'sticker-pack-id':   crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': packname || 'MegaBot',
        'emojis':            ['🤖']
    };
    const exifAttr = Buffer.from([
        0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
        0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
        0x00,0x00,0x16,0x00,0x00,0x00
    ]);
    const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
    const exif    = Buffer.concat([exifAttr, jsonBuf]);
    exif.writeUIntLE(jsonBuf.length, 14, 4);
    return exif;
}

async function applyExif(webpBuffer, packname) {
    const img = new webp.Image();
    await img.load(webpBuffer);
    img.exif = buildExif(packname);
    return img.save(null);
}

// ---------------------------------------------------------------------------
// Resolve target message — direct or quoted
// ---------------------------------------------------------------------------

function resolveTarget(message, chatId) {
    let targetMessage = message;

    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const ctx = message.message.extendedTextMessage.contextInfo;
        targetMessage = {
            key: {
                remoteJid: chatId,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: ctx.quotedMessage
        };
    }

    const msg = targetMessage.message;
    const mediaMessage =
        msg?.imageMessage    ||
        msg?.videoMessage    ||
        msg?.documentMessage ||
        msg?.stickerMessage  ||
        null;

    const messageType =
        msg?.imageMessage    ? 'image'    :
        msg?.videoMessage    ? 'video'    :
        msg?.documentMessage ? 'document' :
        msg?.stickerMessage  ? 'sticker'  : null;

    return { targetMessage, mediaMessage, messageType };
}

// ---------------------------------------------------------------------------
// Download helper with validation
// ---------------------------------------------------------------------------

async function downloadSticker(sock, targetMessage, chatId, messageToQuote, cmdLabel) {
    const buf = await downloadMediaMessage(targetMessage, 'buffer', {}, {
        logger: undefined,
        reuploadRequest: sock.updateMediaMessage
    });

    if (!buf || !isValidWebpBuffer(buf)) {
        await sock.sendMessage(chatId, {
            text: `> ❌ Failed to download sticker.`
        }, { quoted: messageToQuote });
        return null;
    }
    return buf;
}

// ---------------------------------------------------------------------------
// STICKER — image/video → webp sticker
// Uses ffmpeg-static binary (not system ffmpeg)
// ---------------------------------------------------------------------------

async function handleSticker(sock, chatId, message) {
    const messageToQuote = message;
    const { targetMessage, mediaMessage, messageType } = resolveTarget(message, chatId);

    if (!mediaMessage || !['image', 'video', 'document'].includes(messageType)) {
        return sock.sendMessage(chatId, {
            text: 'Please reply to an image/video with .sticker, or send an image/video with .sticker as caption.',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '2120363161513685998@newsletter',
                    newsletterName: 'MegaBot MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: messageToQuote });
    }

    const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, {
        logger: undefined,
        reuploadRequest: sock.updateMediaMessage
    });

    if (!mediaBuffer) {
        return sock.sendMessage(chatId, {
            text: 'Failed to download media. Please try again.',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '2120363161513685998@newsletter',
                    newsletterName: 'MegaBot MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: messageToQuote });
    }

    const tempInput  = tmpFile('stk_in', '');
    const tempOutput = tmpFile('stk_out', 'webp');
    fs.writeFileSync(tempInput, mediaBuffer);

    const isAnimated = mediaMessage.mimetype?.includes('gif') ||
                       mediaMessage.mimetype?.includes('video') ||
                       (mediaMessage.seconds || 0) > 0;

    const baseCmd = isAnimated
        ? `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
        : `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

    await execAsync(baseCmd);

    let webpBuffer = fs.readFileSync(tempOutput);

    if (isAnimated && webpBuffer.length > 1000 * 1024) {
        const tempOutput2 = tmpFile('stk_fb', 'webp');
        const isLarge     = mediaBuffer.length / 1024 > 5000;
        const fallbackCmd = isLarge
            ? `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=8,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput2}"`
            : `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 45 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempOutput2}"`;
        try {
            await execAsync(fallbackCmd);
            if (fs.existsSync(tempOutput2)) webpBuffer = fs.readFileSync(tempOutput2);
        } catch {}
        safeUnlink(tempOutput2);
    }

    let finalBuffer = await applyExif(webpBuffer, settings.packname);

    if (isAnimated && finalBuffer.length > 900 * 1024) {
        const tempOutput3 = tmpFile('stk_sm', 'webp');
        try {
            await execAsync(`ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=320:320:force_original_aspect_ratio=decrease,fps=8,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 80k -max_muxing_queue_size 1024 "${tempOutput3}"`);
            if (fs.existsSync(tempOutput3)) {
                const smallWebp = fs.readFileSync(tempOutput3);
                finalBuffer = await applyExif(smallWebp, settings.packname);
            }
        } catch {}
        safeUnlink(tempOutput3);
    }

    await sock.sendMessage(chatId, { sticker: finalBuffer }, { quoted: messageToQuote });
    safeUnlink(tempInput, tempOutput);
}

// ---------------------------------------------------------------------------
// STICKERI — sticker → high-quality PNG image
// sharp decodes the webp (animated or static) natively — no ffmpeg webp input
// ---------------------------------------------------------------------------

async function handleToImage(sock, chatId, message) {
    const messageToQuote = message;
    const { targetMessage, mediaMessage, messageType } = resolveTarget(message, chatId);

    if (!mediaMessage || messageType !== 'sticker') {
        return sock.sendMessage(chatId, {
            text: '> ❌ Reply to a sticker to use .stickeri'
        }, { quoted: messageToQuote });
    }

    const mediaBuffer = await downloadSticker(sock, targetMessage, chatId, messageToQuote, 'stickeri');
    if (!mediaBuffer) return;

    const animated = isAnimatedWebp(mediaBuffer);
    const tempOut  = tmpFile('toi_out', 'png');

    try {
        let pngBuffer;

        if (animated) {
            // Extract first frame only from animated webp via sharp
            const meta = await sharp(mediaBuffer, { pages: 1, animated: false }).metadata();
            pngBuffer = await sharp(mediaBuffer, { pages: 1, animated: false })
                .png()
                .toBuffer();
        } else {
            pngBuffer = await sharp(mediaBuffer).png().toBuffer();
        }

        // Upscale + sharpen via ffmpeg-static (PNG→PNG — always works)
        const tempMid = tmpFile('toi_mid', 'png');
        fs.writeFileSync(tempMid, pngBuffer);

        const ffmpegCmd =
            `ffmpeg -y -i "${tempMid}" ` +
            `-vf "scale=1024:1024:force_original_aspect_ratio=decrease:flags=lanczos,` +
            `pad=1024:1024:(ow-iw)/2:(oh-ih)/2:color=#00000000,` +
            `unsharp=5:5:1.0:5:5:0.0,format=rgba" ` +
            `-compression_level 1 -pred mixed "${tempOut}"`;

        try {
            await execAsync(ffmpegCmd);
        } catch {
            // Fallback: send sharp-decoded PNG at native res
            await sock.sendMessage(chatId, {
                image: pngBuffer,
                mimetype: 'image/png',
                caption: '> 🖼️ Sticker → Image (native resolution)'
            }, { quoted: messageToQuote });
            safeUnlink(tempMid);
            return;
        }

        safeUnlink(tempMid);

        if (!fs.existsSync(tempOut) || fs.statSync(tempOut).size === 0) {
            // Fallback to native res
            await sock.sendMessage(chatId, {
                image: pngBuffer,
                mimetype: 'image/png',
                caption: '> 🖼️ Sticker → Image (native resolution)'
            }, { quoted: messageToQuote });
            return;
        }

        const outBuffer = fs.readFileSync(tempOut);
        await sock.sendMessage(chatId, {
            image: outBuffer,
            mimetype: 'image/png',
            caption: animated
                ? '> 🖼️ Animated sticker → Image (first frame, 1024px)'
                : '> 🖼️ Sticker → Image (1024px upscaled)'
        }, { quoted: messageToQuote });

    } catch (err) {
        console.error('[stickeri] error:', err);
        await sock.sendMessage(chatId, {
            text: '> ❌ Failed to decode sticker.'
        }, { quoted: messageToQuote });
    } finally {
        safeUnlink(tempOut);
    }
}

// ---------------------------------------------------------------------------
// STICKERV — sticker → MP4 video
//
// Pipeline:
//   sharp extracts all frames from animated webp into a tmp frameDir as PNGs
//   ffmpeg-static encodes PNG sequence → MP4 (PNG input always works)
//   Static webp: single frame looped 3 seconds
// ---------------------------------------------------------------------------

async function handleToVid(sock, chatId, message) {
    const messageToQuote = message;
    const { targetMessage, mediaMessage, messageType } = resolveTarget(message, chatId);

    if (!mediaMessage || messageType !== 'sticker') {
        return sock.sendMessage(chatId, {
            text: '> ❌ Reply to a sticker to use .stickerv'
        }, { quoted: messageToQuote });
    }

    const mediaBuffer = await downloadSticker(sock, targetMessage, chatId, messageToQuote, 'stickerv');
    if (!mediaBuffer) return;

    const animated = isAnimatedWebp(mediaBuffer);
    const tempOut  = tmpFile('tov_out', 'mp4');
    const frameDir = path.join(tmpDir(), `tov_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`);

    try {
        let ffmpegCmd;

        if (animated) {
            // sharp extracts all frames — full ANIM/ANMF support via libvips
            const { frameCount, fps } = await extractFramesToDir(mediaBuffer, frameDir);

            ffmpegCmd =
                `ffmpeg -y -framerate ${fps} -i "${path.join(frameDir, 'frame_%05d.png')}" ` +
                `-vf "scale=1024:1024:force_original_aspect_ratio=decrease:flags=lanczos,` +
                `pad=1024:1024:(ow-iw)/2:(oh-ih)/2:color=black,` +
                `unsharp=5:5:1.2:5:5:0.0,format=yuv420p" ` +
                `-c:v libx264 -crf 14 -preset slow -an ` +
                `-movflags +faststart "${tempOut}"`;

        } else {
            // Static webp → sharp decode → single PNG → looped 3s video
            fs.mkdirSync(frameDir, { recursive: true });
            const pngBuffer   = await sharp(mediaBuffer).png().toBuffer();
            const singleFrame = path.join(frameDir, 'frame_00000.png');
            fs.writeFileSync(singleFrame, pngBuffer);

            ffmpegCmd =
                `ffmpeg -y -loop 1 -i "${singleFrame}" -t 3 ` +
                `-vf "scale=1024:1024:force_original_aspect_ratio=decrease:flags=lanczos,` +
                `pad=1024:1024:(ow-iw)/2:(oh-ih)/2:color=black,` +
                `unsharp=5:5:1.2:5:5:0.0,format=yuv420p" ` +
                `-c:v libx264 -crf 14 -preset slow -an ` +
                `-movflags +faststart "${tempOut}"`;
        }

        await execAsync(ffmpegCmd);

        if (!fs.existsSync(tempOut) || fs.statSync(tempOut).size === 0) {
            return sock.sendMessage(chatId, {
                text: '> ❌ Conversion produced empty output.'
            }, { quoted: messageToQuote });
        }

        const outBuffer = fs.readFileSync(tempOut);
        await sock.sendMessage(chatId, {
            video: outBuffer,
            mimetype: 'video/mp4',
            caption: animated
                ? '> 🎬 Animated sticker → Video (1024px, CRF 14)'
                : '> 🎬 Static sticker → Video (1024px, 3s, CRF 14)'
        }, { quoted: messageToQuote });

    } catch (err) {
        console.error('[stickerv] error:', err);
        await sock.sendMessage(chatId, {
            text: `> ❌ Failed to convert sticker.\n${err.message}`
        }, { quoted: messageToQuote });
    } finally {
        safeRmDir(frameDir);
        safeUnlink(tempOut);
    }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

async function stickerCommand(sock, chatId, message) {
    const rawText = (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        ''
    ).trim().toLowerCase();

    const cmdWord = rawText.replace(/^[.!#\/]/, '').split(/\s+/)[0];

    try {
        if (cmdWord === 'stickeri') return await handleToImage(sock, chatId, message);
        if (cmdWord === 'stickerv') return await handleToVid(sock, chatId, message);
        return await handleSticker(sock, chatId, message);
    } catch (err) {
        console.error(`[sticker/${cmdWord}] unhandled error:`, err);
        await sock.sendMessage(chatId, {
            text: `> ❌ Failed.\n${err.message}`
        }, { quoted: message });
    }
}

module.exports = stickerCommand;
