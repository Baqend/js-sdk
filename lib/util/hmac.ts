'use strict';

import crypto from "crypto";

/**
 * Calculates a Keyed-Hash Message Authentication Code (HMAC) from a message and a key.
 *
 * @param message
 * @param key
 * @return
 */
export function hmac(message: string, key: string): Promise<string> {
  return new Promise(() => {
    return crypto.createHmac('sha1', key)
        .update(message)
        .digest('hex');
  });
}

