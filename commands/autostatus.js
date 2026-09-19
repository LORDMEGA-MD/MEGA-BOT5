'use strict';

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const { loadExcludeList, normalizeJidForCompare } = require('./statusExclude');

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

// ─── Paths ─────────────────────────────────────────────────────────────────────
function getConfigPath() {
  const dataDir = global.BOT_DATA_DIR || path.join(__dirname, '../data');
  return path.join(dataDir, 'autoStatus.json');
}

function getMasterDataDir() {
  try {
    const botsDir = path.join(process.cwd(), 'bots');
    if (fs.existsSync(botsDir)) return path.join(botsDir, 'master', 'data');
  } catch {}
  return path.join(process.cwd(), 'data');
}

function getGlobalStatusConfigPath() {
  const d = getMasterDataDir();
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return path.join(d, 'globalStatusView.json');
}

function getGlobalQueuePath() {
  try {
    const botsDir = path.join(process.cwd(), 'bots');
    if (fs.existsSync(botsDir)) return path.join(botsDir, 'globalStatusQueue.json');
  } catch {}
  return path.join(process.cwd(), 'data', 'globalStatusQueue.json');
}

function getViewerRegistryPath() {
  const d = getMasterDataDir();
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return path.join(d, 'statusViewerRegistry.json');
}

// ─── Config loaders ────────────────────────────────────────────────────────────
function loadConfig() {
  try {
    const p = getConfigPath();
    if (!fs.existsSync(p)) {
      const d = { enabled: true, reactOn: false, emojis: ['💚'] };
      fs.writeFileSync(p, JSON.stringify(d, null, 2));
      return d;
    }
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!cfg.emojis || !Array.isArray(cfg.emojis) || cfg.emojis.length === 0) cfg.emojis = ['💚'];
    return cfg;
  } catch { return { enabled: true, reactOn: false, emojis: ['💚'] }; }
}

function saveConfig(config) {
  try { fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2)); }
  catch (err) { console.error('[AUTOSTATUS] Config save error:', err.message); }
}

function loadGlobalStatusConfig() {
  try {
    const p = getGlobalStatusConfigPath();
    if (!fs.existsSync(p)) return { enabled: false, reactOn: false, emojis: ['💚'] };
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!cfg.emojis || !Array.isArray(cfg.emojis) || cfg.emojis.length === 0) cfg.emojis = ['💚'];
    return cfg;
  } catch { return { enabled: false, reactOn: false, emojis: ['💚'] }; }
}

function saveGlobalStatusConfig(config) {
  try { fs.writeFileSync(getGlobalStatusConfigPath(), JSON.stringify(config, null, 2)); }
  catch (err) { console.error('[GLOBALSVIEW] Config save error:', err.message); }
}

// ─── Viewer registry ───────────────────────────────────────────────────────────
function loadViewerRegistry() {
  try {
    const p = getViewerRegistryPath();
    if (!fs.existsSync(p)) return { registeredJids: [], lastFullSync: 0 };
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (Array.isArray(raw.registeredJids) && raw.registeredJids.length > 0 && typeof raw.registeredJids[0] === 'string') {
      raw.registeredJids = raw.registeredJids.map(jid => ({ jid, registeredAt: 0 }));
    }
    return raw;
  } catch { return { registeredJids: [], lastFullSync: 0 }; }
}

function saveViewerRegistry(reg) {
  try { fs.writeFileSync(getViewerRegistryPath(), JSON.stringify(reg, null, 2)); }
  catch (err) { console.error('[VIEWERREG] Save error:', err.message); }
}

// ─── Global queue helpers ──────────────────────────────────────────────────────
function readGlobalQueue() {
  try {
    const p = getGlobalQueuePath();
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf8')) || [];
  } catch { return []; }
}

function writeGlobalQueue(entries) {
  try { fs.writeFileSync(getGlobalQueuePath(), JSON.stringify(entries, null, 2)); }
  catch {}
}

function pushToGlobalQueue(key) {
  try {
    const queue = readGlobalQueue();
    if (queue.find(e => e.id === key.id)) return;
    queue.push({
      id: key.id,
      remoteJid: key.remoteJid,
      participant: key.participant || key.remoteJid,
      fromMe: false,
      pushedAt: Date.now()
    });
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    writeGlobalQueue(queue.filter(e => e.pushedAt > cutoff));
  } catch (err) {
    console.error('[GLOBALSVIEW] pushToGlobalQueue error:', err.message);
  }
}

function getUnprocessedForBot(botId) {
  const queue = readGlobalQueue();
  const doneKey = `done_${botId}`;
  return { queue, unprocessed: queue.filter(e => !e[doneKey]), doneKey };
}

