// commands/auto/mvcf.js
//
// Trigger: .mvcf (filename-based)
//
// Fetches the REAL phone numbers AND real names of every member in the
// current group (resolves @lid ids to phone numbers) and exports them.
//
// Usage:
// Each command sends exactly ONE output.
//
//   .mvcf              -> .vcf file of all members
//   .mvcf list         -> text list of all members ("name - number")
//   .mvcf txt          -> .txt file of all members, one number per line
//   .mvcf admins       -> text list of admins only (no file)
//   .mvcf admins vcf   -> .vcf file of admins only
//   .mvcf admins txt   -> .txt file of admins only
//
// Number resolution, in order:
//   1. participant.phoneNumber / participant.jid (Baileys v7)
//   2. participant.id if it is already @s.whatsapp.net
//   3. sock.signalRepository.lidMapping (Baileys v7 LID store)
//
// Name resolution, in order:
//   1. Name on the participant object itself (name / notify / verifiedName)
//   2. sock.store contacts, if your bot has a store
//   3. Saved contact names seen via contacts.upsert / contacts.update
//   4. Profile names (pushName) seen on incoming messages
//   5. Fallback -> "<Group name> 1", "<Group name> 2", ... (only for members
//      with no name available)
//
// IMPORTANT: WhatsApp does not hand out names in group metadata, so names are
// collected as the bot sees messages/contacts. This file starts collecting
// the first time .mvcf runs and saves what it learns to ./mvcf-names.json so
// it survives restarts. For best coverage, feed every incoming message to
// the collector from your main handler (one line):
//
//     require('./commands/auto/mvcf').remember(message);
//
// (adjust the path to wherever this file lives)

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), 'mvcf-names.json');

// ---------------------------------------------------------------------------
// Name cache
// ---------------------------------------------------------------------------
const contactNames = new Map(); // saved/address-book names (highest trust)
const pushNames = new Map();    // WhatsApp profile names (pushName)
const hookedSocks = new WeakSet();
let saveTimer = null;

// "1234567890:12@s.whatsapp.net" / "98765@lid" -> "1234567890" / "98765"
function userPart(jid) {
    if (!jid || typeof jid !== 'string') return null;
    const u = jid.split('@')[0].split(':')[0];
    return u || null;
}

// Trim, collapse whitespace, strip control chars. Reject names that are just
// a phone number (WhatsApp sometimes uses the number as the "name").
function cleanName(name) {
    if (!name || typeof name !== 'string') return null;
    const n = name.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!n) return null;
    if (/^\+?[\d\s\-()]+$/.test(n)) return null;
    return n.slice(0, 60);
}

try {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    for (const [k, v] of Object.entries(raw.contacts || {})) contactNames.set(k, v);
    for (const [k, v] of Object.entries(raw.push || {})) pushNames.set(k, v);
} catch { /* no cache yet */ }

function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify({
                contacts: Object.fromEntries(contactNames),
                push: Object.fromEntries(pushNames)
            }));
        } catch { /* ignore */ }
    }, 5000);
    if (saveTimer.unref) saveTimer.unref();
}

function setName(map, ids, name) {
    const n = cleanName(name);
    if (!n) return;
    let changed = false;
    for (const id of ids) {
        const u = userPart(id);
        if (u && map.get(u) !== n) { map.set(u, n); changed = true; }
    }
    if (changed) scheduleSave();
}

// Learn a profile name from an incoming message (pushName)
function remember(msg) {
    try {
        if (!msg || !msg.pushName || msg.key?.fromMe) return;
        const k = msg.key || {};
        const ids = [k.participant, k.participantAlt, k.participantPn, k.remoteJidAlt];
        if (k.remoteJid && !k.remoteJid.endsWith('@g.us') && !k.remoteJid.endsWith('@broadcast')) {
            ids.push(k.remoteJid);
        }
        setName(pushNames, ids.filter(Boolean), msg.pushName);
    } catch { /* ignore */ }
}

// Learn saved names from contacts events
function rememberContact(c) {
    try {
        if (!c) return;
        const ids = [c.id, c.lid, c.phoneNumber, c.jid].filter(Boolean);
        setName(contactNames, ids, c.name);
        setName(pushNames, ids, c.notify || c.verifiedName);
    } catch { /* ignore */ }
}

