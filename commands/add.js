const isAdmin = require('../lib/isAdmin');

/**
 * Normalize a raw number string into a clean E.164-style digit string.
 * Handles "+256 727 382352", "256-727-382352", "+256(727)382352", etc.
 */
function normalizeNumber(raw) {
    // Strip everything except digits
    const clean = raw.replace(/[^\d]/g, '');

    if (!clean) return null;

    // Basic sanity: international numbers are typically 8-15 digits
    if (clean.length < 8 || clean.length > 15) return null;

    return clean;
}

/**
 * Normalize number → JID
 */
function toJid(raw) {
    const clean = normalizeNumber(raw);
    if (!clean) return null;
    return clean + '@s.whatsapp.net';
}

/**
 * Extract group JID
 */
function extractGroupJid(userMessage) {
    const match = userMessage.match(/\d+@g\.us/i);
    return match ? match[0] : null;
}

/**
 * Extract users (clean).
 * Supports formats like:
 *   +256 727 382352
 *   256727382352
 *   +256-727-382352
 *   @mentions, quoted replies
 */
function extractTargets(userMessage, message) {
    const targets = new Set();

    let rawArgs = userMessage.replace(/^\.add\s*/i, '').trim();

    // Remove group jid completely
    rawArgs = rawArgs.replace(/\d+@g\.us/gi, '').trim();

    // Split on commas, semicolons, newlines, or 2+ spaces
    // (single spaces are kept intact since "+256 727 382352" is one number)
    const rawParts = rawArgs
        .split(/[,;\n]+|\s{2,}/)
        .map(p => p.trim())
        .filter(Boolean);

    for (const part of rawParts) {
        const jid = toJid(part);
        if (jid) targets.add(jid);
    }

    // quoted
    const quoted =
        message.message?.extendedTextMessage?.contextInfo?.participant;

    if (quoted && !quoted.endsWith('@g.us')) {
        targets.add(quoted);
    }

    // mentions
    const mentioned =
        message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    for (const jid of mentioned) {
        if (!jid.endsWith('@g.us')) targets.add(jid);
    }

    return [...targets];
}

/**
 * Check which JIDs actually exist on WhatsApp before attempting to add them.
 * Uses sock.onWhatsApp() — batched to avoid rate-limit issues.
 * Returns { valid: [jid...], invalid: [jid...] }
 */
async function filterExistingNumbers(sock, jids) {
    const valid = [];
    const invalid = [];

    if (!jids.length) return { valid, invalid };

    try {
        // onWhatsApp accepts multiple numbers in one call (without @s.whatsapp.net suffix)
        const numbers = jids.map(j => j.split('@')[0]);
        const results = await sock.onWhatsApp(...numbers);

        // Build a lookup of confirmed JIDs from the response
        const confirmed = new Set();
        if (Array.isArray(results)) {
            for (const r of results) {
                if (r?.exists && r?.jid) {
                    confirmed.add(r.jid);
                }
            }
        }

        for (const jid of jids) {
            if (confirmed.has(jid)) {
                valid.push(jid);
            } else {
                invalid.push(jid);
            }
        }
    } catch (err) {
        console.error('[ADD] onWhatsApp check failed:', err?.message || err);
        // If the check itself fails, fall back to treating all as "unknown"
        // rather than silently force-adding — mark all invalid to be safe.
        for (const jid of jids) invalid.push(jid);
    }

    return { valid, invalid };
}

/**
 * ADD USERS (STRICT TARGET GROUP)
 * Assumes `users` have already been pre-validated as existing WhatsApp accounts.
 */
async function performAdd(sock, targetGroup, users) {
    const added = [];
    const failed = [];
    const alreadyIn = [];

    let participants = [];

    try {
        const meta = await sock.groupMetadata(targetGroup);
        participants = meta.participants.map(p => p.id);
    } catch (err) {
        throw new Error('INVALID_GROUP');
    }

    for (const jid of users) {
        if (participants.includes(jid)) {
            alreadyIn.push(jid);
            continue;
        }

        try {
            const res = await sock.groupParticipantsUpdate(
                targetGroup,
                [jid],
                'add'
            );

            console.log(`[ADD] ${jid} → full res:`, JSON.stringify(res));

            // Baileys returns an array; guard against empty response
            const status = res?.[0]?.status ?? 'no_response';

            if (status === 200 || status === '200') {
                added.push(jid);
            } else if (status === 403) {
                failed.push({ jid, reason: 'privacy' });
            } else if (status === 408) {
                failed.push({ jid, reason: 'invite_required' });
            } else if (status === 409) {
                // Already in group (race condition)
                alreadyIn.push(jid);
            } else if (status === 404) {
                failed.push({ jid, reason: 'not_on_whatsapp' });
            } else {
                failed.push({ jid, reason: `status_${status}` });
            }

        } catch (err) {
            console.error(`[ADD] Error adding ${jid}:`, err?.message || err);
            failed.push({ jid, reason: 'error' });
        }

        // Small delay between adds to reduce risk of rate-limiting / flags
        await new Promise(r => setTimeout(r, 800));
    }

    return { added, failed, alreadyIn };
}

