const axios = require('axios');

const GIFTED_DL = 'https://api.giftedtech.co.ke/api/download/xvideosdl';
const GIFTED_SRCH = 'https://api.giftedtech.co.ke/api/search/xvideossearch';
const xvideos_REGEX = /xvideos\.com\/video/i;

function isUrl(input) {
    return /^https?:\/\//i.test(input) || xvideos_REGEX.test(input);
}

async function searchxvideos(query) {
    const res = await axios.get(GIFTED_SRCH, {
        params: { apikey: 'gifted', query },
        timeout: 20000
    });
    if (!res.data?.success || !res.data?.results?.length) return null;
    return res.data.results[0];
}

async function downloadVideoBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    const buf = Buffer.from(res.data);
    if (buf.length < 5000) throw new Error('Received invalid video data');
    return buf;
}

module.exports = {
    name: 'xvideos',
    aliases: ['xvdl', 'xvid'],
    desc: 'Download or search xvideos by URL or name',
    category: 'Downloaders',
    usage: '.xvideos <url or search name>',

    // Loader calls: fn(sock, chatId, message, args, userMessage)
    async execute(sock, chatId, message, args, userMessage) {
        const jid = chatId;
        const m = message;
        const PREFIX = (userMessage && userMessage[0]) || '.';
        const input = args.join(' ').trim();

        if (!input) {
            return sock.sendMessage(jid, {
                text:
                    `╭─⌈  *xvideos DOWNLOADER* ⌋\n` +
                    `│\n` +
                    `├⊷ *By URL:*\n` +
                    `│  └⊷ ${PREFIX}xvideos https://www.xvideos.com/video.abc/title\n` +
                    `├⊷ *By Name:*\n` +
                    `│  └⊷ ${PREFIX}xvideos sexy massage\n` +
                    `├⊷ *Aliases:* xvdl, xvid\n` +
                    `│\n` +
                    `╰⊷ Powered by 𝗠𝗘𝗚𝗔-𝗕𝗢𝗧`
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            react: { text: '⏳', key: m.key }
        });

        try {
            let videoUrl = input;
            let searchThumb = null;

            if (!isUrl(input)) {
               

                const hit = await searchxvideos(input);

                if (!hit?.url) {
                    await sock.sendMessage(jid, {
                        react: { text: '❌', key: m.key }
                    });

                    return sock.sendMessage(jid, {
                        text: `❌ *No results found for:* _${input}_\n\nTry a different search term.`
                    }, { quoted: m });
                }

                videoUrl = hit.url;
                searchThumb = hit.thumb || null;
            }

            const res = await axios.get(GIFTED_DL, {
                params: {
                    apikey: 'gifted',
                    url: videoUrl
                },
                timeout: 30000
            });

            if (!res.data?.success || !res.data?.result?.download_url) {
                await sock.sendMessage(jid, {
                    react: { text: '❌', key: m.key }
                });

                return sock.sendMessage(jid, {
                    text: `❌ *Failed to fetch video.*\n\nThe link may be broken or the video is unavailable.`
                }, { quoted: m });
            }

            const {
                title,
                views,
                likes,
                thumbnail,
                download_url
            } = res.data.result;

            const thumbUrl = thumbnail || searchThumb;

            const caption =
                `> 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗠𝗘𝗚𝗔-𝗕𝗢𝗧\n\n` +
                `*Title:* ${title || 'Unknown'}\n` +
                `*Views:* ${views || 'N/A'}\n` +
                `*Likes:* ${likes || 'N/A'}❤`;

            if (thumbUrl) {
                try {
                    const thumbRes = await axios.get(thumbUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000
                    });

                    await sock.sendMessage(jid, {
                        image: Buffer.from(thumbRes.data),
                        caption
                    }, { quoted: m });

                } catch {
                    await sock.sendMessage(jid, {
                        text: caption
                    }, { quoted: m });
                }
            } else {
                await sock.sendMessage(jid, {
                    text: caption
                }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                react: { text: '📥', key: m.key }
            });

            const videoBuffer = await downloadVideoBuffer(download_url);
            const safeTitle = (title || 'xvideos')
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .trim()
                .substring(0, 50);

            await sock.sendMessage(jid, {
                video: videoBuffer,
                caption:
                    `> 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗠𝗘𝗚𝗔-𝗕𝗢𝗧\n\n` +
                    `*User:* Lunawhoo\n` +
                    `*Likes:* ${likes || 'N/A'}❤`,
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`
            }, { quoted: m });

            await sock.sendMessage(jid, {
                react: { text: '✅', key: m.key }
            });

        } catch (err) {
            await sock.sendMessage(jid, {
                react: { text: '❌', key: m.key }
            });

            await sock.sendMessage(jid, {
                text: `❌ *Download failed.*\n\n_${err.message || 'Unknown error'}_`
            }, { quoted: m });
        }
    }
};
