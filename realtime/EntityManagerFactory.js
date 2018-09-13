'use strict';

const EntityManagerFactory = require('../lib/EntityManagerFactory');
const WebSocketConnector = require('./connector/WebSocketConnector');

const WS = Symbol('WebSocket');

Object.defineProperty(EntityManagerFactory.prototype, 'websocket', {
  get() {
    if (!this[WS]) {
      const secure = this.connection.secure;
      let url;
      if (this.connectData.websocket) {
        url = (secure ? 'wss:' : 'ws:') + this.connectData.websocket;
      } else {
        url = this.connection.origin.replace(/^http/, 'ws') + this.connection.basePath + '/events';
      }
      this[WS] = WebSocketConnector.create(url);
    }
    return this[WS];
  },
});

module.exports = EntityManagerFactory;
