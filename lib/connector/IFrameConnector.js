var Connector = require('./Connector');

/**
 * @class baqend.connector.IFrameConnector
 * @extends baqend.connector.Connector
 */
var IFrameConnector = Connector.inherit(/** @lends baqend.connector.IFrameConnector.prototype */ {
  /** @lends baqend.connector.IFrameConnector */
  extend: {
    loadedAttr: 'data-loaded',
    style: 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;',

    initialize: function() {
      Connector.connectors.push(this);
    },

    /**
     * Indicates if this connector implementation is usable for the given host and port
     * @param {String} host
     * @param {number} port
     * @param {boolean} secure
     * @returns {boolean}
     */
    isUsable: function(host, port, secure) {
      return typeof window != 'undefined' &&
          (window.location.hostname != host || window.location.port != port);
    }
  },

  queue: null,
  iframe: null,
  messages: null,
  mid: 0,

  constructor: function IFrameConnector(host, port, secure, basePath) {
    Connector.call(this, host, port, secure, basePath);

    this.messages = {};
    this.doReceive = this.doReceive.bind(this);

    addEventListener('message', this.doReceive, false);
  },

  load: function(tokenStorage) {
    var path = this.basePath + '/connect';
    var src = this.origin + path;

    var token = tokenStorage? tokenStorage.createResourceToken(this.origin, path): '';
    this.iframe = document.createElement('iframe');
    this.iframe.src = src + (token? '?BAT=' + token: '');
    this.iframe.setAttribute("style", IFrameConnector.style);
    document.body.appendChild(this.iframe);

    this.queue = [];
    this.iframe.addEventListener('load', this.onLoad.bind(this), false);
  },

  onLoad: function() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.postMessage(queue[i]);
    }

    this.queue = null;
  },

  /**
   * @inheritDoc
   */
  doSend: function(message, request, receive) {
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
      setTimeout(function() {
        if (this.messages[msg.mid]) {
          delete this.messages[msg.mid];
          receive({
            status: 0,
            error: new Error('Connection refused.')
          });
        }
      }.bind(this), 10000);
    }
  },

  postMessage: function(msg) {
    this.iframe.contentWindow.postMessage(msg, this.origin);
  },

  /**
   * @inheritDoc
   */
  createWebSocket: function(destination) {
    return new WebSocket(destination);
  },

  doReceive: function(event) {
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
});

module.exports = IFrameConnector;