const fs = require('fs');
const path = require('path');

const isOwnerOrSudo = require('../lib/isOwner');

function readJsonSafe(filePath, fallback) {
    try {
        const txt = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

async function settingsCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!' }, { quoted: message });
            return;
        }

        const isGroup = chatId.endsWith('@g.us');

        // ── FIX: use per-bot data dir (works for both master and minibots) ────
        const dataDir = global.BOT_DATA_DIR || path.join(process.cwd(), 'data');
        const dp = (filename) => path.join(dataDir, filename);

        const mode          = readJsonSafe(dp('messageCount.json'),  { isPublic: true });
        const autoStatus    = readJsonSafe(dp('autoStatus.json'),     { enabled: false });
        const autoread      = readJsonSafe(dp('autoread.json'),       { enabled: false });
        const autotyping    = readJsonSafe(dp('autotyping.json'),     { enabled: false });
        const pmblocker     = readJsonSafe(dp('pmblocker.json'),      { enabled: false });
        const anticall      = readJsonSafe(dp('anticall.json'),       { enabled: false });
        const antidelete    = readJsonSafe(dp('antidelete.json'),     { enabled: false, antistatusdelete: false });
        const alwaysonline = readJsonSafe(dp('alwaysonline.json'), { enabled: false });
        const userGroupData = readJsonSafe(dp('userGroupData.json'),  {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {},
            chatbot: {}, antitag: {}, antisticker: {}, antigroupmention: {}, antigroupstatus: {}, antibot: {}
        });

        const autoReaction = Boolean(userGroupData.autoReaction);

        // Per-group features
        const groupId = isGroup ? chatId : null;
        const antilinkOn         = groupId ? Boolean(userGroupData.antilink?.[groupId])         : false;
        const antistickerOn      = groupId ? Boolean(userGroupData.antisticker?.[groupId])      : false;
        const antigroupmentionOn = groupId ? Boolean(userGroupData.antigroupmention?.[groupId]) : false;
        const antigroupstatusOn  = groupId ? Boolean(userGroupData.antigroupstatus?.[groupId])  : false;
        const antibotOn          = groupId ? Boolean(userGroupData.antibot?.[groupId])          : false;
        const antibadwordOn      = groupId ? Boolean(userGroupData.antibadword?.[groupId])      : false;
        const welcomeOn          = groupId ? Boolean(userGroupData.welcome?.[groupId])          : false;
        const goodbyeOn          = groupId ? Boolean(userGroupData.goodbye?.[groupId])          : false;
        const chatbotOn          = groupId ? Boolean(userGroupData.chatbot?.[groupId])          : false;
        const antitagCfg         = groupId ? (userGroupData.antitag?.[groupId] || null)         : null;

        // Bot name for header
        const botName = global.botname || 'MEGA-BOT';

        const lines = [];
        lines.push(`*${botName} SETTINGS*`);
        if (global.BOT_ID && global.BOT_ID !== 'master') {
            lines.push(`_Bot ID: ${global.BOT_ID}_`);
        }
        lines.push('');
      //  lines.push(`> • Mode: ${mode.isPublic ? 'Public' : 'Private'}`);
        lines.push(`> • Mode: ${mode.isPublic ? 'Public' : 'Private'}`);
        lines.push(`> • Prefix: ${global.prefix || '.'}`);
        lines.push(`> • Auto Status: ${autoStatus.enabled ? 'ON' : 'OFF'}`);
        lines.push(`> • Autoread: ${autoread.enabled ? 'ON' : 'OFF'}`);
        lines.push(`> • Autotyping: ${autotyping.enabled ? 'ON' : 'OFF'}`);
        lines.push(`> • PM Blocker: ${pmblocker.enabled ? 'ON' : 'OFF'}`);
        lines.push(`> • Anticall: ${anticall.enabled ? 'ON' : 'OFF'}`);
        lines.push(`> • Auto Reaction: ${autoReaction ? 'ON' : 'OFF'}`);
        lines.push(`> • Antidelete: ${antidelete.enabled ? 'ON' : 'OFF'}`);
        lines.push(`> • Antistatus Delete: ${antidelete.antistatusdelete ? 'ON' : 'OFF'}`);
        lines.push(`> • Always Online: ${alwaysonline.enabled ? 'ON' : 'OFF'}`);

        if (groupId) {
            lines.push('');
            lines.push(`*GROUP SETTINGS*\n\n> *GROUP ID: ${groupId}*`);

            if (antilinkOn) {
                const al = userGroupData.antilink[groupId];
                lines.push(`> • Antilink: ON (action: ${al.action || 'delete'})`);
            } else {
                lines.push('> • Antilink: OFF');
            }

            if (antistickerOn) {
                const as = userGroupData.antisticker[groupId];
                lines.push(`> • AntiSticker: ON (action: ${as.action || 'delete'})`);
            } else {
                lines.push('> • AntiSticker: OFF');
            }

            if (antibotOn) {
                const ab = userGroupData.antibot[groupId];
                lines.push(`> • AntiBot: ON (action: ${ab.action || 'delete'})`);
            } else {
                lines.push('> • AntiBot: OFF');
            }

            if (antigroupmentionOn) {
                const agm = userGroupData.antigroupmention[groupId];
                lines.push(`> • AntiGroupMention: ON (action: ${agm.action || 'delete'})`);
            } else {
                lines.push('> • AntiGroupMention: OFF');
            }

            if (antigroupstatusOn) {
                const ags = userGroupData.antigroupstatus[groupId];
                lines.push(`> • AntiGroupStatus: ON (action: ${ags.action || 'delete'})`);
            } else {
                lines.push('> • AntiGroupStatus: OFF');
            }

            if (antibadwordOn) {
                const abw = userGroupData.antibadword[groupId];
                lines.push(`> • Antibadword: ON (action: ${abw.action || 'delete'})`);
            } else {
                lines.push('> • Antibadword: OFF');
            }

            lines.push(`> • Welcome: ${welcomeOn ? 'ON' : 'OFF'}`);
            lines.push(`> • Goodbye: ${goodbyeOn ? 'ON' : 'OFF'}`);
            lines.push(`> • Chatbot: ${chatbotOn ? 'ON' : 'OFF'}`);

            if (antitagCfg?.enabled) {
                lines.push(`> • Antitag: ON (action: ${antitagCfg.action || 'delete'})`);
            } else {
                lines.push('> • Antitag: OFF');
            }
        } else {
            lines.push('');
            lines.push('> _*Note: Per-group settings will be shown when used inside a group.*_');
        }

        await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to read settings.' }, { quoted: message });
    }
}

module.exports = settingsCommand;
