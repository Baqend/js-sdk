"use strict";
var PersistentError = require('../error/PersistentError');
var message = require('../message');


/**
 * @alias connector.Connector
 */
class Connector {

  /**
   * @param {string} host or location
   * @param {number=} port
   * @param {boolean=} secure <code>true</code> for an secure connection
   * @param {string=} basePath The basepath of the api
   * @return {connector.Connector}
   */
  static create(host, port, secure, basePath) {
    if (typeof window !== 'undefined') {
      if (!host) {
        host = window.location.hostname;
        port = Number(window.location.port);
      }

      if (secure === undefined) {
        secure = window.location.protocol == 'https:';
      }
    }

    //ensure right type
    secure = !!secure;
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
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @param {string} basePath
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
   * @param {connector.Message} message
   * @returns {Promise<connector.Message>}
   */
  send(message) {
    if (message.request.method == 'OAUTH') {
      message.addRedirectOrigin(this.origin + this.basePath);
    }

    let response = {status: 0};
    return new Promise((resolve) => {
      this.prepareRequest(message);
      this.doSend(message, message.request, resolve);
    })
    .then((res) => response = res)
    .then(() => this.prepareResponse(message, response))
    .then(() => {
      message.doReceive(response);
      return response;
    })
    .catch((e) => {
      response.entity = null;
      throw PersistentError.of(e);
    });
  }

  /**
   * Handle the actual message send
   * @param {connector.Message} message
   * @param {Object} request
   * @param {Function} receive
   * @abstract
   */
  doSend(message, request, receive) {
  }

  /**
   * Registers a handler for a topic.
   * @param {string|Object} topic
   * @param {Function} cb
   */
  subscribe(topic, cb) {
    topic = Object(topic) instanceof String? topic : JSON.stringify(topic);
    if (!this.listeners[topic]) {
      this.listeners[topic] = [cb];
    } else if (this.listeners[topic].indexOf(cb) == -1) {
      this.listeners[topic].push(cb);
    }
  }

  /**
   * Deregisters a handler.
   * @param {string|Object} topic
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
   * @param {Object} msg
   * @param {string} msg.topic
   * @param {string} msg.token
   */
  sendOverSocket(msg) {
    //Lazy socket initialization
    if (!this.socketOpen) {
      //Resolve Promise on connect
      this.socketOpen = new Promise((resolve, reject) => {
        this.send(new message.EventsUrl()).then((response) => {
          return response.entity.urls;
        }, () => null).then((urls) => {
          let url;
          if (urls) {
            let prefix = this.secure? "wss://": "ws://";
            urls = urls.filter((url) => {
              return url.indexOf(prefix) == 0;
            });

            let len = urls.length;
            url = urls[Math.floor(Math.random() * len)];
          } else {
            url = (this.secure ? 'wss://' : 'ws://') + this.host + ':' + this.port + this.basePath + '/events'
          }

          this.socket = this.createWebSocket(url);
          this.socket.onmessage = this.socketListener.bind(this);

          this.socket.onopen = resolve;
          this.socket.onerror = reject;

          //Reset socket on close
          this.socket.onclose = () => {
            this.socket = null;
            this.socketOpen = null;
          };
        }).catch(reject);
      });
    }

    this.socketOpen.then(() => {
      var jsonMessage = JSON.stringify(msg);
      this.socket.send(jsonMessage);
    });
  }

  /**
   * Creates a new web socket connection for the given destination
   * @param {string} destination The destination to connect to
   * @return {WebSocket} a new WebSocket instance
   * @abstract
   */
  createWebSocket(destination) {
    var WebSocket = require('../util').WebSocket;

    if (!WebSocket)
      console.warn('optional websocket module is not installed, therefore realtime communication is not available.');

    return new WebSocket(destination);
  }

  /**
   * @param {connector.Message} message
   */
  prepareRequest(message) {
    let mimeType = message.mimeType();
    if (!mimeType) {
      let type = message.request.type;
      if (type == 'json') {
        message.mimeType('application/json;charset=utf-8');
      } else if (type == 'text') {
        message.mimeType('text/plain;charset=utf-8');
      }
    }

    this.toFormat(message);

    let accept;
    switch (message.responseType()) {
      case 'json':
        accept = 'application/json';
        break;
      case 'text':
        accept = 'text/*';
        break;
      default:
        accept = 'application/json,text/*;q=0.5,*/*;q=0.1';
    }

    if (!message.accept()) {
      message.accept(accept);
    }

    if (this.gzip) {
      let ifNoneMatch = message.ifNoneMatch();
      if (ifNoneMatch && ifNoneMatch !== '""' && ifNoneMatch != '*') {
        message.ifNoneMatch(ifNoneMatch.slice(0,-1) + '--gzip"');
      }
    }

    if (message.tokenStorage) {
      let token = message.tokenStorage.token;
      if (token)
        message.header('authorization', 'BAT ' + token);
    }
  }

  /**
   * Convert the message entity to the sendable representation
   * @param {connector.Message} message The message to send
   * @protected
   * @abstract
   */
  toFormat(message) {}

  /**
   * @param {connector.Message} message
   * @param {Object} response The received response headers and data
   */
  prepareResponse(message, response) {
    // IE9 returns status code 1223 instead of 204
    response.status = response.status == 1223 ? 204 : response.status;

    let type;
    let headers = response.headers || {};
    let entity = response.entity;

    if (entity) {
      type = message.responseType();
      if (!type || response.status >= 400) {
        var contentType = headers['content-type'] || headers['Content-Type'];
        if (contentType && contentType.indexOf("application/json") > -1) {
          type = 'json';
        }
      }
    }

    if (message.tokenStorage) {
      let token = headers['baqend-authorization-token'] || headers['Baqend-Authorization-Token'];
      if (token) {
        message.tokenStorage.update(token);
      }
    }

    return new Promise((resolve) => {
      resolve(entity && this.fromFormat(response, entity, type));
    }).then((entity) => {
      response.entity = entity;

      if (message.request.path.indexOf('/connect') != -1 && entity) {
        this.gzip = !!entity.gzip;
      }
    }, (e) => {
      throw new Error('Response was not valid ' + type + ': ' + e.message);
    });
  }

  /**
   * Convert received data to the requested response entity type
   * @param {Object} response The response object
   * @param {*} entity The received data
   * @param {string} type The requested response format
   * @protected
   * @abstract
   */
  fromFormat(response, entity, type) {}
}

Object.assign(Connector, /** @lends connector.Connector */ {
  DEFAULT_BASE_PATH: '/v1',
  HTTP_DOMAIN: '.app.baqend.com',
  SSL_DOMAIN: '-bq.global.ssl.fastly.net',

  /**
   * An array of all exposed response headers
   * @type string[]
   */
  RESPONSE_HEADERS: [
    'baqend-authorization-token',
    'content-type',
    'baqend-size',
    'baqend-acl',
    'etag',
    'last-modified'
  ],

  /**
   * Array of all available connector implementations
   * @type connector.Connector[]
   */
  connectors: [],

  /**
   * Array of all created connections
   * @type Object<string,connector.Connector>
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