function markProcessedForBot(botId, ids) {
  try {
    const queue = readGlobalQueue();
    const doneKey = `done_${botId}`;
    for (const e of queue) if (ids.includes(e.id)) e[doneKey] = true;
    writeGlobalQueue(queue);
  } catch {}
}

// ─── Exclude-list check (shared with gstatus.js/.statusexclude) ───────────────
// Skips viewing/reacting to statuses posted by JIDs the user has excluded via
// .statusexclude — same file (statusExcluded.json) and same normalization
// (device-suffix stripped) that .gstatusme's outgoing send already uses, so
// both features stay consistent with a single source of truth.
//
// loadExcludeList/normalizeJidForCompare now come from ./statusExclude, a
// standalone module with no dependency on gstatus.js — this breaks the
// gstatus.js <-> autostatus.js circular require that was silently making
// loadExcludeList undefined depending on which file loaded first.
function isExcludedPoster(jid) {
  if (!jid) return false;
  try {
    const list = loadExcludeList();
    const excluded = new Set(list.map(normalizeJidForCompare));
    const normalizedJid = normalizeJidForCompare(jid);
    const isExcluded = excluded.has(normalizedJid);
    console.log(`[AUTOSTATUS][EXCLUDE-CHECK] poster="${jid}" normalized="${normalizedJid}" excludeListSize=${list.length} excludeList=${JSON.stringify(list)} → ${isExcluded ? 'EXCLUDED' : 'allowed'}`);
    return isExcluded;
  } catch (err) {
    console.error('[AUTOSTATUS] Exclude check failed:', err.message);
    return false;
  }
}

// ─── JID validator ─────────────────────────────────────────────────────────────
function toValidJid(raw) {
  if (!raw || typeof raw !== 'string') return null;
  if (
    raw.includes('@g.us') ||
    raw.includes('@broadcast') ||
    raw.includes('@newsletter') ||
    raw.includes('@lid')
  ) return null;
  let num = raw;
  if (raw.includes('@')) {
    if (!raw.endsWith('@s.whatsapp.net')) return null;
    num = raw.split('@')[0];
  }
  num = num.split(':')[0];
  if (!/^\d+$/.test(num)) return null;
  if (num.length < 7 || num.length > 13) return null;
  return `${num}@s.whatsapp.net`;
}

// ─── Contact extractor ─────────────────────────────────────────────────────────
function extractContactsFromStore(data) {
  const found = new Set();
  if (!data || typeof data !== 'object') return found;
  const add = (v) => { const jid = toValidJid(v); if (jid) found.add(jid); };

  if (Array.isArray(data.chats)) {
    for (const chat of data.chats) { if (chat?.id) add(chat.id); }
  }
  if (data.chats && typeof data.chats === 'object' && !Array.isArray(data.chats)) {
    for (const jid of Object.keys(data.chats)) add(jid);
  }
  if (data.contacts && typeof data.contacts === 'object') {
    for (const [key, val] of Object.entries(data.contacts)) {
      add(key);
      if (val && typeof val === 'object') {
        if (val.id) add(val.id);
        if (val.jid) add(val.jid);
      }
    }
  }
  if (data.messages && typeof data.messages === 'object' && !Array.isArray(data.messages)) {
    for (const jid of Object.keys(data.messages)) add(jid);
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') add(item);
      else if (item?.id) add(item.id);
      else if (item?.jid) add(item.jid);
    }
  }
  return found;
}

// ─── Scan bot directory for store files ───────────────────────────────────────
const TARGET_FILES = [
  'store.json',
  'contacts.json',
  'chats.json',
  'baileys_store.json',
  'baileys_store_multi.json',
  'wa-contacts.json'
];

function scanBotDirForContacts(botRootDir) {
  const found = new Set();
  if (!fs.existsSync(botRootDir)) return found;

  function scanDir(dir, depth) {
    if (depth > 2) return;
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry);
      let stat;
      try { stat = fs.statSync(full); } catch { continue; }
      if (stat.isDirectory()) {
        if (entry === 'session' || entry === 'session_backup') continue;
        scanDir(full, depth + 1);
      } else if (stat.isFile() && TARGET_FILES.includes(entry) && stat.size < 5 * 1024 * 1024) {
        try {
          const data = JSON.parse(fs.readFileSync(full, 'utf8'));
          const contacts = extractContactsFromStore(data);
          for (const c of contacts) found.add(c);
          if (contacts.size > 0) {
            console.log(`[GLOBALSVIEW] ${contacts.size} real contacts from ${full}`);
          }
        } catch {}
      }
    }
  }
  scanDir(botRootDir, 0);
  return found;
}

