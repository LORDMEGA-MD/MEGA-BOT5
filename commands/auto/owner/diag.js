// commands/auto/owner/diag.js
//
// Auto-loaded by main.js's tryAutoCommand as ".diag <check>" — owner/sudo
// only, enforced by main.js BEFORE this file is ever called (see the
// `tier === 'owner'` branch in tryAutoCommand). No auth logic needed here.
//
// SECURITY NOTE: this intentionally runs only a fixed, named set of checks
// below. It does NOT execute arbitrary text the user sends. Do not change
// this to "run whatever follows .diag" as raw shell input -- that turns any
// compromised owner/sudo session (leaked number, sim-swap, shared account,
// a bad paste) into full server compromise with no undo. To add a new
// check, add a new named function to DIAG_CHECKS; never pass user-supplied
// text into exec/execFile/eval.

const { execFile } = require('child_process');

function execFileP(cmd, args) {
    return new Promise((resolve) => {
        execFile(cmd, args, { timeout: 10000 }, (err, stdout, stderr) => {
            if (err) return resolve(`Error: ${err.message}`);
            resolve((stdout || stderr || '(no output)').trim());
        });
    });
}

const DIAG_CHECKS = {
    ram: async () => {
        const used = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        return `RAM (this process): ${used}MB`;
    },
    uptime: async () => execFileP('uptime', []),
    disk: async () => execFileP('df', ['-h', '/']),
    groq: async () => {
        try {
            const { GROQ_API_KEY, GROQ_MODEL, GROQ_API_BASE } = require('../../../lib/aiModels');
            if (!GROQ_API_KEY) return 'GROQ_API_KEY is not set in this process.';
            const res = await fetch(GROQ_API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
                body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: 'hi' }] }),
            });
            const body = await res.text();
            return `HTTP ${res.status}\n${body.slice(0, 300)}`;
        } catch (e) {
            return `Fetch error: ${e.message}`;
        }
    },
    env: async () => {
        // Reports PRESENCE only, never values. Chat history/logs are not a
        // safe place for a live credential to sit, even for the owner.
        const keys = ['GROQ_API_KEY', 'XWOLF_API_KEY'];
        return keys.map((k) => `${k}: ${process.env[k] ? 'set' : 'MISSING'}`).join('\n');
    },
    pid: async () => `PID: ${process.pid}\nNode: ${process.version}\nPlatform: ${process.platform}`,
};

// Auto-loader calls this as: fn(sock, chatId, message, args, userMessage)
// args = everything after ".diag ", already split on whitespace.
module.exports = async function diagCommand(sock, chatId, message, args) {
    const sub = String(args?.[0] || '').trim().toLowerCase();

    if (!sub || !DIAG_CHECKS[sub]) {
        await sock.sendMessage(
            chatId,
            { text: `Usage: .diag <${Object.keys(DIAG_CHECKS).join('|')}>` },
            { quoted: message }
        );
        return;
    }

    const result = await DIAG_CHECKS[sub]();
    await sock.sendMessage(chatId, { text: `📋 ${sub}:\n${result}` }, { quoted: message });
};
