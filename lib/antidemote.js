// lib/antidemote.js

const { getAntidemote, ANTIDEMOTE_MODES } = require('./index');

const _recentDemoteActions = new Map(); // `${groupId}:${jid}` -> timestamp
const _DEDUPE_WINDOW_MS = 5000;

// Actors who have demoted someone at least once. Antidemote will never
// restore admin to a jid in this set again, even via a later legitimate
// promote flow outside this module — this only guards _restore() calls
// made BY this module, since that's the only promotion path it controls.
const _blacklistedActors = new Set(); // `${groupId}:${jid}`

function _blacklistKey(groupId, jid) {
    return `${groupId}:${jid}`;
}

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
    if (_blacklistedActors.has(_blacklistKey(groupId, jid))) {
        console.log(`[antidemote] skipping restore — ${jid} in ${groupId} is blacklisted (previously demoted someone).`);
        return;
    }
    try {
        await new Promise(r => setTimeout(r, 1000));
        await sock.groupParticipantsUpdate(groupId, [jid], 'promote');
        console.log(`[antidemote] restored admin: ${jid} in ${groupId}`);
    } catch (err) {
        console.error('[antidemote] restore failed:', jid, err.message);
    }
}

async function _kickActor(sock, groupId, actorJid, targetJid) {
    _blacklistedActors.add(_blacklistKey(groupId, actorJid));
    try {
        await new Promise(r => setTimeout(r, 1000));
        await sock.groupParticipantsUpdate(groupId, [actorJid], 'remove');
        console.log(`[antidemote] kicked actor: ${actorJid} (demoted ${targetJid}) in ${groupId}`);
    } catch (err) {
        console.error('[antidemote] kick failed:', actorJid, err.message);
    }
}

async function _punishActor(sock, groupId, actorJid, targetJid) {
    _blacklistedActors.add(_blacklistKey(groupId, actorJid));
    try {
        await new Promise(r => setTimeout(r, 1000));
        await sock.groupParticipantsUpdate(groupId, [actorJid], 'demote');
        console.log(`[antidemote] punished actor: ${actorJid} (demoted ${targetJid}) in ${groupId}`);
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

            // The demoted target itself may still be someone who previously
            // demoted others — mark them so THEY can't be restored again,
            // regardless of mode. This is what stops a repeat-offender
            // demoter from being quietly re-promoted through the normal
            // restore path.
            if (actorJid && actorJid !== botJid) {
                _blacklistedActors.add(_blacklistKey(groupId, actorJid));
            }

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
