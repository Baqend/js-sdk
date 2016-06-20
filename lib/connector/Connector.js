"use strict";
var PersistentError = require('../error/PersistentError');


/**
 * @alias baqend.connector.Connector
 */
class Connector {

  /**
   * @param {string} host or location
   * @param {number=} port
   * @param {boolean=} secure <code>true</code> for an secure connection
   * @param {string=} basePath The basepath of the api
   * @return {baqend.connector.Connector}
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
    // IE9 returns status code 1223 instead of 204
    response.status = response.status == 1223 ? 204 : response.status;

    this.prepareResponseEntity(message, response).then(() => {
      message.doReceive(response);
      return response;
    }).catch((e) => {
      e = PersistentError.of(e);
      response.entity = null;
      throw e;
    }).then(resolve, reject);
  }

  /**
   * Handle the actual message send
   * @param {baqend.connector.Message} message
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
   * @param {Object} message
   * @param {string} message.topic
   * @param {string} message.token
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
   * @param {baqend.connector.Message} message
   */
  prepareRequestEntity(message) {
    var type = message.request.type;

    if (type) {
      let entity = message.request.entity;
      let mimeType = message.mimeType();

      switch (type) {
        case 'blob':
          mimeType = mimeType || entity.type;
          break;
        case 'arraybuffer':
        case 'form':
          break;
        case 'data-url':
          let match = entity.match(/^data:(.+?)(;base64)?,(.*)$/);
          let isBase64 = match[2];
          entity = match[3];

          type = 'blob';
          mimeType = mimeType || match[1];
          if (!isBase64) {
            entity = decodeURIComponent(entity);
            break;
          }

          //fallthrough
        case 'base64':
          let binaryStr = atob(entity), len = binaryStr.length;
          let array = new Uint8Array(len);
          for (let i = 0; i < len; ++i) {
            array[i] = binaryStr.charCodeAt(i);
          }
          type = 'blob';
          entity = new Blob([array], {type: mimeType});
          break;
        case 'json':
          //IE does not support the json type, therefore we handle it separately
          type = 'text';
          if (typeof entity != 'string') {
            entity = JSON.stringify(entity);
          }
          mimeType = mimeType || 'application/json;charset=utf-8';
          break;
        case 'text':
          mimeType = mimeType || 'text/plain;charset=utf-8';
          break;
      }

      message.entity(entity, type)
          .mimeType(mimeType);
    }

    let responseType;
    let accept = 'application/json,text/*;q=0.5,*/*;q=0.1';
    switch (message._responseType) {
      case 'json':
        accept = 'application/json';
        responseType = 'text';
        break;
      case 'arraybuffer':
        responseType = 'arraybuffer';
        break;
      case 'blob':
      case 'data-url':
      case 'base64':
        responseType = 'blob';
        break;
      default:
        accept = 'text/*';
        responseType = 'text';
    }

    message.response.type = responseType;
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
      var token = message.tokenStorage.get(this.origin);
      if (token)
        message.header('authorization', 'BAT ' + token);
    }
  }

  /**
   * @param {baqend.connector.Message} message
   * @param {Object} response The received response headers and data
   */
  prepareResponseEntity(message, response) {
    let type;

    return new Promise((resolve, reject) => {
      let entity = response.entity;

      if (entity) {
        type = message._responseType;
        if (!type || response.status >= 400) {
          var contentType = response.headers['content-type'] || response.headers['Content-Type'];
          if (contentType && contentType.indexOf("application/json") > -1) {
            type = 'json';
          }
        }

        if (type == 'json') {
          entity = JSON.parse(entity);
        } else if (type == 'data-url' || type == 'base64') {
          var reader = new FileReader();
          reader.readAsDataURL(entity);
          reader.onload = () => {
            var result = reader.result;

            if (type == 'base64')
              result = result.substring(result.indexOf(',') + 1);

            resolve(result);
          };
          reader.onerror = reject;
          return;
        }
      }

      resolve(entity);
    }).then((entity) => {
      response.entity = entity;

      if (message.request.path.indexOf('/connect') > -1) {
        this.gzip = !!entity.gzip;
      }

      if (message.tokenStorage) {
        var headers = response.headers || {};
        var token = headers['baqend-authorization-token'] || headers['Baqend-Authorization-Token'];
        if (token) {
          message.tokenStorage.update(this.origin, token);
        }
      }
    }, (e) => {
      throw new Error('Response was not valid ' + type + ': ' + e.message);
    });
  }
}

Object.assign(Connector, /** @lends baqend.connector.Connector */ {
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
    'baqend-acl',
    'etag',
    'last-modified'
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