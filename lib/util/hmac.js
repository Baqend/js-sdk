var crypto = require('crypto');

module.exports = function(message, key) {
  return crypto.createHmac('sha1', key)
      .update(message)
      .digest('hex');
};