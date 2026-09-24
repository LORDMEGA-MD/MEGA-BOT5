// commands/auto/msgtype.js
//
// Trigger: .msgtype (filename-based)
//
// Debug tool. Prints the message structure as JSON so you can see exactly
// which keys/types WhatsApp/Baileys delivered.
//
// Usage:
//   .msgtype            -> dumps the QUOTED message if you replied to one,
//                          otherwise dumps your own command message
//   .msgtype full       -> dumps the ENTIRE raw message object (key, message,
//                          pushName, etc.) instead of just the body
//   .msgtype me         -> force-dump your own command message
//
// Also saves the full dump to ./msgtype-last.json on the bot's machine.

const fs = require('fs');
const path = require('path');

// Make JSON safe to print: Buffers/Uint8Array become short placeholders,
// Long (protobuf 64-bit) values become numbers/strings, BigInts become strings.
function replacer(key, value) {
    if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
        return `[Buffer ${value.data.length} bytes]`;
    }
    if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
        return `[Buffer ${value.length} bytes]`;
    }
    if (typeof value === 'bigint') return value.toString();
    if (value && typeof value === 'object' && 'low' in value && 'high' in value && 'unsigned' in value) {
        // protobufjs Long
        try { return Number(BigInt(value.high >>> 0) << 32n | BigInt(value.low >>> 0)); }
        catch { return `${value.high}:${value.low}`; }
    }
    return value;
}

// Find the top-level message type key(s), ignoring wrapper/meta keys
function detectTypes(msgObj) {
    if (!msgObj || typeof msgObj !== 'object') return [];
    const skip = new Set(['messageContextInfo', 'senderKeyDistributionMessage']);
    return Object.keys(msgObj).filter(k => !skip.has(k));
}

// Unwrap ephemeral / viewOnce / documentWithCaption wrappers so the real type shows
function unwrap(msgObj) {
    let cur = msgObj;
    const wrappers = [
        'ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2',
        'viewOnceMessageV2Extension', 'documentWithCaptionMessage',
        'editedMessage', 'botInvokeMessage'
    ];
    const chain = [];
    for (let i = 0; i < 6; i++) {
        const w = wrappers.find(k => cur && cur[k]);
        if (!w) break;
        chain.push(w);
        cur = cur[w].message || cur[w];
    }
    return { inner: cur, chain };
}

// Find contextInfo wherever it lives inside the message
function findContextInfo(msgObj) {
    if (!msgObj) return null;
    for (const k of Object.keys(msgObj)) {
        const v = msgObj[k];
        if (v && typeof v === 'object' && v.contextInfo) return v.contextInfo;
    }
    return null;
}

module.exports = async function (sock, chatId, message, args) {
    const mode = (args?.[0] || '').toLowerCase();

    const ctx = findContextInfo(unwrap(message.message).inner);
    const quoted = ctx?.quotedMessage;

    let target, label;
    if (mode === 'full') {
        target = message;
        label = 'FULL raw message object';
    } else if (quoted && mode !== 'me') {
        target = quoted;
        label = 'QUOTED message body';
    } else {
        target = message.message;
        label = 'YOUR message body';
    }

    const { inner, chain } = unwrap(target?.message && mode === 'full' ? target.message : target);
    const types = detectTypes(inner);

    let json;
    try {
        json = JSON.stringify(target, replacer, 2);
    } catch (err) {
        return sock.sendMessage(chatId, {
            text: `❌ Could not stringify message: ${err.message}`
        }, { quoted: message });
    }

    // Always save the full dump to disk (handy for pasting/uploading)
    try {
        fs.writeFileSync(
            path.join(process.cwd(), 'msgtype-last.json'),
            JSON.stringify(message, replacer, 2)
        );
    } catch { /* ignore */ }

    const header =
        `🔎 *${label}*\n` +
        `• Type: ${types.join(', ') || 'unknown'}\n` +
        (chain.length ? `• Wrapped in: ${chain.join(' → ')}\n` : '') +
        `• Size: ${json.length} chars\n` +
        `━━━━━━━━━━━━━━━━\n`;

    // WhatsApp text limit is ~65k; long dumps go out as a .json file
    if (header.length + json.length > 3500) {
        return sock.sendMessage(chatId, {
            document: Buffer.from(json, 'utf8'),
            mimetype: 'application/json',
            fileName: 'message-dump.json',
            caption: header.trim()
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
        text: header + '```' + json + '```'
    }, { quoted: message });
};
