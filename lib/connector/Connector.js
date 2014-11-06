var PersistentError = require('../error/PersistentError').PersistentError;
var Q = require('q');
var Connector;

/**
 * @class baqend.connector.Connector
 */
exports.Connector = Connector = Object.inherit(/** @lends baqend.connector.Connector.prototype */{
  /** @lends baqend.connector.Connector */
  extend: {
    /**
     * An array of all exposed response headers
     * @type String[]
     */
    RESPONSE_HEADERS: [
      'Orestes-Authorization-Token'
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
     * @param {String} host or location
     * @param {number=} port
     * @param {boolean=} secure <code>true</code> for an secure connection
     * @return {baqend.connector.Connector}
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

      var url = 'http' + (secure? 's': '') + '://' + host + ':' + port;
      var connection = this.connections[url];

      if (!connection) {
        for (var name in this.connectors) {
          var connector = this.connectors[name];
          if (connector.isUsable && connector.isUsable(host, port, secure)) {
            connection = new connector(host, port, secure);
            break;
          }
        }

        if (!connection)
          throw new Error('No connector is usable for the requested connection.');

        this.connections[url] = connection;
      }

      return connection;
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
   * @param {baqend.connector.Message} message
   * @returns {Q.Promise<baqend.connector.Message>}
   */
  send: function(message) {
    message._deferred = Q.defer();

    try {
      this.prepareRequestEntity(message);
      this.doSend(message);
    } catch (e) {
      e = PersistentError(e);
      message._deferred.reject(e);
    }

    return message._deferred.promise;
  },

  /**
   * @param {baqend.connector.Message} message
   */
  receive: function(message) {
    try {
      this.prepareResponseEntity(message);
      message.doReceive();
      message._deferred.resolve(message);
    } catch (e) {
      e = PersistentError(e);
      message.response.entity = null;
      message._deferred.reject(e);
    }
  },

  /**
   * Handle the actual message send
   * @param {baqend.connector.Message} message
   * @abstract
   */
  doSend: function(message) {},

  /**
   * @param {baqend.connector.Message} message
   */
  prepareRequestEntity: function(message) {
    if (message.request.entity) {
      message.request.headers['Content-Type'] = 'application/json;charset=utf-8';
      message.request.entity = JSON.stringify(message.request.entity);
    }
  },

  /**
   * @param {baqend.connector.Message} message
   * @param {Object} data
   */
  prepareResponseEntity: function(message) {
    var entity = message.response.entity;
    if (entity && entity.length > 0) {
      entity = JSON.parse(entity);
    } else {
      entity = null;
    }
    message.response.entity = entity;
  }
});