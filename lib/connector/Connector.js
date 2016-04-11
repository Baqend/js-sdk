"use strict";
var PersistentError = require('../error/PersistentError');


/**
 * @class baqend.connector.Connector
 */
class Connector {

  /**
   * @param {String} host or location
   * @param {number=} port
   * @param {boolean=} secure <code>true</code> for an secure connection
   * @param {String} [basePath=] The basepath of the api
   * @return {baqend.connector.Connector}
   */
  static create(host, port, secure, basePath) {
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
    } else if (host != 'localhost' && /^[a-z0-9-]*$/.test(host)) {
      //handle app names as hostname
      host += secure? Connector.SSL_DOMAIN: Connector.HTTP_DOMAIN;
    }

    if (!port)
      port = secure? 443 : 80;

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
  }

  static toUri(host, port, secure, basePath) {
    var uri = (secure ? 'https://' : 'http://') + (host.indexOf(':') != -1? '[' + host + ']': host);
    uri += (secure && port != 443 || !secure && port != 80) ? ':' + port : '';
    uri += basePath;
    return uri;
  }

  /**
   * @param {String} host
   * @param {number} port
   * @param {boolean} secure
   * @param {String} basePath
   */
  constructor(host, port, secure, basePath) {
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.basePath = basePath;
    this.socket = null;
    this.listeners = {};

    //the origin do not contains the basepath
    this.origin = Connector.toUri(host, port, secure, "");
  }

  /**
   * @param {baqend.connector.Message} message
   * @returns {Promise<baqend.connector.Message>}
   */
  send(message) {
    if (message.request.method == 'OAUTH') {
      message.addRedirectOrigin(this.origin + this.basePath);
    }

    return new Promise((resolve, reject) => {
      this.prepareRequestEntity(message);
      this.doSend(message, message.request, this.receive.bind(this, message, resolve, reject));
    }).catch(function(e) {
      throw PersistentError.of(e);
    });
  }

  /**
   * @param {baqend.connector.Message} message
   * @param {Function} resolve
   * @param {Function} reject
   * @param {Object} response
   */
  receive(message, resolve, reject, response) {
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
  }

  /**
   * Handle the actual message send
   * @param {baqend.connector.Message} message
   * @param {baqend.connector.Message.request} request
   * @param {Function} receive
   * @abstract
   */
  doSend(message, request, receive) {
  }

  /**
   * Registers a handler for a topic.
   * @param {String|Object} topic
   * @param {Function} cb
   */
  subscribe(topic, cb) {
    topic = Object(topic) instanceof String? topic : JSON.stringify(topic);
    if (!this.listeners[topic]) {
      this.listeners[topic] = [cb]
    } else if (this.listeners[topic].indexOf(cb) == -1) {
      this.listeners[topic].push(cb);
    }
  }

  /**
   * Deregisters a handler.
   * @param {String|Object}  topic
   * @param {Function} cb
   */
  unsubscribe(topic, cb) {
    topic = Object(topic) instanceof String ? topic : JSON.stringify(topic);
    if (this.listeners[topic]) {
      var index = this.listeners[topic].indexOf(cb);
      if (index != -1) {
        this.listeners[topic].splice(index, 1);
      }
    }
  }

  socketListener(event) {
    var message = JSON.parse(event.data);
    var topic = message.topic;
    topic = Object(topic) instanceof String ? topic : JSON.stringify(topic);
    if(this.listeners[topic]) {
      this.listeners[topic].forEach(function(listener) {
        listener(message);
      });
    }
  }

  /**
   * Sends a websocket message over a lazily initialized websocket connection.
   * @param {Object} message
   * @param {String} message.topic
   * @param {String} message.token
   */
  sendOverSocket(message) {
    //Lazy socket initialization
    if (this.socket === null) {
      this.socket = this.createWebSocket((this.secure ? 'wss://' : 'ws://') + this.host + ':' + this.port + this.basePath + '/events');
      this.socket.onmessage = this.socketListener.bind(this);

      //Resolve Promise on connect
      this.socketOpen = new Promise((resolve, reject) => {
        this.socket.onopen = resolve;
        this.socket.onerror = reject;
      });

      //Reset socket on close
      this.socket.onclose = () => {
        this.socket = null;
        this.socketOpen = null;
      };
    }

    var jsonMessage = JSON.stringify(message);
    this.socketOpen.then(() => {
      this.socket.send(jsonMessage);
    });
  }

  /**
   * Creates a new web socket connection for the given destination
   * @param {String} destination The destination to connect to
   * @return {WebSocket} a new WebSocket instance
   * @abstract
   */
  createWebSocket(destination) {
    var WebSocket = require('../util').WebSocket;
    return new WebSocket(destination);
  }

  /**
   * @param {baqend.connector.Message} message
   */
  prepareRequestEntity(message) {
    if (message.request.entity) {
      if (Object(message.request.entity) instanceof String) {
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

    if (message.tokenStorage) {
      var token = message.tokenStorage.get(this.origin);
      if (token)
        message.request.headers['Authorization'] = 'BAT ' + token;
    }
  }

  /**
   * @param {baqend.connector.Message} message
   * @param {Object} data
   */
  prepareResponseEntity(message) {
    var entity = message.response.entity;
    if (entity && entity.length > 0) {
      var contentType = message.response.headers['Content-Type'] || message.response.headers['content-type'];
      if (contentType && contentType.indexOf("application/json") > -1) {
        entity = JSON.parse(entity);
      }

      if (message.request.path.indexOf('/connect') > -1) {
        this.gzip = !!entity.gzip;
      }
    } else {
      entity = null;
    }

    message.response.entity = entity;

    if (message.tokenStorage) {
      var headers = message.response.headers || {};
      var token = headers['Baqend-Authorization-Token'] || headers['baqend-authorization-token'];
      if (token) {
        message.tokenStorage.update(this.origin, token);
      }
    }
  }
}

Object.assign(Connector, {
  DEFAULT_BASE_PATH: '/v1',
  HTTP_DOMAIN: '.app.baqend.com',
  SSL_DOMAIN: '-bq.global.ssl.fastly.net',

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
  gzip: false
});

module.exports = Connector;