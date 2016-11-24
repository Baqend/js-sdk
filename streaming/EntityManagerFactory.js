
var EntityManagerFactory = require('../lib/EntityManagerFactory');
var WebSocketConnector = require('./connector/WebSocketConnector');

Object.defineProperty(EntityManagerFactory.prototype, 'websocket', {
  get() {
    if (!this._websocket) {
      var secure = this._connector.secure;
      var url;
      if (this._connectData.websocket) {
        url = (secure? 'wss:': 'ws:') + this._connectData.websocket;
      } else {
        url = this._connector.origin.replace(/^http/, 'ws') + this._connector.basePath + '/events';
      }
      this._websocket = WebSocketConnector.create(url);
    }
    return this._websocket;
  }
});

module.exports = EntityManagerFactory;
