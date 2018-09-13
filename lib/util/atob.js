'use strict';

/**
 * Converts Base64-encoded data to string.
 *
 * @function
 * @memberOf util.prototype
 * @param {string} input Base64-encoded data.
 * @return {string} Binary-encoded data string.
 */
function atob(input) {
  return Buffer.from(input, 'base64').toString('binary');
}

exports.atob = atob;