// Attach listeners once per socket
function hook(sock) {
    if (!sock?.ev || hookedSocks.has(sock)) return;
    hookedSocks.add(sock);
    try {
        sock.ev.on('messages.upsert', ({ messages }) => (messages || []).forEach(remember));
        sock.ev.on('contacts.upsert', (list) => (list || []).forEach(rememberContact));
        sock.ev.on('contacts.update', (list) => (list || []).forEach(rememberContact));
    } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Number resolution
// ---------------------------------------------------------------------------

// "1234567890:12@s.whatsapp.net" -> "1234567890"
function jidToNumber(jid) {
    if (!jid || typeof jid !== 'string') return null;
    if (!jid.endsWith('@s.whatsapp.net')) return null;
    const num = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
    return num.length >= 7 ? num : null;
}

async function resolveNumber(sock, p) {
    // 1. Fields Baileys v7 may provide directly
    const direct = jidToNumber(p.phoneNumber) || jidToNumber(p.jid);
    if (direct) return direct;

    // 2. Legacy: id is already a phone JID
    const legacy = jidToNumber(p.id);
    if (legacy) return legacy;

    // 3. Ask the LID mapping store
    const lid = p.lid || (p.id?.endsWith('@lid') ? p.id : null);
    if (lid) {
        try {
            const pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(lid);
            const fromMap = jidToNumber(pn);
            if (fromMap) return fromMap;
        } catch { /* ignore */ }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Name resolution
// ---------------------------------------------------------------------------
function resolveName(sock, p, num) {
    // 1. Name directly on the participant object
    const onObj = cleanName(p.name) || cleanName(p.notify) || cleanName(p.verifiedName);
    if (onObj) return onObj;

    const fullIds = [p.id, p.lid, p.phoneNumber, p.jid, `${num}@s.whatsapp.net`].filter(Boolean);

    // 2. Bot's own store, if there is one
    const contacts = sock.store?.contacts;
    if (contacts) {
        for (const id of fullIds) {
            const c = contacts[id];
            const n = cleanName(c?.name) || cleanName(c?.notify) || cleanName(c?.verifiedName);
            if (n) return n;
        }
    }

    // 3 + 4. Our cache: saved contact names first, then profile names
    const keys = [...new Set(fullIds.map(userPart).filter(Boolean))];
    for (const k of keys) if (contactNames.has(k)) return contactNames.get(k);
    for (const k of keys) if (pushNames.has(k)) return pushNames.get(k);

    return null;
}

// ---------------------------------------------------------------------------
// VCF
// ---------------------------------------------------------------------------
// Escape characters that have meaning inside vCard values
function vEscape(s) {
    return String(s)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, ' ');
}

function buildVcf(entries) {
    return entries.map(({ num, displayName }) => [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${vEscape(displayName)}`,
        `N:;${vEscape(displayName)};;;`,
        `TEL;type=CELL;waid=${num}:+${num}`,
        'END:VCARD'
    ].join('\n')).join('\n');
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------
module.exports = async function (sock, chatId, message, args) {
    hook(sock);
    remember(message);

    const modes = (args || []).map(a => String(a).toLowerCase());

    // Exactly one output format per command.
    // Explicit word wins; otherwise: admins -> text list, everything else -> vcf
    const wantsAdmins = modes.includes('admins');
    const format =
        modes.includes('vcf')  ? 'vcf'  :
        modes.includes('txt')  ? 'txt'  :
        modes.includes('list') ? 'list' :
        wantsAdmins            ? 'list' : 'vcf';

    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, {
            text: '❌ This command only works in groups.'
        }, { quoted: message });
    }

    let meta;
    try {
        meta = await sock.groupMetadata(chatId);
    } catch (err) {
        return sock.sendMessage(chatId, {
            text: `❌ Could not fetch group info: ${err.message}`
        }, { quoted: message });
    }

    let participants = meta.participants || [];
    if (modes.includes('admins')) {
        participants = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    }

    const groupName = meta.subject || 'Group';
    const safeName = groupName.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'group';

    // Resolve numbers + names (deduplicated, order preserved)
    const seen = new Set();
    const entries = [];
    let unresolved = 0;
    let named = 0;
    let fallbackCount = 0;

    for (const p of participants) {
        let num = null;
        try { num = await resolveNumber(sock, p); } catch { /* ignore */ }
        if (!num) { unresolved++; continue; }
        if (seen.has(num)) continue;
        seen.add(num);

        let name = null;
        try { name = resolveName(sock, p, num); } catch { /* ignore */ }

        let displayName;
        if (name) {
            displayName = name;
            named++;
        } else {
            fallbackCount++;
            displayName = `${groupName} ${fallbackCount}`;
        }

        entries.push({ num, name, displayName });
    }

    if (!entries.length) {
        return sock.sendMessage(chatId, {
            text: '❌ Could not resolve any real numbers. WhatsApp is hiding them behind LIDs and no mapping is available yet.'
        }, { quoted: message });
    }

    const header =
        `📇 *${groupName}*\n` +
        `• Members: ${participants.length}\n` +
        `• Resolved: ${entries.length}\n` +
        `• With names: ${named}\n` +
        (unresolved ? `• Unresolved: ${unresolved}\n` : '') +
        `━━━━━━━━━━━━━━━━`;

    const numbersOnly = entries.map(e => `+${e.num}`).join('\n');

    try {
        // Text list: "1. Name - +number"
        if (format === 'list') {
            const body = entries
                .map((e, i) => `${i + 1}. ${e.name ? e.name + ' - ' : ''}+${e.num}`)
                .join('\n');
            if (header.length + body.length > 3500) {
                return sock.sendMessage(chatId, {
                    document: Buffer.from(
                        entries.map(e => `${e.displayName}: +${e.num}`).join('\n'), 'utf8'
                    ),
                    mimetype: 'text/plain',
                    fileName: `${safeName}-numbers.txt`,
                    caption: header
                }, { quoted: message });
            }
            return sock.sendMessage(chatId, {
                text: `${header}\n${body}`
            }, { quoted: message });
        }

        // Plain txt file (numbers only)
        if (format === 'txt') {
            return sock.sendMessage(chatId, {
                document: Buffer.from(numbersOnly, 'utf8'),
                mimetype: 'text/plain',
                fileName: `${safeName}-numbers.txt`,
                caption: header
            }, { quoted: message });
        }

        // Default: VCF with real names
        await sock.sendMessage(chatId, {
            document: Buffer.from(buildVcf(entries), 'utf8'),
            mimetype: 'text/x-vcard',
            fileName: `${safeName}.vcf`,
            caption: header
        }, { quoted: message });
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to send export: ${err.message}`
        }, { quoted: message });
    }
};

// Expose the collector so your main message handler can feed it
module.exports.remember = remember;
module.exports.rememberContact = rememberContact;
