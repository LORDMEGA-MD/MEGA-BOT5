// lib/antidemote.js
//
// Fully self-contained. Does NOT depend on main.js's handleGroupParticipantUpdate,
// does NOT require any edit to main.js's routing logic, and does NOT depend on
// handleDemotionEvent in commands/demote.js at all.
//
// How it works: this file listens directly on the socket's raw
// 'group-participants.update' event — the same Baileys event your index.js
// already listens to — via its own independent sock.ev.on(...) call. Node's
// EventEmitter supports any number of independent listeners on the same
// event, so this doesn't conflict with anything else already listening.
//
// INTEGRATION — the only thing you need to do:
//
//   In index.js, right after `global.XeonBotInc = XeonBotInc;` (or anywhere
//   after the socket is created and before/around your other ev.on() calls),
//   add ONE line:
//
//       require('./lib/antidemote').register(XeonBotInc);
//
// That's it. No main.js edits, no import changes elsewhere, nothing that can
// go stale if main.js gets refactored later.
//
// Commands (drop-in, unchanged from before):
//   commands/auto/admin/antidemote.js — .antidemote on|off / .antidemote mode ...
//   (that file only needs setAntidemote/getAntidemote/ANTIDEMOTE_MODES, which
//   still live in lib/index.js as before — this file only adds the listener
//   + handler logic, storage stays where it already is)

const { getAntidemote, ANTIDEMOTE_MODES } = require('./index');

const _recentDemoteActions = new Map(); // `${groupId}:${jid}` -> timestamp
const _DEDUPE_WINDOW_MS = 5000;

function _alreadyHandling(groupId, jid) {
    const key = `${groupId}:${jid}`;
    const now = Date.now();
    const last = _recentDemoteActions.get(key);
    if (last && now - last < _DEDUPE_WINDOW_MS) return true;
    _recentDemoteActions.set(key, now);
    for (const [k, t] of _recentDemoteActions) {
        if (now - t > _DEDUPE_WINDOW_MS) _recentDemoteActions.delete(k);
    }
    return false;
}

async function _restore(sock, groupId, jid) {
    try {
        await new Promise(r => setTimeout(r, 1000));
        await sock.groupParticipantsUpdate(groupId, [jid], 'promote');
        await sock.sendMessage(groupId, {
            text: `🛡️ *Antidemote:* @${jid.split('@')[0]} was demoted and has been restored to admin.`,
            mentions: [jid]
        });
    } catch (err) {
        console.error('[antidemote] restore failed:', jid, err.message);
    }
}

async function _kickActor(sock, groupId, actorJid, targetJid) {
    try {
        await new Promise(r => setTimeout(r, 1000));
        await sock.groupParticipantsUpdate(groupId, [actorJid], 'remove');
        await sock.sendMessage(groupId, {
            text: `🚫 *Antidemote:* @${actorJid.split('@')[0]} demoted @${targetJid.split('@')[0]} and has been removed from the group.`,
            mentions: [actorJid, targetJid]
        });
    } catch (err) {
        console.error('[antidemote] kick failed:', actorJid, err.message);
    }
}

async function _punishActor(sock, groupId, actorJid, targetJid) {
    try {
        await new Promise(r => setTimeout(r, 1000));
        await sock.groupParticipantsUpdate(groupId, [actorJid], 'demote');
        await sock.sendMessage(groupId, {
            text: `⚔️ *Antidemote:* @${actorJid.split('@')[0]} demoted @${targetJid.split('@')[0]} and has lost admin as a result.`,
            mentions: [actorJid, targetJid]
        });
    } catch (err) {
        console.error('[antidemote] punish failed:', actorJid, err.message);
    }
}

async function _handleUpdate(sock, update) {
    try {
        const { id: groupId, participants, action, author } = update;
        if (action !== 'demote') return;
        if (!groupId || !groupId.endsWith('@g.us')) return;
        if (!Array.isArray(participants) || participants.length === 0) return;

        const config = await getAntidemote(groupId, 'on');
        if (!config || !config.enabled) return;

        const mode = ANTIDEMOTE_MODES.includes(config.mode) ? config.mode : 'restore';
        const botJid = sock.user?.id;
        const actorJid = author
            ? (typeof author === 'string' ? author : (author.id || author.toString()))
            : null;

        for (const rawJid of participants) {
            const jid = typeof rawJid === 'string' ? rawJid : (rawJid.id || rawJid.toString());

            if (jid === botJid) continue;
            if (_alreadyHandling(groupId, jid)) continue;

            if (mode === 'restore' || !actorJid) {
                await _restore(sock, groupId, jid);
                continue;
            }
            if (actorJid === botJid) continue;

            if (mode === 'kick')   await _kickActor(sock, groupId, actorJid, jid);
            if (mode === 'punish') await _punishActor(sock, groupId, actorJid, jid);

            await _restore(sock, groupId, jid);
        }
    } catch (err) {
        console.error('[antidemote] handler error:', err.message);
    }
}

// Guard against double-registration if register() is accidentally called
// more than once (e.g. on a reconnect that re-runs setup code) — without
// this, every reconnect would stack another duplicate listener and you'd
// get multiple restore/kick/punish messages per single demotion.
const _registeredSockets = new WeakSet();

function register(sock) {
    if (!sock || !sock.ev) {
        console.error('[antidemote] register() called without a valid socket — skipping.');
        return;
    }
    if (_registeredSockets.has(sock)) {
        console.log('[antidemote] listener already registered on this socket — skipping duplicate.');
        return;
    }
    _registeredSockets.add(sock);
    sock.ev.on('group-participants.update', (update) => {
        _handleUpdate(sock, update).catch(err =>
            console.error('[antidemote] unhandled error in listener:', err.message)
        );
    });
    console.log('[antidemote] listener registered directly on socket — independent of main.js routing.');
}

module.exports = { register };
