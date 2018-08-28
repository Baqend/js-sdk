var crypto = require('crypto');

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

/**
 * @param {string} input
 * @return {Buffer}
 */
exports.atob = function(input) {
  return new Buffer(input, 'base64').toString('binary');
};

exports.hmac = hmac;
exports.isNode = true;
