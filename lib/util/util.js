var crypto = require('crypto');

exports.hmac = function(message, key) {
  return crypto.createHmac('sha1', key)
      .update(message)
      .digest('hex');
};

exports.atob = function(input) {
  return new Buffer(input, 'base64').toString('binary');
};

try {
  //websocket is an optional module, so it is maybe not installed
  exports.WebSocket = require('websocket').w3cwebsocket;
} catch (e) {}
