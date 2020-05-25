'use strict';

import crypto from "crypto";

/**
 * Calculates a Keyed-Hash Message Authentication Code (HMAC) from a message and a key.
 *
 * @param {string} message
 * @param {string} key
 * @return {string}
 */
export function hmac(message, key) {
  return crypto.createHmac('sha1', key)
    .update(message)
    .digest('hex');
}
