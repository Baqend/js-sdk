var crypto = require('crypto');

/**
 * @param {string} message
 * @param {string} key
 * @return {Buffer|string}
 */
exports.hmac = function(message, key) {
  return crypto.createHmac('sha1', key)
      .update(message)
      .digest('hex');
};

/**
 * @param {string} input
 * @return {Buffer}
 */
exports.atob = function(input) {
  return new Buffer(input, 'base64').toString('binary');
};

exports.isNode = true;
