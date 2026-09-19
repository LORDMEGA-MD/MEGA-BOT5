const settings = require('../settings');
const { addSudo, removeSudo, getSudoList, bareNumber } = require('../lib/index');
const isOwnerOrSudo = require('../lib/isOwner');

/**
 * Extract target JID/number from any source — reply, @mention, or typed number.
 * Returns full JID if available (preserves @lid or @s.whatsapp.net), else bare digits.
 */
function extractTargetNumber(message) {
    // ── Source 1: quoted message sender (most reliable) ───────────────────────
    const quotedParticipant =
        message.message?.extendedTextMessage?.contextInfo?.participant ||
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.key?.participant;

    if (quotedParticipant) {
        if (quotedParticipant.includes('@')) return quotedParticipant; // full JID as-is
        const num = bareNumber(quotedParticipant);
        if (num && num.length >= 7) return num;
    }

    // ── Source 2: @mentions ───────────────────────────────────────────────────
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const jid of mentioned) {
        if (jid.includes('@')) return jid; // full JID as-is
        const num = bareNumber(jid);
        if (num && num.length >= 7) return num;
    }

    // ── Source 3: number typed in command ─────────────────────────────────────
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const matches = text.match(/\b(\d{7,15})\b/g);
    if (matches) return matches[matches.length - 1];

    return null;
}

async function sudoCommand(sock, chatId, message) {
    const senderJid = message.key.participant || message.key.remoteJid;
    const isOwner   = message.key.fromMe || await isOwnerOrSudo(senderJid, sock, chatId);

    const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const args    = rawText.trim().split(' ').slice(1);
    const sub     = (args[0] || '').toLowerCase();

    if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
        await sock.sendMessage(chatId, {
            text:
                '*Usage:*\n' +
                '• .sudo add @user\n' +
                '• .sudo add 256700000000\n' +
                '• .sudo del @user\n' +
                '• .sudo list\n\n' +
                '_Reply to a message with .sudo add to add that person_'
        }, { quoted: message });
        return;
    }

    // ── List — no owner check needed ──────────────────────────────────────────
    if (sub === 'list') {
        const list = await getSudoList();
        if (list.length === 0) {
            await sock.sendMessage(chatId, { text: 'No sudo users set.' }, { quoted: message });
            return;
        }
        const text = list.map((entry, i) => {
            const display = entry.endsWith('@lid')
                ? `LID: ${bareNumber(entry)}`
                : `+${bareNumber(entry) || entry}`;
            return `${i + 1}. ${display}`;
        }).join('\n');
        await sock.sendMessage(chatId, { text: `*Sudo Users:*\n${text}` }, { quoted: message });
        return;
    }

    // ── Add / remove — owner only ─────────────────────────────────────────────
    if (!isOwner) {
        await sock.sendMessage(chatId, {
            text: '❌ Only owner can add/remove sudo users.'
        }, { quoted: message });
        return;
    }

    const target = extractTargetNumber(message);

    if (!target) {
        await sock.sendMessage(chatId, {
            text:
                '❌ Could not find user.\n\n' +
                '*Try:*\n' +
                '• Reply to their message with .sudo add\n' +
                '• .sudo add 256700000000\n' +
                '• @mention them'
        }, { quoted: message });
        return;
    }

    if (sub === 'add') {
        // ── Block master owner ────────────────────────────────────────────────
        const masterNum = bareNumber(global.MASTER_OWNER_JID || '');
        if (masterNum && bareNumber(target) === masterNum) {
            await sock.sendMessage(chatId, {
                text: `ℹ️ That user is the master owner and already has full access on all bots.`
            }, { quoted: message });
            return;
        }

        // ── Block bot's own owner ─────────────────────────────────────────────
        const ownerNum = bareNumber(settings.ownerNumber || '');
        if (ownerNum && bareNumber(target) === ownerNum) {
            await sock.sendMessage(chatId, {
                text: `ℹ️ That user is already the bot owner.`
            }, { quoted: message });
            return;
        }

        const ok = await addSudo(target);
        const displayTarget = target.endsWith('@lid')
            ? `LID: ${bareNumber(target)}`
            : `+${bareNumber(target)}`;
        await sock.sendMessage(chatId, {
            text: ok ? `✅ Added sudo: ${displayTarget}` : '❌ Failed to add sudo'
        }, { quoted: message });
        return;
    }

    if (sub === 'del' || sub === 'remove') {
        const ownerNum = bareNumber(settings.ownerNumber || '');
        if (ownerNum && bareNumber(target) === ownerNum) {
            await sock.sendMessage(chatId, { text: '❌ Owner cannot be removed.' }, { quoted: message });
            return;
        }
        const ok = await removeSudo(target);
        const displayTarget = target.endsWith('@lid')
            ? `LID: ${bareNumber(target)}`
            : `+${bareNumber(target)}`;
        await sock.sendMessage(chatId, {
            text: ok ? `✅ Removed sudo: ${displayTarget}` : '❌ Failed to remove sudo'
        }, { quoted: message });
        return;
    }
}

module.exports = sudoCommand;
