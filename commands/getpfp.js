const jidToNum = (jid) => jid?.split('@')[0] || ''
const numToJid = (num) => num + '@s.whatsapp.net'

// @itsliaaa/baileys ships findUserId(jid) which resolves between
// phone-number JIDs and @lid JIDs. We use it instead of refusing
// outright whenever a target resolves to a @lid — that was likely
// why this was already broken: WhatsApp has been shifting more
// contacts to @lid identifiers, and profilePictureUrl generally
// needs the phone-number JID, not the LID, to succeed.
async function resolveJid(sock, jid) {
    if (!jid?.endsWith('@lid')) return jid
    if (typeof sock.findUserId !== 'function') return jid // fork not active / fallback
    try {
        const ids = await sock.findUserId(jid)
        return ids?.phoneNumber || jid
    } catch {
        return jid
    }
}

// Loosely compares two JIDs by their bare number/id, ignoring @suffix and
// :device parts — mirrors the same comparison style used elsewhere in the
// codebase (sameJidLoose in chatbot.js, bareNumber in lib/index.js).
function sameJidLoose(a, b) {
    if (!a || !b) return false
    const clean = (j) => String(j).split('@')[0].split(':')[0]
    return clean(a) === clean(b)
}

function resolveBotJids(sock) {
    const jids = new Set()
    try {
        const id = sock?.user?.id || ''
        const number = id.split(':')[0]
        if (number) {
            jids.add(id)
            jids.add(`${number}@s.whatsapp.net`)
            jids.add(`${number}@whatsapp.net`)
            jids.add(`${number}@lid`)
        }
        const lid = sock?.user?.lid
        if (lid) {
            jids.add(lid)
            jids.add(`${String(lid).split(':')[0]}@lid`)
        }
    } catch {}
    return jids
}

// extraJids: optional pre-resolved target array from an external caller
// (e.g. chatbot.js's AI intent router) that has already figured out who
// the target is via reply-to-sender or a remembered target from earlier
// in a conversation — cases this file's own mention/reply/typed-number
// parsing can't see on its own since there's no live mention or reply on
// the message chatbot.js actually hands in. When present, extraJids takes
// priority over the internally-parsed target, same precedence order the
// caller itself already resolved things in.
async function getPfpCommand(sock, chatId, message, extraJids = []) {
    try {
        let targetJid = null
        let targetNum = null

        if (Array.isArray(extraJids) && extraJids.length > 0) {
            targetJid = extraJids[0]
        }
        // Tagged
        else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0]
        }
        // Replied
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = message.message.extendedTextMessage.contextInfo.participant
        }
        // Typed number
        else if (message.message?.conversation) {
            const text = message.message.conversation.trim()
            const raw = text.replace(/^\.getpfp\s*/i, '').replace(/\s+/g, '')
            const num = raw.replace(/[^0-9]/g, '')
            if (num && num.length >= 8) {
                targetJid = numToJid(num)
            }
        }

        // Default: sender
        if (!targetJid) {
            targetJid = message.key.participant || message.key.remoteJid
        }

        // Refuse to fetch the bot's own profile picture as a side effect of
        // a misresolved target (e.g. replying to the bot's own message).
        const botJids = resolveBotJids(sock)
        if ([...botJids].some((b) => sameJidLoose(targetJid, b))) {
            await sock.sendMessage(chatId, {
                text: "> That's just me — nothing to fetch there."
            }, { quoted: message })
            return
        }

        // Resolve @lid -> phone-number JID where possible, instead of blanket-blocking
        targetJid = await resolveJid(sock, targetJid)
        targetNum = jidToNum(targetJid)

        // Still LID after resolution attempt? Then it genuinely can't be resolved.
        if (targetJid.endsWith('@lid')) {
            await sock.sendMessage(chatId, {
                text: '> Cannot fetch pfp for this user (LID could not be resolved to a phone number).'
            }, { quoted: message })
            return
        }

        // presenceSubscribe nudge
        try {
            await sock.presenceSubscribe(targetJid)
            await new Promise(res => setTimeout(res, 500))
        } catch {}

        // Fetch with 3 retries + fresh barrier per attempt
        let pfpUrl = null

        for (let i = 0; i < 3; i++) {
            try {
                pfpUrl = await Promise.race([
                    sock.profilePictureUrl(targetJid, 'image'),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
                ])
                if (pfpUrl) break
            } catch (err) {
                if (err.message === 'TIMEOUT') break
                if (i < 2) {
                    await new Promise(res => setTimeout(res, 1000 * (i + 1)))
                } else {
                    if (err.message?.includes('not-authorized') || err.message?.includes('404')) {
                        await sock.sendMessage(chatId, {
                            text: '> MF MIGHT NOT BE HAVING A PFP OR ITS HIDDEN.'
                        }, { quoted: message })
                        return
                    }
                    await sock.sendMessage(chatId, {
                        text: '> Failed to get profile picture: ' + (err.message || 'Unknown error')
                    }, { quoted: message })
                    return
                }
            }
        }

        // Low-res fallback
        if (!pfpUrl) {
            try {
                pfpUrl = await sock.profilePictureUrl(targetJid)
            } catch {
                await sock.sendMessage(chatId, {
                    text: '> MF MIGHT NOT BE HAVING A PFP OR ITS HIDDEN.'
                }, { quoted: message })
                return
            }
        }

        await new Promise(res => setTimeout(res, 700))

        await sock.sendMessage(chatId, {
            image: { url: pfpUrl },
            caption: `*🗿DONE, HERE IS @${targetNum}'s PFP*\n> EXTRACTED BY THE *MEGA-BOT.*`,
            mentions: [targetJid]
        }, { quoted: message })

    } catch (err) {
        console.error('getpfp error:', err)
    }
}

module.exports = getPfpCommand
