'use strict';

const isAdmin = require('./isAdmin');

/**
 * Returns true if sender is an admin in the group.
 * Normalises both boolean and object responses from isAdmin().
 */
async function getSenderAdminStatus(sock, jid, sender) {
  const check = await isAdmin(sock, jid, sender);
  return typeof check === 'boolean' ? check : (check?.isSenderAdmin ?? false);
}

/**
 * Returns true if the bot itself is an admin in the group.
 */
async function getBotAdminStatus(sock, jid) {
  const check = await isAdmin(sock, jid, sock.user.id);
  return typeof check === 'boolean' ? check : (check?.isBotAdmin ?? false);
}

module.exports = { getSenderAdminStatus, getBotAdminStatus };