// ─── Public contact getters ────────────────────────────────────────────────────
function getAllMinibotContacts() {
  const contacts = new Set();
  try {
    const botsDir = path.join(process.cwd(), 'bots');
    const registryPath = path.join(botsDir, 'registry.json');
    if (!fs.existsSync(registryPath)) return contacts;

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    for (const [botId, botInfo] of Object.entries(registry)) {
      if (botId === 'master') continue;
      const roots = new Set([
        path.join(botsDir, botId),
        botInfo.dir,
        botInfo.dataDir
      ].filter(Boolean));
      for (const root of roots) {
        for (const c of scanBotDirForContacts(root)) contacts.add(c);
      }
    }
  } catch (err) { console.error('[GLOBALSVIEW] getAllMinibotContacts error:', err.message); }
  return contacts;
}

function getContactsPerBot() {
  const result = {};
  try {
    const botsDir = path.join(process.cwd(), 'bots');
    const registryPath = path.join(botsDir, 'registry.json');
    if (!fs.existsSync(registryPath)) return result;

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    for (const [botId, botInfo] of Object.entries(registry)) {
      if (botId === 'master') continue;
      const roots = new Set([
        path.join(botsDir, botId),
        botInfo.dir,
        botInfo.dataDir
      ].filter(Boolean));
      const botContacts = new Set();
      for (const root of roots) {
        for (const c of scanBotDirForContacts(root)) botContacts.add(c);
      }
      result[botId] = { name: botInfo.name || botInfo.number || botId, count: botContacts.size };
    }
  } catch (err) { console.error('[GLOBALSVIEW] getContactsPerBot error:', err.message); }
  return result;
}

// ─── Master viewer registration ────────────────────────────────────────────────
const REGISTRATION_BATCH_SIZE = 10;
const REGISTRATION_BATCH_DELAY = 2000;
const FULL_RESYNC_INTERVAL = 2 * 60 * 60 * 1000;
const SUBSCRIPTION_TTL = 2 * 60 * 60 * 1000;

let registrationInProgress = false;

async function registerMasterAsViewer(sock) {
  if (!global.IS_MASTER) return;
  if (registrationInProgress) return;
  registrationInProgress = true;

  try {
    const reg = loadViewerRegistry();
    const now = Date.now();
    const needsFullSync = (now - reg.lastFullSync) > FULL_RESYNC_INTERVAL;

    const alreadyDone = new Map(
      (reg.registeredJids || []).map(e =>
        typeof e === 'string' ? [e, 0] : [e.jid, e.registeredAt]
      )
    );

    const allContacts = getAllMinibotContacts();

    try {
      const botsDir = path.join(process.cwd(), 'bots');
      const masterDir = path.join(botsDir, 'master');
      for (const c of scanBotDirForContacts(masterDir)) allContacts.add(c);
    } catch {}

    const toRegister = needsFullSync
      ? [...allContacts]
      : [...allContacts].filter(jid => {
          const t = alreadyDone.get(jid);
          return t === undefined || now - t > SUBSCRIPTION_TTL;
        });

    if (toRegister.length === 0) {
      console.log('[VIEWERREG] No new or expired contacts to register.');
      registrationInProgress = false;
      return;
    }

    console.log(`[VIEWERREG] Registering master as viewer on ${toRegister.length} contact(s)...`);

    for (let i = 0; i < toRegister.length; i += REGISTRATION_BATCH_SIZE) {
      const batch = toRegister.slice(i, i + REGISTRATION_BATCH_SIZE);

      for (const jid of batch) {
        await registerSingleJid(sock, jid);
        await new Promise(r => setTimeout(r, 150));
      }

      for (const jid of batch) alreadyDone.set(jid, now);
      reg.registeredJids = [...alreadyDone.entries()].map(([jid, registeredAt]) => ({ jid, registeredAt }));

      if (needsFullSync && i + REGISTRATION_BATCH_SIZE >= toRegister.length) {
        reg.lastFullSync = now;
      }
      saveViewerRegistry(reg);

      console.log(`[VIEWERREG] Registered ${Math.min(i + REGISTRATION_BATCH_SIZE, toRegister.length)}/${toRegister.length}`);

      if (i + REGISTRATION_BATCH_SIZE < toRegister.length) {
        await new Promise(r => setTimeout(r, REGISTRATION_BATCH_DELAY));
      }
    }

    console.log(`[VIEWERREG] Done. Master registered as viewer on ${alreadyDone.size} contact(s).`);
  } catch (err) {
    console.error('[VIEWERREG] registerMasterAsViewer error:', err.message);
  } finally {
    registrationInProgress = false;
  }
}

