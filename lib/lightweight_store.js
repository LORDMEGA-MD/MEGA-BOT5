const fs = require('fs')
const path = require('path')

// ─── Per-bot store path ───────────────────────────────────────────────────────
// Each bot instance sets BOT_DIR via env. Using process.cwd() or a hardcoded
// relative path causes ALL bots to share one file — corrupting each other's
// message cache and causing session invalidation / logouts.
function getStorePath() {
    const botDir = process.env.BOT_DIR || global.BOT_DIR || process.cwd()
    return path.join(botDir, 'baileys_store.json')
}

// Config: keep last 20 messages per chat
let MAX_MESSAGES = 20

try {
    const settings = require('../settings.js')
    if (settings.maxStoreMessages && typeof settings.maxStoreMessages === 'number') {
        MAX_MESSAGES = settings.maxStoreMessages
    }
} catch (e) {}

const store = {
    messages: {},
    contacts: {},
    chats: {},

    readFromFile(filePath) {
        // Always use the per-bot path — ignore any passed-in path that might
        // be a shared location (e.g. the old hardcoded './baileys_store.json')
        const storePath = getStorePath()
        try {
            if (fs.existsSync(storePath)) {
                const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'))
                this.contacts = data.contacts || {}
                this.chats    = data.chats    || {}
                this.messages = data.messages || {}
                this.cleanupData()
            }
        } catch (e) {
            console.warn(`[Store:${process.env.BOT_ID || 'master'}] Failed to read store:`, e.message)
        }
    },

    writeToFile(filePath) {
        const storePath = getStorePath()
        try {
            fs.writeFileSync(storePath, JSON.stringify({
                contacts: this.contacts,
                chats:    this.chats,
                messages: this.messages
            }))
        } catch (e) {
            console.warn(`[Store:${process.env.BOT_ID || 'master'}] Failed to write store:`, e.message)
        }
    },

    cleanupData() {
        if (this.messages) {
            Object.keys(this.messages).forEach(jid => {
                if (typeof this.messages[jid] === 'object' && !Array.isArray(this.messages[jid])) {
                    const messages = Object.values(this.messages[jid])
                    this.messages[jid] = messages.slice(-MAX_MESSAGES)
                }
            })
        }
    },

    bind(ev) {
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (!msg.key?.remoteJid) return
                const jid = msg.key.remoteJid
                this.messages[jid] = this.messages[jid] || []
                this.messages[jid].push(msg)
                if (this.messages[jid].length > MAX_MESSAGES) {
                    this.messages[jid] = this.messages[jid].slice(-MAX_MESSAGES)
                }
            })
        })

        ev.on('contacts.update', (contacts) => {
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = {
                        id:   contact.id,
                        name: contact.notify || contact.name || ''
                    }
                }
            })
        })

        ev.on('chats.set', (chats) => {
            this.chats = {}
            chats.forEach(chat => {
                this.chats[chat.id] = { id: chat.id, subject: chat.subject || '' }
            })
        })
    },

    async loadMessage(jid, id) {
        return this.messages[jid]?.find(m => m.key.id === id) || null
    },

    getStats() {
        let totalMessages = 0
        Object.values(this.messages).forEach(chatMessages => {
            if (Array.isArray(chatMessages)) totalMessages += chatMessages.length
        })
        return {
            messages:           totalMessages,
            contacts:           Object.keys(this.contacts).length,
            chats:              Object.keys(this.chats).length,
            maxMessagesPerChat: MAX_MESSAGES,
            storePath:          getStorePath()
        }
    }
}

module.exports = store
