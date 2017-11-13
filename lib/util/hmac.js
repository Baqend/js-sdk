'use strict';

const crypto = require('crypto');

/**
 * @param {string} message
 * @param {string} key
 * @return {Buffer|string}
 */
exports.hmac = function hmac(message, key) {
  return crypto.createHmac('sha1', key)
    .update(message)
    .digest('hex');
};
