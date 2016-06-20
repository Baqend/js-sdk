"use strict";
var Connector = require('./Connector');
var XMLHttpConnector = require('./XMLHttpConnector');

/**
 * @alias baqend.connector.IFrameConnector
 * @extends baqend.connector.XMLHttpConnector
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
    return typeof window != 'undefined' &&
        (window.location.hostname != host || window.location.port != port);
  }

  constructor(host, port, secure, basePath) {
    super(host, port, secure, basePath);

    this.mid = 0;
    this.messages = {};
    this.doReceive = this.doReceive.bind(this);

    addEventListener('message', this.doReceive, false);
  }

  load(tokenStorage) {
    var path = this.basePath + '/connect';
    var src = this.origin + path;

    if (tokenStorage) {
      path = tokenStorage.signPath(this.origin, path);
    }

    this.iframe = document.createElement('iframe');
    this.iframe.src = this.origin + path;
    this.iframe.setAttribute("style", IFrameConnector.style);
    document.body.appendChild(this.iframe);

    this.queue = [];
    this.iframe.addEventListener('load', this.onLoad.bind(this), false);
  }

  onLoad() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.postMessage(queue[i]);
    }

    this.queue = null;
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
    //binary data will be send and received directly
    if (message.isBinary) {
      return super.doSend(message, request, receive);
    }

    if (!this.iframe) {
      this.load(message.tokenStorage);
    }
    
    var msg = {
      mid: ++this.mid,
      method: request.method,
      path: request.path,
      headers: request.headers,
      entity: request.entity,
      responseHeaders: Connector.RESPONSE_HEADERS
    };

    this.messages[msg.mid] = receive;

    var strMsg = JSON.stringify(msg);
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
            error: new Error('Connection refused.')
          });
        }
      }, 10000);
    }
  }

  postMessage(msg) {
    this.iframe.contentWindow.postMessage(msg, this.origin);
  }

  doReceive(event) {
    if (event.origin !== this.origin || event.data[0] != '{') {
      return;
    }

    var msg = JSON.parse(event.data);

    var receive = this.messages[msg.mid];
    if (receive) {
      delete this.messages[msg.mid];
      this.connected = true;

      receive({
        status: msg.status,
        headers: msg.headers,
        entity: msg.entity
      });
    }
  }
}

IFrameConnector.style = 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;';

Connector.connectors.push(IFrameConnector);

module.exports = IFrameConnector;