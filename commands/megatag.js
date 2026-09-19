const { jidNormalizedUser, downloadMediaMessage } = require('@whiskeysockets/baileys');

async function megaTagCommand(sock, chatId, senderId, userMessage, message) {
    try {
        if (chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: "> MF please use this command in bot DM only 🙏."
            }, { quoted: message });
        }

        const isVO = userMessage.startsWith('.megatagvo');
        let content = userMessage.replace(isVO ? '.megatagvo' : '.megatag', '').trim();

        let groupId = null;

        const jidMatch = content.match(/\d+@g\.us/);
        if (jidMatch) {
            groupId = jidMatch[0];
            content = content.replace(groupId, '').trim();
        }

        const inviteMatch = content.match(/chat\.whatsapp\.com\/([\w\d]+)/);
        if (inviteMatch) {
            try {
                groupId = await sock.groupAcceptInvite(inviteMatch[1]);
                content = content.replace(inviteMatch[0], '').trim();
            } catch {
                return sock.sendMessage(chatId, {
                    text: "> Invalid or expired group link."
                }, { quoted: message });
            }
        }

        if (!groupId) {
            return sock.sendMessage(chatId, {
                text: "> Provide a group link or group JID."
            }, { quoted: message });
        }

        const numberRegex = /\+?\d[\d\s]{7,18}\d/g;
        const foundNumbers = content.match(numberRegex) || [];
        let finalText = content;
        let numbers = [];

        for (let rawNum of foundNumbers) {
            const cleanNum = rawNum.replace(/\D/g, '');
            if (cleanNum.length < 9 || cleanNum.length > 15) continue;
            numbers.push(cleanNum);
            finalText = finalText.replace(rawNum, `@${cleanNum}`);
        }

        numbers = [...new Set(numbers)];
        const targetJids = numbers.map(num => jidNormalizedUser(num + "@s.whatsapp.net"));

        const groupMeta = await sock.groupMetadata(groupId);
        const participants = groupMeta.participants.map(p => p.id);
        const allMentions = [...new Set([...participants, ...targetJids])];

        const contextInfo = message?.message?.extendedTextMessage?.contextInfo;
        const quoted = contextInfo?.quotedMessage;

        if (quoted) {
            const typeMap = {
                stickerMessage:  { sendType: 'sticker',  mimeFallback: 'image/webp' },
                imageMessage:    { sendType: 'image',    mimeFallback: 'image/jpeg' },
                videoMessage:    { sendType: 'video',    mimeFallback: 'video/mp4' },
                audioMessage:    { sendType: 'audio',    mimeFallback: 'audio/ogg; codecs=opus' },
                documentMessage: { sendType: 'document', mimeFallback: 'application/octet-stream' },
            };

            const msgType = Object.keys(quoted).find(k => typeMap[k]);

            if (!msgType) {
                return sock.sendMessage(chatId, {
                    text: "> Unsupported media type in replied message."
                }, { quoted: message });
            }

            const { sendType } = typeMap[msgType];

            // Reject VO on unsupported types
            if (isVO && !['image', 'video', 'audio'].includes(sendType)) {
                return sock.sendMessage(chatId, {
                    text: "> ❌ View-once only supports image, video, or audio."
                }, { quoted: message });
            }

            const quotedMsg = {
                key: {
                    remoteJid: contextInfo.participant || chatId,
                    id:        contextInfo.stanzaId,
                    fromMe:    false,
                },
                message: quoted,
            };

            let mediaBuffer;
            try {
                mediaBuffer = await downloadMediaMessage(
                    quotedMsg,
                    'buffer',
                    {},
                    { logger: sock.logger, reuploadRequest: sock.updateMediaMessage }
                );
            } catch (dlErr) {
                console.log("MEDIA DOWNLOAD ERROR:", dlErr);
                return sock.sendMessage(chatId, {
                    text: "> Failed to download the media. It may have expired."
                }, { quoted: message });
            }

            const mediaPayload = { [sendType]: mediaBuffer, mentions: allMentions };

            // View-once flag
            if (isVO) {
                mediaPayload.viewOnce = true;
            }

            const mediaContent = quoted[msgType];
            if (sendType === 'document') {
                mediaPayload.mimetype = mediaContent.mimetype || 'application/octet-stream';
                mediaPayload.fileName = mediaContent.fileName || 'file';
            }
            if (sendType === 'audio') {
                mediaPayload.mimetype = mediaContent.mimetype || 'audio/ogg; codecs=opus';
                mediaPayload.ptt      = mediaContent.ptt || false;
            }
            // Captions only for non-VO image/video
            if (!isVO && ['image', 'video'].includes(sendType) && finalText) {
                mediaPayload.caption  = finalText;
                mediaPayload.mentions = allMentions;
                finalText = null;
            }

            await sock.sendMessage(groupId, mediaPayload);

            if (finalText) {
                await sock.sendMessage(groupId, {
                    text: finalText,
                    mentions: allMentions
                });
            }

        } else {
            if (isVO) {
                return sock.sendMessage(chatId, {
                    text: "> ❌ Reply to an image, video, or audio to use megatagvo."
                }, { quoted: message });
            }

            await sock.sendMessage(groupId, {
                text: finalText || '\u200B',
                mentions: allMentions
            });
        }

        await sock.sendMessage(chatId, {
            text: `> ✅ Megatag${isVO ? ' VO' : ''} sent to ${groupMeta.subject} (${participants.length} members).`
        });

    } catch (err) {
        console.log("MEGATAG ERROR:", err);
        await sock.sendMessage(chatId, {
            text: `> ❌ Failed to send megatag.\n${err.message}`
        }, { quoted: message });
    }
}

module.exports = megaTagCommand;