'use strict';

/**
 * Converts Base64-encoded data to string.
 *
 * @param {string} input Base64-encoded data.
 * @return {string} Binary-encoded data string.
 */
export function atob(input) {
  return Buffer.from(input, 'base64').toString('binary');
}
