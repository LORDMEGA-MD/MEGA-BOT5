// commands/auto/admin/out.js
//
// Trigger: .out (filename-based)
// Tier: admin/ folder — the loader already enforced before this file even
// runs:
//   - message is from a group (not DM)
//   - the bot itself is a group admin
//   - the sender is a group admin (or is you, the bot owner, via fromMe)
// So this file doesn't need to re-check any of that — just do the work.
//
// Usage: reply to someone's message with ".out", OR @mention them:
//   .out @2547xxxxxxxx

module.exports = async function (sock, chatId, message, args) {
    // Try @mention first
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    // Fall back to the person whose message was replied to
    const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;

    const targetJid = mentioned[0] || quotedParticipant;

    if (!targetJid) {
        return sock.sendMessage(chatId, {
            text: '❌ Mention someone or reply to their message.\nUsage: .out @user'
        }, { quoted: message });
    }

    try {
        await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove');
        await sock.sendMessage(chatId, {
            text: `✅ Removed @${targetJid.split('@')[0]} from the group.`,
            mentions: [targetJid]
        }, { quoted: message });
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to remove user: ${err.message}`
        }, { quoted: message });
    }
};
