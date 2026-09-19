const { handleGoodbye } = require('../lib/welcome');
const { isGoodByeOn, getGoodbye } = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');
const { generateGoodbyeImage } = require('../lib/goodbyeImageGen');

async function goodbyeCommand(sock, chatId, message, match) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: 'This command can only be used in groups.'
        });
        return;
    }

    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        '';

    const matchText = text.split(' ').slice(1).join(' ');

    await handleGoodbye(sock, chatId, message, matchText);
}

async function handleLeaveEvent(sock, id, participants) {
    const isGoodbyeEnabled = await isGoodByeOn(id);
    if (!isGoodbyeEnabled) return;

    const customMessage = await getGoodbye(id);

    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'No description available';
    const memberCount = groupMetadata.participants.length;

    let groupIconUrl = null;
    try {
        groupIconUrl = await sock.profilePictureUrl(id, 'image');
    } catch {
        // fallback handled in image generator
    }

    for (const participant of participants) {
        try {
            const participantString =
                typeof participant === 'string'
                    ? participant
                    : (participant.id || participant.toString());

            const user = participantString.split('@')[0];

            let displayName = user;

            try {
                if (typeof sock.getName === 'function') {
                    const resolved = await sock.getName(participantString);
                    if (resolved) displayName = resolved;
                }
            } catch {
                // keep number fallback
            }

            let caption;

            if (customMessage) {
                caption = customMessage
                    .replace(/{user}/g, `@${displayName}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc);
            } else {
                const now = new Date();

                const timeString = now.toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });

                caption =
`╭╼━≪•𝙶𝙾𝙾𝙳𝙱𝚈𝙴•≫━╾╮
┃𝚄𝚂𝙴𝚁: @${displayName}
┃Members Left: #${memberCount}
┃𝚃𝙸𝙼𝙴: ${timeString}
╰━━━━━━━━━━━━━━━╯

*@${displayName}* has left *${groupName}* 👋

We wish you success wherever your journey takes you.

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ Mega Bot*`;
            }

            let profilePicUrl = null;

            try {
                profilePicUrl = await sock.profilePictureUrl(
                    participantString,
                    'image'
                );
            } catch {
                // fallback avatar handled in generator
            }

            try {
                const imageBuffer = await generateGoodbyeImage(
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
                console.log(
                    '[Goodbye] Image generation failed, falling back to text:',
                    imgError.message
                );
            }

            await sock.sendMessage(id, {
                text: caption,
                mentions: [participantString],
                ...channelInfo
            });

        } catch (error) {
            console.error(
                '[Goodbye] Error sending goodbye message:',
                error
            );

            const participantString =
                typeof participant === 'string'
                    ? participant
                    : (participant.id || participant.toString());

            const user = participantString.split('@')[0];

            const fallback = customMessage
                ? customMessage
                    .replace(/{user}/g, `@${user}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc)
                : `Goodbye @${user}! 👋`;

            await sock.sendMessage(id, {
                text: fallback,
                mentions: [participantString],
                ...channelInfo
            });
        }
    }
}

module.exports = {
    goodbyeCommand,
    handleLeaveEvent
};