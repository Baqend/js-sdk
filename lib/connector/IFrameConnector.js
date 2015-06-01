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
  origin: null,
  iframe: null,
  messages: null,
  mid: 0,

  constructor: function IFrameConnector(host, port, secure) {
    Connector.call(this, host, port, secure);

    this.messages = {};
    var src = this.origin + '/connect';

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
  },

  onLoad: function() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.iframe.contentWindow.postMessage(queue[i], this.origin);
    }

    this.queue = null;
    this.setLoaded();
  },

  setLoaded: function() {
    this.iframe.setAttribute(IFrameConnector.loadedAttr, true);
  },

  isLoaded: function() {
    return !!this.iframe.getAttribute(IFrameConnector.loadedAttr);
  },

  /**
   * @inheritDoc
   */
  doSend: function(request, receive) {
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
  },

  createSocket: function() {
    return new WebSocket((this.secure ? 'wss://' : 'ws://') + this.host + ':' + this.port + '/events/');
  },

  doReceive: function(event) {
    if(event.origin !== this.origin || event.data[0] != '{') {
      return;
    }

    var msg = JSON.parse(event.data);

    var message = this.messages[msg.mid];
    delete this.messages[msg.mid];

    message.receive({
      statusCode: msg.statusCode,
      headers: msg.headers,
      entity: msg.entity
    });
  }
});

module.exports = IFrameConnector;