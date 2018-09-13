'use strict';

const crypto = require('crypto');

/**
 * Calculates a Keyed-Hash Message Authentication Code (HMAC) from a message and a key.
 *
 * @function
 * @memberOf util.prototype
 * @param {string} message
 * @param {string} key
 * @return {string}
 */
function hmac(message, key) {
  return crypto.createHmac('sha1', key)
    .update(message)
    .digest('hex');
}

exports.hmac = hmac;
