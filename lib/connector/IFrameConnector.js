/* this connector will only be choose in browser compatible environments */
/* eslint no-restricted-globals: ["off", "location", "addEventListener"] */

'use strict';

const Connector = require('./Connector');
const XMLHttpConnector = require('./XMLHttpConnector');

/**
 * @alias connector.IFrameConnector
 * @extends connector.XMLHttpConnector
 */
class IFrameConnector extends XMLHttpConnector {
  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @returns {boolean}
   */
  static isUsable(host, port, secure) {
    // we use location directly here, since there exists environments, which provide a location and a document but
    // no window object
    if (typeof location === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const locationSecure = location.protocol === 'https:';
    const locationPort = location.port || (locationSecure ? 443 : 80);

    return location.hostname !== host || locationPort !== port || locationSecure !== secure;
  }

  constructor(host, port, secure, basePath) {
    super(host, port, secure, basePath);

    this.mid = 0;
    this.messages = {};
    this.doReceive = this.doReceive.bind(this);

    addEventListener('message', this.doReceive, false);
  }

  load(path) {
    this.iframe = document.createElement('iframe');
    this.iframe.src = this.origin + this.basePath + path;
    this.iframe.setAttribute('style', IFrameConnector.style);
    document.body.appendChild(this.iframe);

    this.queue = [];
    this.iframe.addEventListener('load', this.onLoad.bind(this), false);
  }

  onLoad() {
    const queue = this.queue;

    for (let i = 0; i < queue.length; i += 1) {
      this.postMessage(queue[i]);
    }

    this.queue = null;
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
    // binary data will be send and received directly
    if (message.isBinary) {
      super.doSend(message, request, receive);
      return;
    }

    if (!this.iframe) {
      this.load(message.request.path);
      // ensure that we get a local resource cache hit
      message.request.path = '/connect';
    }

    const msg = {
      mid: this.mid += 1,
      method: request.method,
      path: request.path,
      headers: request.headers,
      entity: request.entity,
      responseHeaders: Connector.RESPONSE_HEADERS,
    };

    this.messages[msg.mid] = receive;

    const strMsg = JSON.stringify(msg);
    if (this.queue) {
      this.queue.push(strMsg);
    } else {
      this.postMessage(strMsg);
    }

    if (!this.connected) {
      setTimeout(() => {
        if (this.messages[msg.mid]) {
          delete this.messages[msg.mid];
          receive({
            status: 0,
            error: new Error('Connection refused.'),
          });
        }
      }, 10000);
    }
  }

  postMessage(msg) {
    this.iframe.contentWindow.postMessage(msg, this.origin);
  }

  doReceive(event) {
    if (event.origin !== this.origin || event.data[0] !== '{') {
      return;
    }

    const msg = JSON.parse(event.data);

    const receive = this.messages[msg.mid];
    if (receive) {
      delete this.messages[msg.mid];
      this.connected = true;

      receive({
        status: msg.status,
        headers: msg.headers,
        entity: msg.entity,
      });
    }
  }
}

IFrameConnector.style = 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;';

Connector.connectors.push(IFrameConnector);

module.exports = IFrameConnector;
