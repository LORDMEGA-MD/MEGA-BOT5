'use strict';

const { downloadMediaMessage, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
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

// ─── Target dimensions (9:16 portrait) ────────────────────────────────────────
const PORTRAIT_W = 720;
const PORTRAIT_H = 1280;

// ─── Pad image to 9:16 with black bars ────────────────────────────────────────
async function padToPortrait(imageBuffer) {
  const img = await Jimp.read(imageBuffer);
  const srcW = img.getWidth();
  const srcH = img.getHeight();

  const scale = Math.min(PORTRAIT_W / srcW, PORTRAIT_H / srcH);
  const newW = Math.round(srcW * scale);
  const newH = Math.round(srcH * scale);

  img.resize(newW, newH, Jimp.RESIZE_LANCZOS3);

  const canvas = new Jimp(PORTRAIT_W, PORTRAIT_H, 0x000000ff);
  const x = Math.floor((PORTRAIT_W - newW) / 2);
  const y = Math.floor((PORTRAIT_H - newH) / 2);
  canvas.composite(img, x, y);

  return canvas.getBufferAsync(Jimp.MIME_JPEG);
}

// ─── Upload profile picture bypassing Baileys' square crop ───────────────────
async function uploadProfilePicture(sock, jid, imageBuffer) {
  // prepareWAMessageMedia uploads the image to WA servers and returns the encrypted blob
  const { img } = await prepareWAMessageMedia(
    { image: imageBuffer },
    { upload: sock.waUploadToServer }
  );

  // Send raw IQ stanza — bypasses Baileys' internal square resize in updateProfilePicture()
  await sock.query({
    tag: 'iq',
    attrs: {
      to: jid,
      type: 'set',
      xmlns: 'w:profile:picture'
    },
    content: [
      {
        tag: 'picture',
        attrs: { type: 'image' },
        content: img
      }
    ]
  });
}

// ─── Extract image buffer from message or quoted message ──────────────────────
async function extractImageBuffer(sock, message) {
  const msg = message.message;

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
    return downloadMediaMessage(fakeMsg, 'buffer', {}, {
      logger: console,
      reuploadRequest: sock.updateMediaMessage
    });
  }

  if (msg?.imageMessage) {
    return downloadMediaMessage(message, 'buffer', {}, {
      logger: console,
      reuploadRequest: sock.updateMediaMessage
    });
  }

  return null;
}

// ─── .setfpp — set bot's own profile picture ──────────────────────────────────
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
        text: '❌ Please send an image with caption *.setfpp*, or quote an image.',
        ...channelInfo
      }, { quoted: message });
    }

    const paddedBuffer = await padToPortrait(imageBuffer);
    await uploadProfilePicture(sock, sock.user.id, paddedBuffer);

    return sock.sendMessage(chatId, {
      text: '✅ Bot profile picture updated to full-screen portrait (9:16)!',
      ...channelInfo
    }, { quoted: message });

  } catch (err) {
    console.error('[SETFPP] Error:', err.message);
    return sock.sendMessage(chatId, {
      text: `❌ Failed to update profile picture: ${err.message}`,
      ...channelInfo
    }, { quoted: message });
  }
}

// ─── .setfgg — set group profile picture ──────────────────────────────────────
async function handleSetGPP(sock, chatId, message) {
  try {
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
        text: '❌ Please send an image with caption *.setfgg*, or quote an image.',
        ...channelInfo
      }, { quoted: message });
    }

    const paddedBuffer = await padToPortrait(imageBuffer);
    await uploadProfilePicture(sock, chatId, paddedBuffer);

    return sock.sendMessage(chatId, {
      text: '✅ Group profile picture updated to full-screen portrait (9:16)!',
      ...channelInfo
    }, { quoted: message });

  } catch (err) {
    console.error('[SETFGG] Error:', err.message);
    return sock.sendMessage(chatId, {
      text: `❌ Failed to update group profile picture: ${err.message}`,
      ...channelInfo
    }, { quoted: message });
  }
}

module.exports = { handleSetPP, handleSetGPP };
