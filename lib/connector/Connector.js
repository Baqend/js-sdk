var PersistentError = require('../error/PersistentError').PersistentError;
var Deferred = require('../promise').Deferred;

/**
 * @class jspa.connector.Connector
 */
exports.Connector = Connector = Object.inherit(
/**
 * @lends jspa.connector.Connector.prototype
 */
{
  /**
   * @lends jspa.connector.Connector
   */
  extend: {
    /**
     * Array of all available connector implementations
     */
    connectors: [],

    /**
     * @param {String} host
     * @param {number} port
     * @return {jspa.connector.Connector}
     */
    create: function (host, port) {
      if (!host && typeof window !== 'undefined') {
        host = window.location.hostname;
        port = Number(window.location.port);
      }

      if (host.indexOf('/') != -1) {
        var matches = /^http:\/\/([^\/:]*)(:(\d*))?\/?$/.exec(host);
        if (matches) {
          host = matches[1];
          port = matches[3];
        } else {
          throw new Error('The connection uri host ' + host + ' seems not to be valid');
        }
      }

      if (!port)
        port = 80;

      for (var name in this.connectors) {
        var connector = this.connectors[name];
        if (connector.isUsable && connector.isUsable(host, port)) {
          return new connector(host, port);
        }
      }

      throw new Error('No connector is usable for the requested connection');
    }
  },

  /**
   * @param {String} host
   * @param {number} port
   */
  initialize: function (host, port) {
    this.host = host;
    this.port = port;
  },

  /**
   * @param {*} context
   * @param {jspa.message.Message} message
   * @param {Boolean=} sync
   * @returns {jspa.Promise}
   */
  send: function (context, message, sync) {
    if (!sync) {
      message.deferred = new Deferred();
      message.context = context;
    }

    try {
      message.doSend();
      this.doSend(message);
    } catch (e) {
      e = PersistentError(e);

      if (!message.deferred) {
        throw e;
      } else {
        message.deferred.rejectWith(context, [e]);
      }
    }

    if (message.deferred)
      return message.deferred.promise();
  },

  /**
   * @param {jspa.message.Message} message
   */
  receive: function (message) {
    try {
      message.doReceive();
    } catch (e) {
      e = PersistentError(e);

      if (!message.deferred) {
        throw e;
      } else {
        message.deferred.rejectWith(message.context, [e]);
      }
    }

    if (message.deferred) {
      message.deferred.resolveWith(message.context, [message]);
    }
  },

  /**
   * @param {jspa.message.Message} message
   */
  doSend: function (message) {
    throw new Error('Connector.doSend() not implemented');
  },

  /**
   * @param {jspa.message.Message} message
   */
  prepareRequestEntity: function (message) {
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
  prepareResponseEntity: function (message, data) {
    var entity = null;
    if (data && data.length > 0) {
      entity = JSON.parse(data);
    }

    message.response.entity = entity;
  }
});