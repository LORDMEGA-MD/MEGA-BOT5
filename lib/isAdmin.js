// isAdmin.js
'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Shared metadata cache (file-backed for cross-instance sharing) ────────────
// In multisession, each bot process has its own memory, so we use a JSON file
// as a shared cache that all bot instances can read/write.
// Falls back to in-memory only if file ops fail.

const CACHE_TTL        = 5 * 60 * 1000;   // 5 minutes
const STALE_TTL        = 15 * 60 * 1000;  // 15 min — use stale on rate-limit
const SHARED_CACHE_DIR = (() => {
    try {
        const p = path.join(process.cwd(), 'data');
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        return p;
    } catch { return null; }
})();
const SHARED_CACHE_FILE = SHARED_CACHE_DIR
    ? path.join(SHARED_CACHE_DIR, 'groupMetadataCache.json')
    : null;

// In-memory layer (fast reads)
const memCache = new Map(); // chatId -> { data, expiry, staleTill }

// ─── Load shared cache from disk on startup ────────────────────────────────────
function loadSharedCache() {
    if (!SHARED_CACHE_FILE) return;
    try {
        if (!fs.existsSync(SHARED_CACHE_FILE)) return;
        const raw = JSON.parse(fs.readFileSync(SHARED_CACHE_FILE, 'utf8'));
        const now = Date.now();
        for (const [jid, entry] of Object.entries(raw)) {
            // Only load entries that are still within stale window
            if (entry.staleTill && entry.staleTill > now) {
                memCache.set(jid, entry);
            }
        }
        console.log(`[isAdmin] Loaded ${memCache.size} cached group(s) from disk`);
    } catch {}
}

// ─── Persist cache to disk (throttled — max once per 30s) ─────────────────────
let persistTimer = null;
function persistSharedCache() {
    if (!SHARED_CACHE_FILE) return;
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
        persistTimer = null;
        try {
            const obj = {};
            const now = Date.now();
            for (const [jid, entry] of memCache.entries()) {
                if (entry.staleTill > now) obj[jid] = entry; // only save non-expired
            }
            fs.writeFileSync(SHARED_CACHE_FILE, JSON.stringify(obj));
        } catch {}
    }, 30_000);
}

loadSharedCache();

// ─── In-flight request dedup ───────────────────────────────────────────────────
// Prevents multiple concurrent calls for the same group from all hitting WA
const inFlight = new Map(); // chatId -> Promise

// ─── Per-group rate-limit backoff tracker ─────────────────────────────────────
const rateLimitedUntil = new Map(); // chatId -> timestamp

// ─── Exponential backoff helper ────────────────────────────────────────────────
function getBackoffDelay(attempt) {
    return Math.min(1000 * Math.pow(2, attempt), 30_000); // max 30s
}

// ─── Core metadata fetcher with retry + backoff ────────────────────────────────
async function fetchMetadataWithRetry(sock, chatId, maxAttempts = 3) {
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            if (attempt > 0) {
                const backoff = getBackoffDelay(attempt);
                console.log(`[isAdmin] Retry ${attempt}/${maxAttempts} for ${chatId} in ${backoff}ms`);
                await new Promise(r => setTimeout(r, backoff));
            }
            const metadata = await sock.groupMetadata(chatId);
            return metadata;
        } catch (err) {
            lastErr = err;
            const msg = err?.message || '';
            const isRateLimit = msg.includes('rate-overlimit') ||
                                msg.includes('rate_overlimit') ||
                                msg.includes('429') ||
                                err?.data === 429 ||
                                err?.output?.statusCode === 429;

            if (isRateLimit) {
                // Back off this group for 2 minutes
                rateLimitedUntil.set(chatId, Date.now() + 2 * 60 * 1000);
                console.warn(`[isAdmin] Rate limited on ${chatId} — backing off 2min`);
                break; // Don't retry rate-limit errors, return stale cache
            }
            // For non-rate-limit errors, retry
        }
    }
    throw lastErr;
}

