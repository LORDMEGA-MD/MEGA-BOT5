/**
 * MegaBot - Autotyping Command
 * Fixed: uses per-bot data dir (global.BOT_DATA_DIR) for multi-session support
 */

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

// ─── Per-bot config path ──────────────────────────────────────────────────────
// FIX: resolves correct data dir per bot instead of hardcoded ../data/
function getConfigPath() {
    const dataDir = global.BOT_DATA_DIR || path.join(__dirname, '..', 'data');
    return path.join(dataDir, 'autotyping.json');
}

function initConfig() {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

function saveConfig(config) {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

// ─── Channel info ─────────────────────────────────────────────────────────────
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '2120363161513685998@newsletter',
            newsletterName: 'MegaBot MD',
            serverMessageId: -1
        }
    }
};

// ─── Command ──────────────────────────────────────────────────────────────────
async function autotypingCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is only available for the owner!',
                ...channelInfo
            });
            return;
        }

        const args = message.message?.conversation?.trim().split(' ').slice(1) || 
                    message.message?.extendedTextMessage?.text?.trim().split(' ').slice(1) || 
                    [];
        
        const config = initConfig();
        
        if (args.length > 0) {
            const action = args[0].toLowerCase();
            if (action === 'on' || action === 'enable') {
                config.enabled = true;
            } else if (action === 'off' || action === 'disable') {
                config.enabled = false;
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Invalid option! Use: .autotyping on/off',
                    ...channelInfo
                });
                return;
            }
        } else {
            config.enabled = !config.enabled;
        }
        
        saveConfig(config);
        
        await sock.sendMessage(chatId, {
            text: `✅ Auto-typing has been ${config.enabled ? 'enabled' : 'disabled'}!`,
            ...channelInfo
        });
        
    } catch (error) {
        console.error('Error in autotyping command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error processing command!',
            ...channelInfo
        });
    }
}

// ─── Status check ─────────────────────────────────────────────────────────────
function isAutotypingEnabled() {
    try {
        return initConfig().enabled;
    } catch {
        return false;
    }
}

// ─── Typing helpers ───────────────────────────────────────────────────────────
async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (!isAutotypingEnabled()) return false;
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('available', chatId);
        await new Promise(r => setTimeout(r, 500));
        await sock.sendPresenceUpdate('composing', chatId);
        const typingDelay = Math.max(3000, Math.min(8000, userMessage.length * 150));
        await new Promise(r => setTimeout(r, typingDelay));
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(r => setTimeout(r, 1500));
        await sock.sendPresenceUpdate('paused', chatId);
        return true;
    } catch (error) {
        console.error('❌ Error sending typing indicator:', error);
        return false;
    }
}

async function handleAutotypingForCommand(sock, chatId) {
    if (!isAutotypingEnabled()) return false;
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('available', chatId);
        await new Promise(r => setTimeout(r, 500));
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(r => setTimeout(r, 3000));
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(r => setTimeout(r, 1500));
        await sock.sendPresenceUpdate('paused', chatId);
        return true;
    } catch (error) {
        console.error('❌ Error sending command typing indicator:', error);
        return false;
    }
}

async function showTypingAfterCommand(sock, chatId) {
    if (!isAutotypingEnabled()) return false;
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(r => setTimeout(r, 1000));
        await sock.sendPresenceUpdate('paused', chatId);
        return true;
    } catch (error) {
        console.error('❌ Error sending post-command typing indicator:', error);
        return false;
    }
}

module.exports = {
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage,
    handleAutotypingForCommand,
    showTypingAfterCommand
};
