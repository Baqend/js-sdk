"use strict";
var Connector = require('./Connector');

/**
 * @class baqend.connector.IFrameConnector
 * @extends baqend.connector.Connector
 */
class IFrameConnector extends Connector {
  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {String} host
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
    var src = this.origin + this.basePath + '/connect';

    this.iframe = document.querySelector('iframe[src="'+ src + '"]');
    if (!this.iframe || this.iframe.src != src) {
      this.iframe = document.createElement('iframe');
      this.iframe.src = src;
      this.iframe.setAttribute("style", IFrameConnector.style);
      document.body.appendChild(this.iframe);
    }

    if(!this.isLoaded()) {
      this.queue = [];
      this.iframe.addEventListener('load', this.onLoad.bind(this), false);
    }

    window.addEventListener('message', this.doReceive.bind(this), false);
  }

  onLoad() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.iframe.contentWindow.postMessage(queue[i], this.origin);
    }

    this.queue = null;
    this.setLoaded();
  }

  setLoaded() {
    this.iframe.setAttribute(this.loadedAttr, true);
  }

  isLoaded() {
    return !!this.iframe.getAttribute(this.loadedAttr);
  }

  /**
   * @inheritDoc
   */
  doSend(request, receive) {
    var msg = {
      mid: ++this.mid,
      method: request.method,
      path: request.path,
      headers: request.headers,
      entity: request.entity,
      responseHeaders: Connector.RESPONSE_HEADERS
    };

    this.messages[msg.mid] = {
      request: request,
      receive: receive
    };

    msg = JSON.stringify(msg);
    if (this.queue) {
      this.queue.push(msg);
    } else {
      this.iframe.contentWindow.postMessage(msg, this.origin);
    }
  }

  /**
   * @inheritDoc
   */
  createWebSocket(destination) {
    return new WebSocket(destination);
  }

  doReceive(event) {
    if (event.origin !== this.origin || event.data[0] != '{') {
      return;
    }

    var msg = JSON.parse(event.data);

    var message = this.messages[msg.mid];
    delete this.messages[msg.mid];

    message.receive({
      status: msg.status,
      headers: msg.headers,
      entity: msg.entity
    });
  }
}

IFrameConnector.loadedAttr: 'data-loaded';
IFrameConnector.style: 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;';

Connector.connectors.push(IFrameConnector);

module.exports = IFrameConnector;