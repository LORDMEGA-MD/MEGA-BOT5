// commands/auto/admin/antidemote.js
//
// Trigger: .antidemote on|off / .antidemote mode restore|kick|punish
// Tier: admin/ folder — the loader already enforced before this file runs:
//   - message is from a group (not DM)
//   - the bot itself is a group admin
//   - the sender is a group admin (or is you, the bot owner, via fromMe)
//
// Modes:
//   restore (default) — re-promote the demoted user
//   kick               — remove whoever performed the demotion
//   punish             — demote whoever performed the demotion
// (kick/punish fall back to restore automatically if the actor JID
//  isn't available from the group-participants.update event)

const { setAntidemote, getAntidemote, ANTIDEMOTE_MODES } = require('../../../lib/index');

module.exports = async function (sock, chatId, message, args) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on' || sub === 'off') {
        await setAntidemote(chatId, sub, null);
        const config = await getAntidemote(chatId, 'on');
        const mode = config?.mode || 'restore';
        return sock.sendMessage(chatId, {
            text: sub === 'on'
                ? `✅ Antidemote enabled (mode: *${mode}*).`
                : '❌ Antidemote disabled.'
        }, { quoted: message });
    }

    if (sub === 'mode') {
        const target = (args[1] || '').toLowerCase();
        if (!ANTIDEMOTE_MODES.includes(target)) {
            const config = await getAntidemote(chatId, 'on');
            return sock.sendMessage(chatId, {
                text: `Usage: .antidemote mode restore|kick|punish\nCurrent mode: *${config?.mode || 'restore'}*`
            }, { quoted: message });
        }
        // Preserve current enabled state while changing mode
        const config = await getAntidemote(chatId, 'on');
        await setAntidemote(chatId, config?.enabled ? 'on' : 'off', target);
        return sock.sendMessage(chatId, {
            text: `🔧 Antidemote mode set to *${target}*.`
        }, { quoted: message });
    }

    const config = await getAntidemote(chatId, 'on');
    return sock.sendMessage(chatId, {
        text: `Antidemote is *${config?.enabled ? 'ON' : 'OFF'}*, mode: *${config?.mode || 'restore'}*.\n\nUsage:\n.antidemote on | off\n.antidemote mode restore|kick|punish`
    }, { quoted: message });
};

