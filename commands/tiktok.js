const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const { createWriteStream, existsSync, unlinkSync, readFileSync } = require('fs');

const execAsync = promisify(exec);

const processedMessages = new Set();

const XWOLF_API_KEY = process.env.XWOLF_API_KEY || 'wxa_u_xwk7sch6xj';
const XWOLF_TT_API = 'https://apis.xwolf.space/api/download/tiktok';

async function tiktokCommand(sock, chatId, message) {
    try {
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;

        if (!text) {
            return await sock.sendMessage(chatId, { text: "Please provide a TikTok link for the video." });
        }

        const url = text.split(' ').slice(1).join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, { text: "Please provide a TikTok link for the video." });
        }

        const isValidUrl = /https?:\/\/(?:(?:www|vm|vt|m)\.)?tiktok\.com\/[^\s]+/i.test(url);

        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { text: "That is not a valid TikTok link." });
        }

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        const result = await fetchTikTokWithFallbacks(url);

        if (!result.success) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await sock.sendMessage(chatId, { text: "❌ Failed to fetch TikTok data. Please try again." }, { quoted: message });
        }

        const caption =
            `> 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗠𝗘𝗚𝗔-𝗕𝗢𝗧\n\n` +
            `*User:* ${result.author || 'Unknown'}\n` +
            `*Likes:* ${result.likes || '0'}❤`;

        if (result.videoPath) {
            // yt-dlp path: local file on disk
            await sock.sendMessage(chatId, {
                video: readFileSync(result.videoPath),
                mimetype: 'video/mp4',
                caption
            }, { quoted: message });

            try { if (existsSync(result.videoPath)) unlinkSync(result.videoPath); } catch {}
        } else {
            // URL-based sources: try buffer first, fall back to URL streaming
            try {
                const videoResponse = await axios.get(result.videoUrl, {
                    responseType: 'arraybuffer',
                    timeout: 60000,
                    maxContentLength: 100 * 1024 * 1024,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://www.tiktok.com/'
                    }
                });

                const videoBuffer = Buffer.from(videoResponse.data);
                if (videoBuffer.length === 0) throw new Error("Empty buffer");

                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption
                }, { quoted: message });

            } catch {
                await sock.sendMessage(chatId, {
                    video: { url: result.videoUrl },
                    mimetype: 'video/mp4',
                    caption
                }, { quoted: message });
            }
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('TikTok command error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ Failed to download TikTok video.\n_${err.message}_`
        }, { quoted: message });
    }
}

async function fetchTikTokWithFallbacks(url) {
    // 1. xwolf API
    try {
        const { data } = await axios.get(XWOLF_TT_API, {
            params: { url, key: XWOLF_API_KEY },
            timeout: 20000
        });
        if (data?.success) {
            const videoUrl = data.videoNoWatermarkProxyUrl || data.videoUrlNoWatermark || data.videoProxyUrl || data.videoUrl;
            if (videoUrl) {
                return {
                    success: true,
                    videoUrl,
                    author: data.author?.nickname || data.author,
                    likes: data.stats?.likes || data.likes
                };
            }
        }
    } catch {}

    // 2. discardapi
    try {
        const { data } = await axios.get(
            `https://discardapi.onrender.com/api/dl/tiktok?apikey=guru&url=${encodeURIComponent(url)}`,
            {
                timeout: 45000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            }
        );
        if (data?.status && data?.result) {
            const res = data.result;
            const hd = res.data?.find(v => v.type === 'nowatermark_hd');
            const noWm = res.data?.find(v => v.type === 'nowatermark');
            const videoUrl = hd?.url || noWm?.url;
            if (videoUrl) {
                return {
                    success: true,
                    videoUrl,
                    author: res.author?.nickname,
                    likes: res.stats?.likes
                };
            }
        }
    } catch {}

    // 3. tikwm.com
    try {
        const { data } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, { timeout: 30000 });
        if (data?.data?.play) {
            return {
                success: true,
                videoUrl: data.data.play,
                author: data.data.author?.nickname,
                likes: data.data.digg_count
            };
        }
    } catch {}

    // 4. yt-dlp (last resort — downloads to disk)
    return await downloadWithYtDlp(url);
}

async function downloadWithYtDlp(url) {
    try {
        await execAsync('yt-dlp --version');
    } catch {
        return { success: false };
    }

    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2);
    const videoPath = `/tmp/wolfbot_tiktok_${timestamp}_${rand}.mp4`;

    try {
        await execAsync(`yt-dlp -f "best[ext=mp4]" -o "${videoPath}" "${url}"`, { timeout: 60000 });
        return { success: true, videoPath };
    } catch {
        return { success: false };
    }
}

module.exports = tiktokCommand;