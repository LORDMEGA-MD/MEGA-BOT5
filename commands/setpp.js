'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '2120363161513685998@newsletter',
      newsletterName: 'MegaBot MD',
      serverMessageId: -1
    }
  }
};

// ─── Target dimensions ──────────────────────────────────────────────────────────
const PORTRAIT_W = 720;
const PORTRAIT_H = 1280; // 9:16

// ─── Pad image to 9:16 with black bars ─────────────────────────────────────────
async function padToPortrait(imageBuffer) {
  const img = await Jimp.read(imageBuffer);
  const srcW = img.getWidth();
  const srcH = img.getHeight();

  // Scale to fit inside 720x1280 while preserving aspect ratio
  const scale = Math.min(PORTRAIT_W / srcW, PORTRAIT_H / srcH);
  const newW = Math.round(srcW * scale);
  const newH = Math.round(srcH * scale);

  img.resize(newW, newH, Jimp.RESIZE_LANCZOS3);

  // Create black 9:16 canvas and composite image centered
  const canvas = new Jimp(PORTRAIT_W, PORTRAIT_H, 0x000000ff);
  const x = Math.floor((PORTRAIT_W - newW) / 2);
  const y = Math.floor((PORTRAIT_H - newH) / 2);
  canvas.composite(img, x, y);

  return canvas.getBufferAsync(Jimp.MIME_JPEG);
}

// ─── Extract image buffer from message ─────────────────────────────────────────
async function extractImageBuffer(sock, message) {
  const msg = message.message;

  // Check quoted message first
  const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const fakeMsg = {
      key: {
        remoteJid: message.key.remoteJid,
        id: msg.extendedTextMessage.contextInfo.stanzaId,
        fromMe: false
      },
      message: { imageMessage: quoted.imageMessage }
    };
    return downloadMediaMessage(fakeMsg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
  }

  // Direct image message
  if (msg?.imageMessage) {
    return downloadMediaMessage(message, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
  }

  return null;
}

// ─── .setpp — set bot's own profile picture ────────────────────────────────────
async function handleSetPP(sock, chatId, message) {
  try {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
      return sock.sendMessage(chatId, {
        text: '❌ Only the bot owner can change the profile picture.',
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: '⏳ Processing image...',
      ...channelInfo
    }, { quoted: message });

    const imageBuffer = await extractImageBuffer(sock, message);
    if (!imageBuffer) {
      return sock.sendMessage(chatId, {
        text: '❌ Please send an image with the caption *.setpp*, or quote an image.',
        ...channelInfo
      }, { quoted: message });
    }

    const paddedBuffer = await padToPortrait(imageBuffer);

    await sock.updateProfilePicture(sock.user.id, paddedBuffer);

    return sock.sendMessage(chatId, {
      text: '✅ Bot profile picture updated to full-screen portrait (9:16)!',
      ...channelInfo
    }, { quoted: message });

  } catch (err) {
    console.error('[SETPP] Error:', err.message);
    return sock.sendMessage(chatId, {
      text: `❌ Failed to update profile picture: ${err.message}`,
      ...channelInfo
    }, { quoted: message });
  }
}

// ─── .setgpp — set group profile picture ───────────────────────────────────────
async function handleSetGPP(sock, chatId, message) {
  try {
    // Must be used in a group
    if (!chatId.endsWith('@g.us')) {
      return sock.sendMessage(chatId, {
        text: '❌ This command can only be used in a group.',
        ...channelInfo
      }, { quoted: message });
    }

    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
      return sock.sendMessage(chatId, {
        text: '❌ Only the bot owner can change the group profile picture.',
        ...channelInfo
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: '⏳ Processing image...',
      ...channelInfo
    }, { quoted: message });

    const imageBuffer = await extractImageBuffer(sock, message);
    if (!imageBuffer) {
      return sock.sendMessage(chatId, {
        text: '❌ Please send an image with the caption *.setgpp*, or quote an image.',
        ...channelInfo
      }, { quoted: message });
    }

    const paddedBuffer = await padToPortrait(imageBuffer);

    await sock.updateProfilePicture(chatId, paddedBuffer);

    return sock.sendMessage(chatId, {
      text: '✅ Group profile picture updated to full-screen portrait (9:16)!',
      ...channelInfo
    }, { quoted: message });

  } catch (err) {
    console.error('[SETGPP] Error:', err.message);
    return sock.sendMessage(chatId, {
      text: `❌ Failed to update group profile picture: ${err.message}`,
      ...channelInfo
    }, { quoted: message });
  }
}

module.exports = { handleSetPP, handleSetGPP };
