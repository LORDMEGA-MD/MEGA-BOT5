const isAdmin = require('../lib/isAdmin');

/**
 * Normalize raw number → JID
 */
function toJid(raw) {
    const clean = raw.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 7) return null;
    return clean + '@s.whatsapp.net';
}

/**
 * Extract the bare numeric/id portion from any JID variant
 * (@s.whatsapp.net, @lid, @g.us, with or without :device suffix).
 * Used so bot-identity checks work no matter which JID format
 * WhatsApp/Baileys hands us.
 */
function bareId(jid = '') {
    return jid.split('@')[0].split(':')[0];
}

/**
 * Extract all kick targets from the command text + message object.
 */
function extractTargets(userMessage, message) {
    const targets = new Set();

    // ── Source 1: numbers typed as plain text ───────────────
    const rawArgs = userMessage.replace(/^\.kick\s*/i, '').trim();

    if (rawArgs) {
        const parts = rawArgs.split(/[\s,;]+/).filter(Boolean);

        for (const part of parts) {
            if (part.startsWith('@')) continue; // handled by mentions below

            const jid = toJid(part);
            if (jid) targets.add(jid);
        }
    }

    // ── Source 2: quoted (replied-to) user ───────────────────
    // contextInfo.participant is the ONLY valid source for "who did
    // this message reply to". message.key.participant is the SENDER
    // of the current message, not a quoted user — using it here was
    // the original bug: when the bot itself sends the command
    // (fromMe / self-bot), message.key.participant resolves to the
    // bot's own JID, silently adding the bot to its own kick list.
    const contextInfo =
        message.message?.extendedTextMessage?.contextInfo ||
        message.message?.imageMessage?.contextInfo ||
        message.message?.videoMessage?.contextInfo;

    const quotedParticipant = contextInfo?.participant || null;

    if (quotedParticipant) {
        const jid = quotedParticipant.includes('@')
            ? quotedParticipant
            : toJid(quotedParticipant);
        if (jid) targets.add(jid);
    }

    // ── Source 3: @mentions ───────────────────────────────────
    const mentionedJids = contextInfo?.mentionedJid || [];

    for (const jid of mentionedJids) {
        if (jid && !jid.endsWith('@g.us')) {
            targets.add(jid);
        }
    }

    return [...targets];
}

/**
 * All identifiers the bot might be known as, across JID formats.
 * Newer WhatsApp/Baileys versions can expose group participants as
 * @lid instead of @s.whatsapp.net, which won't numerically match
 * sock.user.id — that mismatch is what let the bot slip through the
 * old isTargetingBot check and get removed along with the real target.
 */
function getBotIds(sock) {
    const ids = new Set();
    if (sock.user?.id) ids.add(bareId(sock.user.id));
    if (sock.user?.lid) ids.add(bareId(sock.user.lid));
    return ids;
}

/**
 * Check whether any target resolves to the bot, in any JID format.
 */
function isTargetingBot(usersToKick, sock) {
    const botIds = getBotIds(sock);
    return usersToKick.some(jid => botIds.has(bareId(jid)));
}

/**
 * Defense in depth: hard-remove any bot identifiers from a target list
 * right before we ever touch the actual remove API, regardless of
 * whether isTargetingBot already caught it.
 */
function stripBot(usersToKick, sock) {
    const botIds = getBotIds(sock);
    return usersToKick.filter(jid => !botIds.has(bareId(jid)));
}

/**
 * MAIN COMMAND
 *
 * extraJids: optional array of already-resolved target JIDs, passed in
 * by callers that resolve targets themselves outside the raw message
 * text/mentions — e.g. the chatbot's AI intent layer, which figures out
 * the target from natural language and can't rely on extractTargets()
 * parsing a synthetic command string (mentionedJid metadata doesn't
 * exist on the original message object in that flow).
 */
async function kickCommand(sock, chatId, senderId, userMessage, message, extraJids = []) {

    const isOwner = message.key.fromMe;

    if (!isOwner) {
        const { isSenderAdmin, isBotAdmin } =
            await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            return sock.sendMessage(chatId, {
                text: 'Make me admin first.'
            }, { quoted: message });
        }

        if (!isSenderAdmin) {
            return sock.sendMessage(chatId, {
                text: 'Admins only.'
            }, { quoted: message });
        }
    }

    // ── Extract users ───────────────────────────────────────
    let usersToKick = extractTargets(userMessage, message);

    // ── Merge in any pre-resolved targets from the caller ────
    if (Array.isArray(extraJids) && extraJids.length > 0) {
        for (const jid of extraJids) {
            if (jid && !jid.endsWith('@g.us')) usersToKick.push(jid);
        }
        usersToKick = [...new Set(usersToKick)];
    }

    if (usersToKick.length === 0) {
        return sock.sendMessage(chatId, {
            text:
`*Usage:*
• .kick @user
• .kick 2567xxxxxx
• Reply to message with .kick`
        }, { quoted: message });
    }

    // ── Self protection: explicit check (clear message to user) ─
    if (isTargetingBot(usersToKick, sock)) {
        return sock.sendMessage(chatId, {
            text: "I can't kick myself 🤖"
        }, { quoted: message });
    }

    // ── Self protection: hard filter as a second safety net ───
    // Even if a future JID format change slips past the check above,
    // the bot's own id can never reach groupParticipantsUpdate.
    usersToKick = stripBot(usersToKick, sock);

    if (usersToKick.length === 0) {
        return sock.sendMessage(chatId, {
            text: "I can't kick myself 🤖"
        }, { quoted: message });
    }

    // ── Group metadata ──────────────────────────────────────
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata.participants || [];
    const participantIds = participants.map(p => p.id);

    // ── Filter valid users ──────────────────────────────────
    const validUsers = usersToKick.filter(j => participantIds.includes(j));
    const notInGroup = usersToKick.filter(j => !participantIds.includes(j));

    const kicked = [];
    const failed = [];

    // ── Kick in batches ─────────────────────────────────────
    for (let i = 0; i < validUsers.length; i += 5) {
        const batch = validUsers.slice(i, i + 5);

        try {
            await sock.groupParticipantsUpdate(chatId, batch, 'remove');
            kicked.push(...batch);
        } catch (err) {
            console.error('[KICK ERROR]', err);
            failed.push(...batch);
        }

        if (i + 5 < validUsers.length) {
            await new Promise(r => setTimeout(r, 800));
        }
    }

    // ── Response ────────────────────────────────────────────
    let text = '';

    if (kicked.length) {
        text += `✅ Kicked: ${kicked.map(j => '@' + j.split('@')[0]).join(', ')}\n`;
    }

    if (notInGroup.length) {
        text += `ℹ️ Not in group: ${notInGroup.map(j => '@' + j.split('@')[0]).join(', ')}\n`;
    }

    if (failed.length) {
        text += `❌ Failed: ${failed.map(j => '@' + j.split('@')[0]).join(', ')}\n`;
    }

    await sock.sendMessage(chatId, {
        text: text.trim(),
        mentions: usersToKick
    }, { quoted: message });
}

module.exports = kickCommand;
