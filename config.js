require('dotenv').config();

global.APIs = {
    xteam: 'https://api.xteam.xyz',
    dzx: 'https://api.dhamzxploit.my.id',
    lol: 'https://api.lolhuman.xyz',
    violetics: 'https://violetics.pw',
    neoxr: 'https://api.neoxr.my.id',
    zenzapis: 'https://zenzapis.xyz',
    akuari: 'https://api.akuari.my.id',
    akuari2: 'https://apimu.my.id',
    nrtm: 'https://fg-nrtm.ddns.net',
    bg: 'http://bochil.ddns.net',
    fgmods: 'https://api-fgmods.ddns.net'
};

global.APIKeys = {
    'https://api.xteam.xyz': 'd90a9e986e18778b',
    'https://api.lolhuman.xyz': '85faf717d0545d14074659ad',
    'https://api.neoxr.my.id': 'yourkey',
    'https://violetics.pw': 'beta',
    'https://zenzapis.xyz': 'yourkey',
    'https://api-fgmods.ddns.net': 'fg-dylux'
};

module.exports = {
    // ─── Existing ─────────────────────────────────────────────────────────────
    APIs:    global.APIs,
    APIKeys: global.APIKeys,

    // ─── Antibot ──────────────────────────────────────────────────────────────
    WARN_COUNT:             3,     // kicks after this many warns
    BOT_SCORE_THRESHOLD:    5,     // minimum score to trigger antibot action
    RATE_WINDOW_MS:         5000,  // time window for rate surge check (ms)
    RATE_MSG_THRESHOLD:     4,     // messages within window to count as surge
    TYPING_GRACE_MS:        8000,  // how long after typing event a message is trusted (ms)
    FAST_EDIT_THRESHOLD_MS: 1500,  // edit within this time of send = suspicious (ms)
    LONG_MSG_THRESHOLD:     300,   // min chars for long-quoted-no-typing check
};
