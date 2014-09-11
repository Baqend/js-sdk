var PersistentError = require('../error/PersistentError').PersistentError;
var Q = require('q');
var Connector;

/**
 * @class jspa.connector.Connector
 */
exports.Connector = Connector = Object.inherit(/** @lends jspa.connector.Connector.prototype */{
  /** @lends jspa.connector.Connector */
  extend: {
    NETWORK_DEBUG: false,

    /**
     * Array of all available _connector implementations
     * @type jspa.connector.Connector[]
     */
    connectors: [],

    /**
     * @param {String} host or location
     * @param {number=} port
     * @param {boolean=} secure <code>true</code> for an secure connection
     * @return {jspa.connector.Connector}
     */
    create: function(host, port, secure) {
      if (!host && typeof window !== 'undefined') {
        host = window.location.hostname;
        port = Number(window.location.port);
      }

      if (host.indexOf('/') != -1) {
        var matches = /^(https?):\/\/([^\/:]*)(:(\d*))?\/?$/.exec(host);
        if (matches) {
          secure = matches[1] == 'https';
          host = matches[2];
          port = matches[4];
        } else {
          throw new Error('The connection uri host ' + host + ' seems not to be valid');
        }
      }

      if (!port)
        port = secure? 443: 80;

      for (var name in this.connectors) {
        var connector = this.connectors[name];
        if (connector.isUsable && connector.isUsable(host, port, secure)) {
          return new connector(host, port, secure);
        }
      }

      throw new Error('No connector is usable for the requested connection.');
    }
  },

  /**
   * @param {String} host
   * @param {number} port
   * @param {boolean} secure
   */
  initialize: function(host, port, secure) {
    this.host = host;
    this.port = port;
    this.secure = secure;
  },

  /**
   * @param {jspa.message.Message} message
   * @returns {Q.Promise<jspa.message.Message>}
   */
  send: function(message) {
    message._deferred = Q.defer();

    try {
      message.doSend();
      this.doSend(message);
    } catch (e) {
      e = PersistentError(e);
      message._deferred.reject(e);
    }

    return message._deferred.promise;
  },

  /**
   * @param {jspa.message.Message} message
   */
  receive: function(message) {
    try {
      message.doReceive();
      message._deferred.resolve(message);
    } catch (e) {
      e = PersistentError(e);
      message.response.entity = null;
      message._deferred.reject(e);
    } finally {
      if (Connector.NETWORK_DEBUG) {
        console.log(message.request.method + ' ' + message.request.path + '\n');
        for (var header in message.request.headers) {
          console.log(header + ': ' + message.request.headers[header] + '\n');
        }

        console.log('\n');
        console.log(JSON.stringify(message.request.entity, null, ' '));
        console.log('\n');

        console.log(message.response.statusCode + '\n');
        for (var header in message.response.headers) {
          console.log(header + ': ' + message.request.headers[header] + '\n');
        }

        console.log('\n');
        console.log(JSON.stringify(message.response.entity, null, ' '));
        console.log('\n');
      }
    }
  },

  /**
   * @param {jspa.message.Message} message
   */
  doSend: function(message) {
    throw new Error('Connector.doSend() not implemented');
  },

  /**
   * @param {jspa.message.Message} message
   */
  prepareRequestEntity: function(message) {
    if (message.request.entity) {
      message.request.headers['Content-Type'] = 'application/json;charset=utf-8';
      return JSON.stringify(message.request.entity);
    } else {
      return null;
    }
  },

  /**
   * @param {jspa.message.Message} message
   * @param {Object} data
   */
  prepareResponseEntity: function(message, data) {
    var entity = null;
    if (data && data.length > 0) {
      entity = JSON.parse(data);
    }

    message.response.entity = entity;
  }
});