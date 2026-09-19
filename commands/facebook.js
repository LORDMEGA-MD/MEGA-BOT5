const axios = require('axios');

const processedMessages = new Set();

const API_KEY = process.env.XWOLF_API_KEY || process.env.XWOLF_BOT_KEY || 'wxa_u_xwk7sch6xj';
const XWOLF   = 'https://apis.xwolf.space/api/download';
const XCASPER = 'https://apis.xcasper.space/api/downloader';

const FB_PATTERNS = [
  /https?:\/\/(?:www\.|m\.)?facebook\.com\/.+\/videos\/.+/i,
  /https?:\/\/(?:www\.|m\.)?facebook\.com\/watch/i,
  /https?:\/\/(?:www\.|m\.)?fb\.watch\/.+/i,
  /https?:\/\/(?:www\.)?facebook\.com\/reel\/.+/i,
  /https?:\/\/(?:www\.)?facebook\.com\/share\/.+/i,
  /https?:\/\/(?:www\.)?facebook\.com\/.+\/video/i,
  /https?:\/\/(?:www\.)?fb\.com\/.+/i,
];

function isValidFbUrl(url) {
  return FB_PATTERNS.some(p => p.test(url));
}

function isReel(url) {
  return /\/reel\/|\/share\/v\//i.test(url);
}

async function proxyFetch(url, timeoutMs = 120_000) {
  const proxyUrl = `https://apis.xwolf.space/api/proxy?url=${encodeURIComponent(url)}&key=${API_KEY}`;
  for (const attempt of [proxyUrl, url]) {
    try {
      const res = await axios.get(attempt, {
        responseType: 'arraybuffer',
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.facebook.com/',
        },
        maxRedirects: 10,
      });
      const buf = Buffer.from(res.data);
      if (buf.byteLength > 10_000) return buf;
    } catch (e) {
      console.log(`[FB/fetch] failed: ${e.message}`);
    }
  }
  return null;
}

async function fetchXWolf(url) {
  const endpoint = isReel(url) ? `${XWOLF}/facebook/reel` : `${XWOLF}/facebook`;
  try {
    const res = await axios.get(endpoint, { params: { url, key: API_KEY }, timeout: 30000 });
    const d = res.data;
    if (!d?.success) return null;
    const videoUrl = d.hdProxyUrl || d.hdUrl || d.sdProxyUrl || d.sdUrl || null;
    if (!videoUrl) return null;
    return {
      videoUrl,
      hdUrl: d.hdUrl  || d.hdProxyUrl || null,
      sdUrl: d.sdUrl  || d.sdProxyUrl || null,
      title: d.title  || 'Facebook Video',
    };
  } catch (e) {
    console.log(`[FB/xwolf] ${e.message}`);
    return null;
  }
}

async function fetchXCasper(url) {
  for (const ep of ['fb', 'fb2']) {
    try {
      const res = await axios.get(`${XCASPER}/${ep}`, { params: { url }, timeout: 30000 });
      const d = res.data;
      if (!d?.success) continue;
      const hd     = d.hd  || d.data?.hd  || null;
      const sd     = d.sd  || d.data?.sd  || null;
      const direct = d.url || d.data?.url  || null;
      const medias = d.data?.medias || d.data?.media || d.medias || d.media || [];
      const videoUrl = hd || sd || direct || (Array.isArray(medias) && medias[0]?.url) || null;
      if (!videoUrl) continue;
      return { videoUrl, hdUrl: hd, sdUrl: sd, title: d.title || d.data?.title || 'Facebook Video' };
    } catch (e) {
      console.log(`[FB/xcasper/${ep}] ${e.message}`);
    }
  }
  return null;
}

async function fetchFbInfo(url) {
  return (await fetchXWolf(url)) || (await fetchXCasper(url));
}

async function facebookCommand(sock, chatId, message) {
  try {
    if (processedMessages.has(message.key.id)) return;
    processedMessages.add(message.key.id);
    setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

    const text = message.message?.conversation
               || message.message?.extendedTextMessage?.text;

    if (!text) {
      return sock.sendMessage(chatId, { text: 'Please provide a Facebook video URL.' });
    }

    const url = text.split(' ').slice(1).join(' ').trim();

    if (!url) {
      return sock.sendMessage(chatId, { text: 'Please provide a Facebook video URL.' });
    }

    if (!isValidFbUrl(url)) {
      return sock.sendMessage(chatId, { text: 'That is not a valid Facebook link.' });
    }

    await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

    const info = await fetchFbInfo(url);

    if (!info) {
      return sock.sendMessage(chatId, {
        text: '❌ Failed to fetch Facebook video. Make sure the video is *public*.'
      }, { quoted: message });
    }

    const caption =
      `> 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗠𝗘𝗚𝗔-𝗕𝗢𝗧\n\n` +
      `*Title:* ${info.title}`;

    // Try buffer first, fall back to URL stream
    const urlsToTry = [...new Set([info.hdUrl, info.sdUrl, info.videoUrl].filter(Boolean))];
    let videoBuf = null;

    for (const dlUrl of urlsToTry) {
      videoBuf = await proxyFetch(dlUrl);
      if (videoBuf) break;
    }

    if (videoBuf) {
      await sock.sendMessage(chatId, {
        video: videoBuf,
        mimetype: 'video/mp4',
        caption
      }, { quoted: message });
    } else {
      // Fallback: stream directly from URL
      await sock.sendMessage(chatId, {
        video: { url: info.sdUrl || info.videoUrl },
        mimetype: 'video/mp4',
        caption
      }, { quoted: message });
    }

  } catch (err) {
    console.error('Facebook command error:', err.message);
    await sock.sendMessage(chatId, {
      text: `❌ Failed to download Facebook video.\n_${err.message}_`
    }, { quoted: message });
  }
}

module.exports = facebookCommand;
