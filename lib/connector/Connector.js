var PersistentError = require('../error/PersistentError');


/**
 * @class baqend.connector.Connector
 *
 * @param {String} host
 * @param {number} port
 * @param {boolean} secure
 */
var Connector = Object.inherit(/** @lends baqend.connector.Connector.prototype */{
  /** @lends baqend.connector.Connector */
  extend: {
    DEFAULT_BASE_PATH: '/v1',

    /**
     * An array of all exposed response headers
     * @type String[]
     */
    RESPONSE_HEADERS: [
      'Baqend-Authorization-Token',
      'Content-Type'
    ],

    /**
     * Array of all available connector implementations
     * @type baqend.connector.Connector[]
     */
    connectors: [],

    /**
     * Array of all created connections
     * @type Object<string,baqend.connector.Connector>
     */
    connections: {},

    /**
     * The connector will detect if gzip is supports.
     * Returns true if supported otherwise false.
     * @returns {boolean} gzip
     */
    gzip: false,

    /**
     * @param {String} host or location
     * @param {number=} port
     * @param {boolean=} secure <code>true</code> for an secure connection
     * @param {String} [basePath=] The basepath of the api
     * @return {baqend.connector.Connector}
     */
    create: function(host, port, secure, basePath) {
      if (!host && typeof window !== 'undefined') {
        host = window.location.hostname;
        port = Number(window.location.port);
        secure = window.location.protocol == 'https:';
      }

      if (basePath === undefined)
        basePath = Connector.DEFAULT_BASE_PATH;

      if (host.indexOf('/') != -1) {
        var matches = /^(https?):\/\/([^\/:]+|\[[^\]]+])(:(\d*))?(\/\w+)?\/?$/.exec(host);
        if (matches) {
          secure = matches[1] == 'https';
          host = matches[2].replace(/(\[|])/g, '');
          port = matches[4];
          basePath = matches[5] || '';
        } else {
          throw new Error('The connection uri host ' + host + ' seems not to be valid');
        }
      }

      if (!port)
        port = secure ? 443 : 80;

      var url = Connector.toUri(host, port, secure, basePath);
      var connection = this.connections[url];

      if (!connection) {
        for (var name in this.connectors) {
          var connector = this.connectors[name];
          if (connector.isUsable && connector.isUsable(host, port, secure, basePath)) {
            connection = new connector(host, port, secure, basePath);
            break;
          }
        }

        if (!connection)
          throw new Error('No connector is usable for the requested connection.');

        this.connections[url] = connection;
      }

      return connection;
    },

    toUri: function(host, port, secure, basePath) {
      var uri = (secure ? 'https://' : 'http://') + (host.indexOf(':') != -1? '[' + host + ']': host);
      uri += (secure && port != 443 || !secure && port != 80) ? ':' + port : '';
      uri += basePath;
      return uri;
    }
  },

  constructor: function Connector(host, port, secure, basePath) {
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.basePath = basePath;
    this.socket = null;
    this.listeners = {};

    //the origin do not contains the basepath
    this.origin = Connector.toUri(host, port, secure, "");
  },

  /**
   * @param {baqend.connector.Message} message
   * @returns {Promise<baqend.connector.Message>}
   */
  send: function(message) {
    if (message.request.method == 'OAUTH') {
      message.addRedirectOrigin(this.origin + this.basePath);
    }

    return new Promise(function(resolve, reject) {
      this.prepareRequestEntity(message);
      this.doSend(message.request, this.receive.bind(this, message, resolve, reject));
    }.bind(this)).catch(function(e) {
      throw PersistentError.of(e);
    });
  },

  /**
   * @param {baqend.connector.Message} message
   * @param {Function} resolve
   * @param {Function} reject
   * @param {Object} response
   */
  receive: function(message, resolve, reject, response) {
    message.response = response;
    try {
      // IE9 returns status code 1223 instead of 204
      message.response.status = message.response.status == 1223 ? 204 : message.response.status;

      this.prepareResponseEntity(message);
      message.doReceive();
      resolve(message);
    } catch (e) {
      e = PersistentError.of(e);
      message.response.entity = null;
      reject(e);
    }
  },

  /**
   * Handle the actual message send
   * @param {baqend.connector.Message} message
   * @param {Function} receive
   * @abstract
   */
  doSend: function(message, receive) {
  },

  /**
   * Registers a handler for a topic.
   * @param {String|Object} topic
   * @param {Function} cb
   */
  subscribe: function(topic, cb) {
    topic = String.isInstance(topic) ? topic : JSON.stringify(topic);
    if (!this.listeners[topic]) {
      this.listeners[topic] = [cb]
    } else if (this.listeners[topic].indexOf(cb) == -1) {
      this.listeners[topic].push(cb);
    }
  },

  /**
   * Deregisters a handler.
   * @param {String|Object}  topic
   * @param {Function} cb
   */
  unsubscribe: function(topic, cb) {
    topic = String.isInstance(topic) ? topic : JSON.stringify(topic);
    if (this.listeners[topic]) {
      var index = this.listeners[topic].indexOf(cb);
      if (index != -1) {
        this.listeners[topic].splice(index, 1);
      }
    }
  },

  socketListener: function(event) {
    var message = JSON.parse(event.data);
    var topic = message.topic;
    topic = String.isInstance(topic) ? topic : JSON.stringify(topic);
    if(this.listeners[topic]) {
      this.listeners[topic].forEach(function(listener) {
        listener(message);
      });
    }
  },

  socketOpen: null,

  /**
   * Sends a websocket message over a lazily initialized websocket connection.
   * @param {Object} message
   * @param {String} message.topic
   * @param {String} message.token
   */
  sendOverSocket: function(message) {
    //Lazy socket initialization
    if (this.socket === null) {
      this.socket = this.createWebSocket((this.secure ? 'wss://' : 'ws://') + this.host + ':' + this.port + this.basePath + '/events');
      this.socket.onmessage = this.socketListener.bind(this);

      //Resolve Promise on connect
      this.socketOpen = new Promise(function(resolve, reject) {
        this.socket.onopen = resolve;
        this.socket.onerror = reject;
      }.bind(this));

      //Reset socket on close
      this.socket.onclose = function() {
        this.socket = null;
        this.socketOpen = null;
      }.bind(this);
    }

    var jsonMessage = JSON.stringify(message);
    this.socketOpen.then(function() {
      this.socket.send(jsonMessage);
    }.bind(this));
  },

  /**
   * Creates a new web socket connection for the given destination
   * @param {String} destination The destination to connect to
   * @return {WebSocket} a new WebSocket instance
   * @abstract
   */
  createWebSocket: function(destination) {},

  /**
   * @param {baqend.connector.Message} message
   */
  prepareRequestEntity: function(message) {
    if (message.request.entity) {
      if (String.isInstance(message.request.entity)) {
        message.request.headers['Content-Type'] = 'text/plain;charset=utf-8';
      } else {
        message.request.headers['Content-Type'] = 'application/json;charset=utf-8';
        message.request.entity = JSON.stringify(message.request.entity);
      }
    }

    if (this.gzip) {
      if(message.request.headers['If-None-Match'] && message.request.headers['If-None-Match'] != '*') {
        message.request.headers['If-None-Match'] = message.request.headers['If-None-Match'].slice(0,-1) + '--gzip"'
      }
    }
  },

  /**
   * @param {baqend.connector.Message} message
   * @param {Object} data
   */
  prepareResponseEntity: function(message) {
    var entity = message.response.entity;
    if (entity && entity.length > 0) {
      var contentType = message.response.headers['Content-Type'] || message.response.headers['content-type'];
      if (contentType && contentType.indexOf("application/json") > -1) {
        entity = JSON.parse(entity);
      }
    } else {
      entity = null;
    }

    if (message.request.path.indexOf('/connect') > -1) {
      this.gzip = !!entity.gzip;
    }

    message.response.entity = entity;
  }
});

module.exports = Connector;