// ─── Core per-JID registration ─────────────────────────────────────────────────
async function registerSingleJid(sock, jid) {
  if (!jid) return;

  try {
    if (typeof sock.presenceSubscribe === 'function') {
      await sock.presenceSubscribe(jid);
    }
  } catch {}

  try {
    if (typeof sock.subscribePresence === 'function') {
      await sock.subscribePresence(jid);
    }
  } catch {}

  try {
    if (typeof sock.fetchStatus === 'function') {
      await sock.fetchStatus(jid);
    }
  } catch {}

  try {
    if (typeof sock.sendPresenceUpdate === 'function') {
      await sock.sendPresenceUpdate('available', jid);
    }
  } catch {}
}

// ─── Auto-register on new status from unregistered/expired JID ────────────────
async function ensureViewerOnJid(sock, jid) {
  if (!global.IS_MASTER || !jid) return;
  try {
    const clean = toValidJid(jid);
    if (!clean) return;
    const reg = loadViewerRegistry();
    const existing = (reg.registeredJids || []).find(e =>
      (typeof e === 'string' ? e : e.jid) === clean
    );
    const registeredAt = existing ? (typeof existing === 'string' ? 0 : existing.registeredAt) : undefined;

    if (registeredAt !== undefined && Date.now() - registeredAt < SUBSCRIPTION_TTL) return;

    await registerSingleJid(sock, clean);

    const filtered = (reg.registeredJids || []).filter(e =>
      (typeof e === 'string' ? e : e.jid) !== clean
    );
    filtered.push({ jid: clean, registeredAt: Date.now() });
    reg.registeredJids = filtered;
    saveViewerRegistry(reg);
    console.log(`[VIEWERREG] Auto-registered/renewed JID: ${clean}`);
  } catch {}
}

// ─── Debug command ─────────────────────────────────────────────────────────────
function debugBotStructure() {
  const lines = [];
  try {
    const botsDir = path.join(process.cwd(), 'bots');
    const registryPath = path.join(botsDir, 'registry.json');
    lines.push(`📁 bots dir: ${botsDir}`);
    lines.push(`📄 registry exists: ${fs.existsSync(registryPath)}`);
    if (!fs.existsSync(registryPath)) return lines;

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    lines.push(`🤖 bots: ${Object.keys(registry).join(', ')}\n`);

    for (const [botId, botInfo] of Object.entries(registry)) {
      if (botId === 'master') continue;
      lines.push(`─── Bot: ${botId} ───`);
      const botDir = path.join(botsDir, botId);
      if (fs.existsSync(botDir)) {
        function listFiles(dir, prefix, depth) {
          if (depth > 2) return;
          let entries;
          try { entries = fs.readdirSync(dir); } catch { return; }
          for (const e of entries) {
            const full = path.join(dir, e);
            let s;
            try { s = fs.statSync(full); } catch { continue; }
            if (s.isDirectory()) {
              lines.push(`  ${prefix}📁 ${e}/`);
              if (e !== 'session' && e !== 'session_backup') listFiles(full, prefix + '  ', depth + 1);
            } else if (s.isFile() && TARGET_FILES.includes(e)) {
              lines.push(`  ${prefix}📄 ${e} (${(s.size / 1024).toFixed(1)}KB)`);
              if (s.size < 5 * 1024 * 1024) {
                try {
                  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
                  const topKeys = Array.isArray(data) ? `[array ${data.length}]` : Object.keys(data).slice(0, 6).join(', ');
                  lines.push(`  ${prefix}  top-level keys: ${topKeys}`);
                  if (Array.isArray(data.chats)) {
                    const chatSample = data.chats.slice(0, 5).map(c => c?.id || '?').join(', ');
                    lines.push(`  ${prefix}  chats[0..4]: ${chatSample}`);
                  }
                  if (data.contacts && typeof data.contacts === 'object') {
                    const rawKeys = Object.keys(data.contacts).slice(0, 4);
                    lines.push(`  ${prefix}  contacts raw keys sample: ${rawKeys.join(', ')}`);
                    const firstVal = data.contacts[rawKeys[0]];
                    if (firstVal) lines.push(`  ${prefix}  contacts[0] value: ${JSON.stringify(firstVal).slice(0, 80)}`);
                  }
                  const contacts = extractContactsFromStore(data);
                  if (contacts.size > 0) {
                    lines.push(`  ${prefix}  ✅ real contacts found: ${contacts.size}`);
                    lines.push(`  ${prefix}  sample: ${[...contacts].slice(0, 3).join(', ')}`);
                  } else {
                    lines.push(`  ${prefix}  ⚠️ 0 real contacts found`);
                  }
                } catch (pe) {
                  lines.push(`  ${prefix}  ⚠️ parse error: ${pe.message}`);
                }
              }
            }
          }
        }
        listFiles(botDir, '', 0);
      }
      lines.push('');
    }

    const total = getAllMinibotContacts().size;
    const reg = loadViewerRegistry();
    const registeredCount = (reg.registeredJids || []).length;
    const now = Date.now();
    const freshCount = (reg.registeredJids || []).filter(e => {
      const t = typeof e === 'string' ? 0 : e.registeredAt;
      return now - t < SUBSCRIPTION_TTL;
    }).length;

    lines.push(`📊 Total real contacts: ${total}`);
    lines.push(`👁️  Registered viewer JIDs: ${registeredCount} (${freshCount} fresh, ${registeredCount - freshCount} expired/pending renewal)`);
    lines.push(`🕒 Last full sync: ${reg.lastFullSync ? new Date(reg.lastFullSync).toLocaleString() : 'Never'}`);

    lines.push(`\n🔧 Sock methods available:`);
    lines.push(`  presenceSubscribe: will check at runtime`);
    lines.push(`  subscribePresence: will check at runtime`);
    lines.push(`  fetchStatus: will check at runtime`);
    lines.push(`  sendPresenceUpdate: will check at runtime`);
  } catch (err) { lines.push(`❌ Debug error: ${err.message}`); }
  return lines;
}

