'use strict';

const isAdmin = require('../lib/isAdmin');

async function resetlinkCommand(sock, chatId, message) {
    try {
        // Only works in groups
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: '❌ This command can only be used in groups!'
            });
        }

        // Check admin status
        try {
            const adminStatus = await isAdmin(
                sock,
                chatId,
                message.key.participant || message.key.remoteJid
            );

            if (!adminStatus.isBotAdmin) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Error: Please make the bot an admin first to use this command.'
                });
            }

            if (!adminStatus.isSenderAdmin) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Error: Only group admins can use this command.'
                });
            }
        } catch (err) {
            console.error('Error checking admin status:', err);

            return await sock.sendMessage(chatId, {
                text: '❌ Error: Unable to verify admin permissions.'
            });
        }

        // Reset invite link
        await sock.groupRevokeInvite(chatId);

        // Fetch the new invite code
        const inviteCode = await sock.groupInviteCode(chatId);

        await sock.sendMessage(chatId, {
            text:
                `✅ *Group invite link has been reset successfully!*\n\n` +
                `🔗 New Link:\nhttps://chat.whatsapp.com/${inviteCode}`
        });

    } catch (error) {
        console.error('Error in resetlink command:', error);

        await sock.sendMessage(chatId, {
            text: '❌ Failed to reset the group invite link.'
        });
    }
}

module.exports = resetlinkCommand;