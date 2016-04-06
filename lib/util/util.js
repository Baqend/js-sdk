var crypto = require('crypto');
var ws = require('websocket');

exports.hmac = function(message, key) {
  return crypto.createHmac('sha1', key)
      .update(message)
      .digest('hex');
};

exports.atob = function(input) {
  return new Buffer(input, 'base64').toString('binary');
};

exports.WebSocket = ws.w3cwebsocket;