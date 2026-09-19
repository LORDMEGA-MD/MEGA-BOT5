'use strict';

const axios = require('axios');

const GIFTED_API = 'https://api.giftedtech.co.ke/api/download/apkdl';

async function downloadBuffer(url) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 90000,
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        validateStatus: (s) => s >= 200 && s < 400
    });
    return Buffer.from(response.data);
}

// ─── Auto-loader contract ─────────────────────────────────────────────────
// File name = trigger word (apk.js → .apk). Aliases below register extra
// triggers pointing at the same handler.
// Signature expected by tryAutoCommand: fn(sock, chatId, message, args, userMessage)
module.exports = {
    aliases: ['app', 'apkdownload', 'apkdl'],
    description: 'Download APK files from the Play Store',
    category: 'Downloader',

    execute: async (sock, chatId, message, args, userMessage) => {
        const jid = chatId;
        const prefix = (userMessage && userMessage[0]) || '.';

        if (!args || !args[0]) {
            return sock.sendMessage(jid, {
                text: `> ┏━〔𝐀𝐩𝐤 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐫〕━━┓\n> ┃ ⚙️ Usage    : ${prefix}apk <name>\n> ┃ 🔤 Example  : ${prefix}apk fb\n> ┃ 🔤 Example  : ${prefix}apk Tele\n> ┃ 🔤 Example  : ${prefix}apk Spotify\n> ┗━━━━━━━━━━━━┛`
            }, { quoted: message });
        }

        const appName = args.join(' ').trim();
        await sock.sendMessage(jid, { react: { text: '⏳', key: message.key } });

        try {
            const apiRes = await axios.get(GIFTED_API, {
                params: { apikey: 'gifted', appName },
                timeout: 20000
            });

            if (!apiRes.data?.success || !apiRes.data?.result) {
                throw new Error('App not found in Play Store');
            }

            const { appname, developer, mimetype, download_url, appicon } = apiRes.data.result;

            await sock.sendMessage(jid, { react: { text: '📥', key: message.key } });

            const apkBuffer = await downloadBuffer(download_url);
            const fileSizeMB = (apkBuffer.length / (1024 * 1024)).toFixed(1);

            if (apkBuffer.length > 100 * 1024 * 1024) {
                await sock.sendMessage(jid, { react: { text: '❌', key: message.key } });
                return sock.sendMessage(jid, {
                    text: `❌ *APK too large (${fileSizeMB}MB)*\n\n📥 Download directly:\n${download_url}`
                }, { quoted: message });
            }

            let iconBuffer = null;
            if (appicon) {
                try {
                    const iconRes = await axios.get(appicon, { responseType: 'arraybuffer', timeout: 10000 });
                    iconBuffer = Buffer.from(iconRes.data);
                } catch {}
            }

            await sock.sendMessage(jid, {
                document: apkBuffer,
                fileName: `${appname.replace(/[^a-zA-Z0-9]/g, '_')}.apk`,
                mimetype: mimetype || 'application/vnd.android.package-archive',
                caption: `> ┏━━〔 𝐀𝐩𝐤 〕━━━┓\n> 📱 *${appname}*\n> 👤 *Developer:* ${developer || 'Unknown'}\n> 📦 *Size:* ${fileSizeMB}MB\n> ┗━━━━━━━━━━┛`,
                thumbnail: iconBuffer
            }, { quoted: message });

            await sock.sendMessage(jid, { react: { text: '✅', key: message.key } });

        } catch (error) {
            console.error('❌ [APK] Error:', error.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(jid, {
                text: `> Try a different app name or check spelling.`
            }, { quoted: message });
        }
    }
};
