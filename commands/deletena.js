const isAdmin = require('../lib/isAdmin');
const store = require('../lib/lightweight_store');

async function deleteNonAdminCommand(sock, chatId, message, senderId) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: 'I need to be an admin to delete messages.' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: 'Only admins can use the .delna command.' }, { quoted: message });
            return;
        }

        // Parse count argument
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        let countArg = 1;

        if (parts.length > 1) {
            const maybeNum = parseInt(parts[1], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) {
                countArg = Math.min(maybeNum, 50);
            }
        }

        const chatMessages = Array.isArray(store.messages[chatId]) ? store.messages[chatId] : [];
        if (chatMessages.length === 0) {
            await sock.sendMessage(chatId, { text: 'No messages found in this group.' }, { quoted: message });
            return;
        }

        // Gather last messages skipping admins
        const toDelete = [];
        const seenIds = new Set();

        // Get all current admins
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);

        // Traverse messages from newest to oldest
        for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < countArg; i--) {
            const m = chatMessages[i];
            const participant = m.key.participant || m.key.remoteJid;

            if (!seenIds.has(m.key.id)) {
                // Skip protocol messages, bot messages, command message itself
                if (!m.message?.protocolMessage && m.key.id !== message.key.id) {
                    // Skip admins
                    if (!admins.includes(participant)) {
                        toDelete.push(m);
                        seenIds.add(m.key.id);
                    }
                }
            }
        }

        if (toDelete.length === 0) {
            await sock.sendMessage(chatId, { text: 'No non-admin messages found to delete in the range.' }, { quoted: message });
            return;
        }

        // Delete sequentially with small delay
        for (const m of toDelete) {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: m.key.id,
                        participant: m.key.participant || m.key.remoteJid
                    }
                });
                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                // continue on error
            }
        }

        await sock.sendMessage(chatId, { text: `✅ Deleted ${toDelete.length} non-admin messages.` }, { quoted: message });

    } catch (err) {
        console.error('DELNA ERROR:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to delete non-admin messages.' }, { quoted: message });
    }
}

module.exports = deleteNonAdminCommand;