// ─── Main cached metadata getter ──────────────────────────────────────────────
async function getCachedMetadata(sock, chatId) {
    const now    = Date.now();
    const cached = memCache.get(chatId);

    // Fresh cache hit
    if (cached && now < cached.expiry) {
        return cached.data;
    }

    // Currently rate-limited — return stale if available, else throw
    if (rateLimitedUntil.has(chatId) && now < rateLimitedUntil.get(chatId)) {
        if (cached && now < cached.staleTill) {
            console.log(`[isAdmin] Rate-limited, serving stale cache for ${chatId}`);
            return cached.data;
        }
        throw new Error(`rate-overlimit (cached block active for ${chatId})`);
    }

    // Deduplicate concurrent requests for the same group
    if (inFlight.has(chatId)) {
        return inFlight.get(chatId);
    }

    const fetchPromise = (async () => {
        try {
            const metadata = await fetchMetadataWithRetry(sock, chatId);
            const entry = {
                data:      metadata,
                expiry:    now + CACHE_TTL,
                staleTill: now + STALE_TTL
            };
            memCache.set(chatId, entry);

            // Cap memory cache at 300 groups
            if (memCache.size > 300) {
                const firstKey = memCache.keys().next().value;
                memCache.delete(firstKey);
            }

            persistSharedCache();
            return metadata;
        } catch (err) {
            // On failure, serve stale data if available
            const stale = memCache.get(chatId);
            if (stale && now < stale.staleTill) {
                console.warn(`[isAdmin] Fetch failed for ${chatId}, serving stale cache`);
                return stale.data;
            }
            throw err;
        } finally {
            inFlight.delete(chatId);
        }
    })();

    inFlight.set(chatId, fetchPromise);
    return fetchPromise;
}

// ─── Cache invalidation (call on group-participants.update) ───────────────────
function invalidateGroupCache(chatId) {
    memCache.delete(chatId);
    inFlight.delete(chatId);
    rateLimitedUntil.delete(chatId);
    persistSharedCache();
}

// ─── Warm cache from store (call after bot connects) ──────────────────────────
// Pass in your store.groupMetadata object if available
function warmCacheFromStore(storeGroupMetadata) {
    if (!storeGroupMetadata || typeof storeGroupMetadata !== 'object') return;
    const now = Date.now();
    let count = 0;
    for (const [jid, metadata] of Object.entries(storeGroupMetadata)) {
        if (!memCache.has(jid) && metadata?.participants) {
            memCache.set(jid, {
                data:      metadata,
                expiry:    now + CACHE_TTL,
                staleTill: now + STALE_TTL
            });
            count++;
        }
    }
    if (count > 0) console.log(`[isAdmin] Warmed cache with ${count} groups from store`);
}

// ─── JID comparison helpers ────────────────────────────────────────────────────
function extractNum(jid) {
    if (!jid) return '';
    return jid.replace(/@.*/, '').split(':')[0];
}

function jidMatches(jid, participant) {
    if (!jid || !participant) return false;
    const pFullId  = participant.id  || '';
    const pFullLid = participant.lid || '';
    const pPhone   = participant.phoneNumber
        ? participant.phoneNumber.replace(/@.*/, '')
        : '';

    const jidNum = extractNum(jid);

    return (
        jid === pFullId  ||
        jid === pFullLid ||
        jidNum === extractNum(pFullId)  ||
        jidNum === extractNum(pFullLid) ||
        (pPhone && jidNum === pPhone)
    );
}

// ─── Main isAdmin function ────────────────────────────────────────────────────
async function isAdmin(sock, chatId, senderId) {
    try {
        const metadata     = await getCachedMetadata(sock, chatId);
        const participants = metadata.participants || [];

        const botId  = sock.user?.id  || '';
        const botLid = sock.user?.lid || '';

        // Check bot admin status
        const isBotAdmin = participants.some(p =>
            (jidMatches(botId, p) || jidMatches(botLid, p)) &&
            (p.admin === 'admin' || p.admin === 'superadmin')
        );

        // Check sender admin status
        const isSenderAdmin = participants.some(p =>
            jidMatches(senderId, p) &&
            (p.admin === 'admin' || p.admin === 'superadmin')
        );

        return { isSenderAdmin, isBotAdmin };

    } catch (err) {
        const msg = err?.message || '';
        const isRateLimit = msg.includes('rate-overlimit') ||
                            msg.includes('rate_overlimit') ||
                            msg.includes('429');

        if (!isRateLimit) {
            console.error('❌ Error in isAdmin:', msg);
        }
        // Return safe fallback — don't crash the command handler
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
module.exports.invalidateGroupCache = invalidateGroupCache;
module.exports.warmCacheFromStore   = warmCacheFromStore;
module.exports.getCachedMetadata    = getCachedMetadata;