// ─── Per-bot autostatus queue ──────────────────────────────────────────────────
const pendingStatusKeys = [];
let batchTimer = null;
let _sock = null;

// ─── Dedup cache to prevent reacting to the same status ID twice ───────────────
const recentlyProcessedIds = new Set();
const PROCESSED_TTL = 30 * 60 * 1000; // 30 minutes

function isDuplicate(id) {
  return recentlyProcessedIds.has(id);
}

function markProcessed(id) {
  recentlyProcessedIds.add(id);
  setTimeout(() => recentlyProcessedIds.delete(id), PROCESSED_TTL);
}

function queueStatusKey(key) {
  // ✅ FIX: Skip own outgoing messages/reactions and duplicates
  if (key.fromMe) return;
  if (!key.id) return;
  if (isDuplicate(key.id)) return;

  // Skip statuses posted by anyone on the .statusexclude list — same file
  // and normalization gstatus.js uses for outgoing .gstatusme sends.
  const poster = key.participant || key.remoteJid;
  if (isExcludedPoster(poster)) return;

  if (!pendingStatusKeys.some(k => k.id === key.id)) {
    pendingStatusKeys.push(key);
  }
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(() => flushStatusQueue(), 3000);
}

function getRandomEmoji(cfg) {
  const emojis = (Array.isArray(cfg?.emojis) && cfg.emojis.length > 0) ? cfg.emojis.slice(0, 5) : ['💚'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// ─── Core status viewer ────────────────────────────────────────────────────────
async function viewStatus(sock, key, emoji) {
  const sender = key.participant || (key.remoteJid !== 'status@broadcast' ? key.remoteJid : null);
  const messageId = key.id;

  // Primary read receipt
  try {
    await sock.readMessages([{
      remoteJid: 'status@broadcast',
      id: messageId,
      participant: sender,
      fromMe: false
    }]);
  } catch {}

  // Fallback receipt method
  try {
    await sock.sendReceipt(sender, undefined, [messageId], 'read');
  } catch {}

  // Send reaction to status@broadcast with statusJidList
  if (emoji && sender) {
    try {
      await sock.sendMessage(
        'status@broadcast',
        {
          react: {
            text: emoji,
            key: {
              remoteJid: 'status@broadcast',
              id: messageId,
              participant: sender,
              fromMe: false
            }
          }
        },
        {
          statusJidList: [sender]
        }
      );
      console.log(`[AUTOSTATUS] Reacted ${emoji} to status from ${sender}`);
    } catch (err) {
      console.error('[AUTOSTATUS] React error:', err.message);
    }
  }
}

async function flushStatusQueue() {
  if (!pendingStatusKeys.length || !_sock) return;
  const keys = pendingStatusKeys.splice(0, pendingStatusKeys.length);
  const cfg = loadConfig();
  for (const key of keys) {
    try {
      // ✅ FIX: Mark as processed before reacting to prevent re-entry
      markProcessed(key.id);
      await viewStatus(_sock, key, cfg.reactOn ? getRandomEmoji(cfg) : '');
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error('[AUTOSTATUS] Error viewing status:', err.message);
    }
  }
}

// ─── Minibot global queue processor ───────────────────────────────────────────
const globalQueueIntervals = new Map();

function startGlobalQueueProcessor(sock, botId) {
  if (globalQueueIntervals.has(botId)) return;

  const interval = setInterval(async () => {
    try {
      const cfg = loadGlobalStatusConfig();
      if (!cfg.enabled) return;

      const THREE_HOURS = 3 * 60 * 60 * 1000;
      const doneKey = `done_${botId}`;
      const queueRaw = readGlobalQueue();
      let changed = false;
      for (const e of queueRaw) {
        if (e[doneKey] && e.pushedAt && Date.now() - e.pushedAt > THREE_HOURS) {
          delete e[doneKey];
          changed = true;
        }
      }
      if (changed) writeGlobalQueue(queueRaw);

      const { unprocessed } = getUnprocessedForBot(botId);
      if (!unprocessed.length) return;

      console.log(`[GLOBALSVIEW] Bot ${botId} processing ${unprocessed.length} status(es)...`);
      const done = [];
      for (const entry of unprocessed) {
        try {
          // Skip statuses from excluded posters here too, so the global
          // queue (shared across minibots) respects the same exclude list.
          const poster = entry.participant || entry.remoteJid;
          if (isExcludedPoster(poster)) {
            done.push(entry.id);
            continue;
          }
          await viewStatus(sock, {
            id: entry.id,
            remoteJid: entry.remoteJid,
            participant: entry.participant,
            fromMe: false
          }, cfg.reactOn ? getRandomEmoji(cfg) : '');
          done.push(entry.id);
          await new Promise(r => setTimeout(r, 450));
        } catch (err) {
          console.error(`[GLOBALSVIEW] Bot ${botId} view error:`, err.message);
        }
      }
      if (done.length) markProcessedForBot(botId, done);
    } catch (err) {
      console.error(`[GLOBALSVIEW] Processor error (${botId}):`, err.message);
    }
  }, 5000);

  globalQueueIntervals.set(botId, interval);
  console.log(`[GLOBALSVIEW] Queue processor started for bot ${botId}`);
}

// ─── Main status handler ───────────────────────────────────────────────────────
async function handleStatusUpdate(sock, status) {
  try {
    _sock = sock;
    console.log(`[AUTOSTATUS][ENTRY] handleStatusUpdate called, IS_MASTER=${global.IS_MASTER}`);
    const incomingKeys = [];

    if (status.messages?.length > 0) {
      // ✅ FIX: Ignore fromMe messages (own reaction receipts coming back)
      for (const msg of status.messages) {
        if (msg.key?.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
          incomingKeys.push(msg.key);
        }
      }
    } else if (status.key?.remoteJid === 'status@broadcast') {
      // ✅ FIX: Ignore own outgoing keys
      if (!status.key.fromMe) {
        incomingKeys.push(status.key);
      }
    } else if (status.reaction?.key?.remoteJid === 'status@broadcast') {
      // ✅ FIX: Ignore our own reaction receipts — this was the main loop cause
      if (!status.reaction.key.fromMe) {
        incomingKeys.push(status.reaction.key);
      }
    } else if (Array.isArray(status)) {
      for (const s of status) {
        // ✅ FIX: Ignore fromMe in array form too
        if (s.key?.remoteJid === 'status@broadcast' && !s.key.fromMe) {
          incomingKeys.push(s.key);
        }
      }
    }

    for (const key of incomingKeys) {
      // Check the exclude list FIRST, before anything else — before viewer
      // registration, before queueing, before pushing to the global queue.
      // An excluded poster's status should never be viewed/reacted to at all.
      const poster = key.participant || key.remoteJid;
      if (isExcludedPoster(poster)) {
        console.log(`[AUTOSTATUS] Skipped status from excluded poster: ${poster}`);
        continue;
      }

      if (global.IS_MASTER) {
        ensureViewerOnJid(sock, poster).catch(() => {});
      }

      if (loadConfig().enabled) queueStatusKey(key);
      if (global.IS_MASTER && loadGlobalStatusConfig().enabled) pushToGlobalQueue(key);
    }
  } catch (err) {
    console.error('❌ Error in auto status view:', err.message);
  }
}

// ─── .globalsview command ──────────────────────────────────────────────────────
async function handleGlobalStatusViewCommand(sock, chatId, message, match) {
  const senderId = message.key.participant || message.key.remoteJid;
  const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

  if (!message.key.fromMe && !isOwner)
    return sock.sendMessage(chatId, { text: '❌ Only the bot owner can use this command.' }, { quoted: message });

  if (!global.IS_MASTER)
    return sock.sendMessage(chatId, { text: '❌ This command can only be used on the master bot.' }, { quoted: message });

  const cfg = loadGlobalStatusConfig();

  if (!match || match.trim() === '') {
    const contacts = getAllMinibotContacts();
    const reg = loadViewerRegistry();
    const now = Date.now();
    const freshCount = (reg.registeredJids || []).filter(e => {
      const t = typeof e === 'string' ? 0 : e.registeredAt;
      return now - t < SUBSCRIPTION_TTL;
    }).length;
    return sock.sendMessage(chatId, {
      text: `_*MEGA-BOT GLOBAL STATUS VIEW*_\n\n` +
        `Status: ${cfg.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
        `Reactions: ${cfg.reactOn ? `✅ On (${cfg.emojis?.join(' ')})` : '❌ Off (silent)'}\n` +
        `Minibot Contacts Tracked: *${contacts.size}*\n` +
        `Registered as Viewer on: *${(reg.registeredJids || []).length}* JIDs (${freshCount} active subscriptions)\n\n` +
        `> *.globalsview on* — Enable\n` +
        `> *.globalsview off* — Disable\n` +
        `> *.globalsview react on/off* — Toggle reactions\n` +
        `> *.globalsview emoji 🗿 🚮 ❤️* — Set reaction emojis\n` +
        `> *.globalsview contacts* — Per-bot breakdown\n` +
        `> *.globalsview register* — Force re-register as viewer on all mini bot contacts\n` +
        `> *.globalsview debug* — Diagnose contact loading`
    }, { quoted: message });
  }

  const parts = match.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();

  if (cmd === 'on') {
    cfg.enabled = true;
    saveGlobalStatusConfig(cfg);
    const contacts = getAllMinibotContacts();
    registerMasterAsViewer(sock).catch(err =>
      console.error('[VIEWERREG] Background registration error:', err.message)
    );
    return sock.sendMessage(chatId, {
      text: `✅ Global Status View enabled!\n` +
        `Tracked contacts: *${contacts.size}*\n` +
        (contacts.size === 0
          ? `\n⚠️ No contacts found yet — run *.globalsview debug*`
          : `\n👁️ Registering master as viewer on all mini bot contacts in background...\nRun *.globalsview debug* to check progress.`)
    }, { quoted: message });
  }

  if (cmd === 'off') {
    cfg.enabled = false;
    saveGlobalStatusConfig(cfg);
    return sock.sendMessage(chatId, { text: '❌ Global Status View disabled.' }, { quoted: message });
  }

  if (cmd === 'react') {
    const sub = parts[1]?.toLowerCase();
    if (sub === 'on') {
      cfg.reactOn = true;
      saveGlobalStatusConfig(cfg);
      return sock.sendMessage(chatId, { text: `💚 Reactions enabled — using: ${cfg.emojis?.join(' ') || '💚'}` }, { quoted: message });
    }
    if (sub === 'off') {
      cfg.reactOn = false;
      saveGlobalStatusConfig(cfg);
      return sock.sendMessage(chatId, { text: '✅ Reactions disabled — silent views.' }, { quoted: message });
    }
    return sock.sendMessage(chatId, { text: '❌ Use: .globalsview react on/off' }, { quoted: message });
  }

  if (cmd === 'emoji') {
    const emojis = parts.slice(1).filter(e => e.trim());
    cfg.emojis = emojis.length > 0 ? emojis.slice(0, 5) : ['💚'];
    saveGlobalStatusConfig(cfg);
    return sock.sendMessage(chatId, { text: `✅ Emojis set: ${cfg.emojis.join(' ')}` }, { quoted: message });
  }

  if (cmd === 'contacts') {
    const perBot = getContactsPerBot();
    const total = getAllMinibotContacts().size;
    if (Object.keys(perBot).length === 0) {
      return sock.sendMessage(chatId, { text: `❌ No minibots found.\nRun *.globalsview debug* to diagnose.` }, { quoted: message });
    }
    let report = `*🌐 GLOBAL STATUS — Contact Breakdown*\n\n`;
    for (const [, info] of Object.entries(perBot)) {
      report += `🤖 *${info.name}*: ${info.count} contacts\n`;
    }
    report += `\n📊 *Total unique:* ${total}`;
    if (total === 0) report += `\n\n⚠️ Run *.globalsview debug* to diagnose.`;
    return sock.sendMessage(chatId, { text: report }, { quoted: message });
  }

  if (cmd === 'register') {
    const reg = loadViewerRegistry();
    reg.lastFullSync = 0;
    reg.registeredJids = [];
    saveViewerRegistry(reg);
    await sock.sendMessage(chatId, {
      text: `🔄 Starting viewer registration on all mini bot contacts...\nThis runs in the background — check *.globalsview debug* for progress.`
    }, { quoted: message });
    registerMasterAsViewer(sock).catch(err =>
      console.error('[VIEWERREG] Force registration error:', err.message)
    );
    return;
  }

  if (cmd === 'debug') {
    const lines = debugBotStructure();
    const chunks = [];
    let chunk = '';
    for (const line of lines) {
      if ((chunk + '\n' + line).length > 3500) { chunks.push(chunk); chunk = line; }
      else chunk += (chunk ? '\n' : '') + line;
    }
    if (chunk) chunks.push(chunk);
    for (const c of chunks) {
      await sock.sendMessage(chatId, { text: `\`\`\`\n${c}\n\`\`\`` }, { quoted: message });
      await new Promise(r => setTimeout(r, 500));
    }
    return;
  }

  return sock.sendMessage(chatId, { text: '❌ Unknown subcommand. Use .globalsview to see options.' }, { quoted: message });
}

// ─── Per-bot .autostatus command ───────────────────────────────────────────────
async function autoStatusCommand(sock, chatId, msg, args) {
  try {
    const senderId = msg.key.participant || msg.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!msg.key.fromMe && !isOwner) {
      await sock.sendMessage(chatId, { text: '❌ This command can only be used by the owner!', ...channelInfo });
      return;
    }

    let config = loadConfig();

    if (!args || args.length === 0) {
      await sock.sendMessage(chatId, {
        text: `🔄 Auto Status Settings\n\n` +
          `📱 Auto Status View: ${config.enabled ? 'enabled' : 'disabled'}\n` +
          `💫 Status Reactions: ${config.reactOn ? `enabled (${config.emojis?.join(' ') || '💚'})` : 'disabled (views silently)'}\n\n` +
          `Commands:\n` +
          `.autostatus on\n` +
          `.autostatus off\n` +
          `.autostatus react on\n` +
          `.autostatus react off\n` +
          `.autostatus emoji 😍 😂 🔥 💚 🤍`,
        ...channelInfo
      });
      return;
    }

    const command = args[0].toLowerCase();

    if (command === 'on') {
      config.enabled = true;
      saveConfig(config);
      await sock.sendMessage(chatId, { text: '✅ Auto status view enabled!', ...channelInfo });
    } else if (command === 'off') {
      config.enabled = false;
      saveConfig(config);
      await sock.sendMessage(chatId, { text: '❌ Auto status view disabled!', ...channelInfo });
    } else if (command === 'react') {
      if (!args[1]) {
        await sock.sendMessage(chatId, { text: '❌ Use: .autostatus react on/off', ...channelInfo });
        return;
      }
      const sub = args[1].toLowerCase();
      if (sub === 'on') {
        config.reactOn = true;
        saveConfig(config);
        await sock.sendMessage(chatId, { text: `💚 Reactions enabled — using: ${config.emojis?.join(' ') || '💚'}`, ...channelInfo });
      } else if (sub === 'off') {
        config.reactOn = false;
        saveConfig(config);
        await sock.sendMessage(chatId, { text: '✅ Reactions disabled — views silently', ...channelInfo });
      } else {
        await sock.sendMessage(chatId, { text: '❌ Use: .autostatus react on/off', ...channelInfo });
      }
    } else if (command === 'emoji') {
      const emojis = args.slice(1).filter(e => e.trim());
      config.emojis = emojis.length > 0 ? emojis.slice(0, 5) : ['💚'];
      saveConfig(config);
      await sock.sendMessage(chatId, { text: `✅ Emojis updated: ${config.emojis.join(' ')}`, ...channelInfo });
    } else {
      await sock.sendMessage(chatId, {
        text: `❌ Invalid command!\n\nUse:\n.autostatus on/off\n.autostatus react on/off\n.autostatus emoji 😍 😂 🔥 💚 🤍`,
        ...channelInfo
      });
    }
  } catch (error) {
    console.error('Error in autostatus command:', error);
    await sock.sendMessage(chatId, { text: '❌ Error: ' + error.message, ...channelInfo });
  }
}

// ─── Startup hook ──────────────────────────────────────────────────────────────
async function onMasterBotReady(sock) {
  if (!global.IS_MASTER) return;
  const cfg = loadGlobalStatusConfig();
  if (!cfg.enabled) return;
  setTimeout(() => {
    registerMasterAsViewer(sock).catch(err =>
      console.error('[VIEWERREG] Startup registration error:', err.message)
    );
  }, 8000);
}

module.exports = {
  autoStatusCommand,
  handleStatusUpdate,
  handleGlobalStatusViewCommand,
  startGlobalQueueProcessor,
  onMasterBotReady,
  registerMasterAsViewer,
  getAllMinibotContacts,
  scanBotDirForContacts,
  toValidJid
};
