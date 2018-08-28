"use strict";
const PersistentError = require('../error/PersistentError');
const message = require('../message');

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
    if (typeof location !== 'undefined') {
      if (!host) {
        host = location.hostname;
        port = Number(location.port);
      }

      if (secure === undefined) {
        secure = location.protocol == 'https:';
      }
    }

    //ensure right type
    secure = !!secure;
    if (basePath === undefined)
      basePath = Connector.DEFAULT_BASE_PATH;

    if (host.indexOf('/') != -1) {
      const matches = /^(https?):\/\/([^\/:]+|\[[^\]]+])(:(\d*))?(\/\w+)?\/?$/.exec(host);
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
      host += Connector.HTTP_DOMAIN;
    }

    if (!port)
      port = secure? 443 : 80;

    const url = Connector.toUri(host, port, secure, basePath);
    let connection = this.connections[url];

    if (!connection) {
      //check last registered connector first to simplify registering connectors
      for (let i = this.connectors.length - 1; i >= 0; --i) {
        const connector = this.connectors[i];
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
    let uri = (secure ? 'https://' : 'http://') + (host.indexOf(':') != -1 ? '[' + host + ']' : host);
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
    /**
     * @type {string}
     */
    this.host = host;

    /**
     * @type {number}
     */
    this.port = port;

    /**
     * @type {boolean}
     */
    this.secure = secure;

    /**
     * @type {string}
     */
    this.basePath = basePath;

    /**
     * the origin do not contains the basepath
     * @type {string}
     */
    this.origin = Connector.toUri(host, port, secure, "");
  }

  /**
   * @param {connector.Message} message
   * @return {Promise<connector.Message>}
   */
  send(message) {
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
   * @return {*}
   * @abstract
   */
  doSend(message, request, receive) {
  }

  /**
   * @param {connector.Message} message
   * @return {void}
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

    if (message.request.path == '/connect') {
      message.request.path = message.tokenStorage.signPath(this.basePath + message.request.path)
          .substring(this.basePath.length);
      if (message.cacheControl()) {
        message.request.path += (message.tokenStorage.token? '&': '?') + 'BCB';
      }
    } else if (message.tokenStorage) {
      let token = message.tokenStorage.token;
      if (token) {
        message.header('authorization', 'BAT ' + token);
      }
    }
  }

  /**
   * Convert the message entity to the sendable representation
   * @param {connector.Message} message The message to send
   * @return {void}
   * @protected
   * @abstract
   */
  toFormat(message) {}

  /**
   * @param {connector.Message} message
   * @param {Object} response The received response headers and data
   * @return {Promise<*>}
   */
  prepareResponse(message, response) {
    // IE9 returns status code 1223 instead of 204
    response.status = response.status == 1223 ? 204 : response.status;

    let type;
    let headers = response.headers || {};
    // some proxies send content back on 204 responses
    let entity = response.status == 204? null: response.entity;

    if (entity) {
      type = message.responseType();
      if (!type || response.status >= 400) {
        const contentType = headers['content-type'] || headers['Content-Type'];
        if (contentType && contentType.indexOf("application/json") > -1) {
          type = 'json';
        }
      }
    }

    if (headers.etag) {
      headers.etag = headers.etag.replace('--gzip', '');
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
   * @return {*}
   * @protected
   * @abstract
   */
  fromFormat(response, entity, type) {}
}

Object.assign(Connector, /** @lends connector.Connector */ {
  DEFAULT_BASE_PATH: '/v1',
  HTTP_DOMAIN: '.app.baqend.com',

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
    'last-modified',
    'baqend-created-at',
    'baqend-custom-headers'
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
   * @return {boolean} gzip
   */
  gzip: false
});

module.exports = Connector;
