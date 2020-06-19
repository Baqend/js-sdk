'use strict';

import { EntityManagerFactory } from "../lib";
import { WebSocketConnector } from "./connector";

const WS = Symbol('WebSocket');

Object.defineProperty(EntityManagerFactory.prototype, 'websocket', {
  get(this: EntityManagerFactory) {
    if (!this[WS]) {
      const secure = this.connection!.secure;
      let url;
      if (this.connectData!.websocket) {
        url = (secure ? 'wss:' : 'ws:') + this.connectData!.websocket;
      } else {
        url = this.connection!.origin.replace(/^http/, 'ws') + this.connection!.basePath + '/events';
      }
      this[WS] = WebSocketConnector.create(url);
    }
    return this[WS];
  },
});

export { EntityManagerFactory };
