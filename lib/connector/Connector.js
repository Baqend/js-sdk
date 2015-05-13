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
    /**
     * An array of all exposed response headers
     * @type String[]
     */
    RESPONSE_HEADERS: [
      'Orestes-Authorization-Token',
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
     * @param {String} host or location
     * @param {number=} port
     * @param {boolean=} secure <code>true</code> for an secure connection
     * @return {baqend.connector.Connector}
     */
    create: function(host, port, secure) {
      if (!host && typeof window !== 'undefined') {
        host = window.location.hostname;
        port = Number(window.location.port);
        secure = window.location.protocol == 'https:';
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

  constructor: function Connector(host, port, secure) {
    this.host = host;
    this.port = port;
    this.secure = secure;

    this.origin = (secure? 'https://': 'http://') + host;
    this.origin += (secure && port != 443 || !secure && port != 80)? ':' + port: '';
  },

  /**
   * @param {baqend.connector.Message} message
   * @returns {Promise<baqend.connector.Message>}
   */
  send: function(message) {
    return new Promise(function(resolve, reject) {
      this.prepareRequestEntity(message);
      this.doSend(message.request, this.receive.bind(this, message, resolve, reject));
    }.bind(this)).catch(function(e) {
      throw PersistentError(e);
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
      message.response.statusCode = message.response.statusCode == 1223? 204: message.response.statusCode;

      this.prepareResponseEntity(message);
      message.doReceive();
      resolve(message);
    } catch (e) {
      e = PersistentError(e);
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
  doSend: function(message, receive) {},

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
      var contentType = message.response.headers['Content-Type'] || message.response.headers['content-type'];
      if(contentType && contentType.indexOf("application/json") > -1) {
        entity = JSON.parse(entity);
      }
    } else {
      entity = null;
    }
    message.response.entity = entity;
  }
});

module.exports = Connector;