/**
 * MAIN COMMAND
 */
async function addCommand(sock, chatId, senderId, userMessage, message) {

    const isOwner = message.key.fromMe;

    // ── TARGET GROUP LOGIC ───────────────────────────────
    const targetGroupJid = extractGroupJid(userMessage);
    const targetGroup = targetGroupJid ? targetGroupJid : chatId;
    const isCross = Boolean(targetGroupJid);

    console.log(`[ADD] USING GROUP: ${targetGroup}`);

    // ── VALIDATE TARGET GROUP ────────────────────────────
    try {
        await sock.groupMetadata(targetGroup);
    } catch {
        await sock.sendMessage(chatId, {
            text: `❌ Invalid or inaccessible group JID.`
        }, { quoted: message });
        return;
    }

    // ── PERMISSIONS ──────────────────────────────────────
    if (!isOwner) {
        const { isBotAdmin } = await isAdmin(sock, targetGroup, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: `❌ Bot must be admin in target group.`
            }, { quoted: message });
            return;
        }
    }

    // ── EXTRACT USERS ────────────────────────────────────
    const rawTargets = extractTargets(userMessage, message);

    if (!rawTargets.length) {
        await sock.sendMessage(chatId, {
            text:
`Usage:
.add 2567xxx
.add +256 727 382352
.add @user
.add 2567xxx 12036@g.us

👉 If group JID is included → adds there
👉 Numbers not registered on WhatsApp are skipped automatically`
        }, { quoted: message });
        return;
    }

    // ── PRE-VALIDATE: skip numbers not registered on WhatsApp ────
    const { valid: users, invalid: notOnWhatsApp } = await filterExistingNumbers(sock, rawTargets);

    if (!users.length) {
        let text = `⚠️ None of the provided numbers are registered on WhatsApp.\n`;
        if (notOnWhatsApp.length) {
            text += `\n❌ Skipped:\n${notOnWhatsApp.map(j => '+' + j.split('@')[0]).join('\n')}`;
        }
        await sock.sendMessage(chatId, { text: text.trim() }, { quoted: message });
        return;
    }

    // ── ADD USERS ────────────────────────────────────────
    let result;
    try {
        result = await performAdd(sock, targetGroup, users);
    } catch (err) {
        if (err.message === 'INVALID_GROUP') {
            await sock.sendMessage(chatId, {
                text: `❌ Could not access target group.`
            }, { quoted: message });
            return;
        }
        // Unexpected error
        console.error('[ADD] Unexpected error:', err?.message || err);
        await sock.sendMessage(chatId, {
            text: `❌ Unexpected error occurred.`
        }, { quoted: message });
        return;
    }

    const { added, failed, alreadyIn } = result;

    // ── RESPONSE ─────────────────────────────────────────
    let text = isCross ? `📌 Target: ${targetGroup}\n\n` : '';

    if (added.length)
        text += `✅ Added: ${added.map(j => '@' + j.split('@')[0]).join(', ')}\n`;

    if (alreadyIn.length)
        text += `ℹ️ Already: ${alreadyIn.map(j => '@' + j.split('@')[0]).join(', ')}\n`;

    if (failed.length) {
        const failLines = failed.map(f => {
            const num = '@' + f.jid.split('@')[0];
            const reason = f.reason === 'privacy'        ? '(privacy settings)'
                         : f.reason === 'invite_required' ? '(invite only — needs invite link)'
                         : f.reason === 'not_on_whatsapp' ? '(not on WhatsApp)'
                         : `(${f.reason})`;
            return `${num} ${reason}`;
        });
        text += `❌ Failed:\n${failLines.join('\n')}\n`;
    }

    if (notOnWhatsApp.length) {
        text += `⏭️ Skipped (not on WhatsApp, never attempted):\n${notOnWhatsApp.map(j => '+' + j.split('@')[0]).join('\n')}\n`;
    }

    if (!added.length && !alreadyIn.length && !failed.length && !notOnWhatsApp.length) {
        text += `⚠️ No users were processed.`;
    }

    await sock.sendMessage(chatId, {
        text: text.trim(),
        mentions: [...added, ...alreadyIn, ...failed.map(f => f.jid)]
    }, { quoted: message });
}

module.exports = addCommand;
