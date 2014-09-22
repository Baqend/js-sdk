var Connector = require('./Connector').Connector;
var IFrameConnector;

/**
 * @class jspa.connector.IFrameConnector
 * @extends jspa.connector.Connector
 */
exports.IFrameConnector = IFrameConnector = Connector.inherit(/** @lends jspa.connector.IFrameConnector.prototype */ {
  /** @lends jspa.connector.IFrameConnector */
  extend: {
    id: 0,

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
  frame: null,
  messages: {},
  cid: 0,
  mid: 0,

  initialize: function(host, port, secure) {
    this.cid = ++IFrameConnector.id;
    this.queue = [];
    this.origin = 'https://' + host + ':' + port;

    var iframe = DB.connection;
    if (!iframe || iframe.src != this.origin + '/connect') {
      iframe = document.createElement('iframe');
      iframe.addEventListener('load', this.onLoad.bind(this), false);
      iframe.src = this.origin + '/connect';

      document.body.appendChild(iframe);
    }

    this.frame = iframe.contentWindow;

    window.addEventListener('message', this.doReceive.bind(this), false);
  },

  onLoad: function() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.frame.postMessage(queue[i], this.origin);
    }

    this.queue = null;
  },

  /**
   * @param {jspa.message.Message} message
   */
  doSend: function(message) {
    var msg = {
      cid: this.cid,
      mid: ++this.mid,
      method: message.request.method,
      path: message.request.path,
      headers: message.request.headers,
      entity: this.prepareRequestEntity(message),
      responseHeaders: message.response.headers
    };

    this.messages[msg.mid] = message;

    if (this.queue) {
      this.queue.push(msg);
    } else {
      this.frame.postMessage(msg, this.origin);
    }
  },

  doReceive: function(event) {
    if (event.origin !== this.origin || event.data.cid != this.cid)
      return;

    var msg = event.data;
    var message = this.messages[msg.mid];
    delete this.messages[msg.mid];

    message.response.statusCode = msg.statusCode;
    message.response.headers = msg.headers;
    this.prepareResponseEntity(message, msg.entity);

    this.receive(message);
  }
});