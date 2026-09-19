const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');
const { generateWelcomeImage } = require('../lib/welcomeImageGen');

async function welcomeCommand(sock, chatId, message, match) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' });
        return;
    }
    const text = message.message?.conversation ||
                 message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');
    await handleWelcome(sock, chatId, message, matchText);
}

async function handleJoinEvent(sock, id, participants) {
    const isWelcomeEnabled = await isWelcomeOn(id);
    if (!isWelcomeEnabled) return;

    const customMessage = await getWelcome(id);
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'No description available';
    const memberCount = groupMetadata.participants.length;

    // Fetch group icon once for all participants
    let groupIconUrl = null;
    try {
        groupIconUrl = await sock.profilePictureUrl(id, 'image');
    } catch {
        // no group icon — will use fallback inside generateWelcomeImage
    }

    for (const participant of participants) {
        try {
            const participantString = typeof participant === 'string'
                ? participant
                : (participant.id || participant.toString());
            const user = participantString.split('@')[0];

            // Resolve display name
            let displayName = user;
            try {
                if (typeof sock.getName === 'function') {
                    const resolved = await sock.getName(participantString);
                    if (resolved) displayName = resolved;
                }
            } catch {
                // keep bare number fallback
            }

            // Build caption
            let caption;
            if (customMessage) {
                caption = customMessage
                    .replace(/{user}/g, `@${displayName}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc);
            } else {
                const now = new Date();
                const timeString = now.toLocaleString('en-US', {
                    month: '2-digit', day: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: true
                });
                caption = `╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @${displayName} 👋\n┃Member count: #${memberCount}\n┃𝚃𝙸𝙼𝙴: ${timeString}⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@${displayName}* Welcome to *${groupName}*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\n${groupDesc}\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ Mega Bot*`;
            }

            // Fetch member profile picture
            let profilePicUrl = null;
            try {
                profilePicUrl = await sock.profilePictureUrl(participantString, 'image');
            } catch {
                // will use default avatar inside generateWelcomeImage
            }

            // Generate welcome image with blurred group icon background
            try {
                const imageBuffer = await generateWelcomeImage(
                    displayName,
                    groupName,
                    memberCount,
                    profilePicUrl,
                    groupIconUrl
                );

                await sock.sendMessage(id, {
                    image: imageBuffer,
                    caption,
                    mentions: [participantString],
                    ...channelInfo
                });
                continue;
            } catch (imgError) {
                console.log('[Welcome] Image generation failed, falling back to text:', imgError.message);
            }

            // Text fallback
            await sock.sendMessage(id, {
                text: caption,
                mentions: [participantString],
                ...channelInfo
            });

        } catch (error) {
            console.error('[Welcome] Error sending welcome message:', error);
            const participantString = typeof participant === 'string'
                ? participant
                : (participant.id || participant.toString());
            const user = participantString.split('@')[0];
            const fallback = customMessage
                ? customMessage
                    .replace(/{user}/g, `@${user}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc)
                : `Welcome @${user} to ${groupName}! 🎉`;
            await sock.sendMessage(id, {
                text: fallback,
                mentions: [participantString],
                ...channelInfo
            });
        }
    }
}

module.exports = { welcomeCommand, handleJoinEvent };