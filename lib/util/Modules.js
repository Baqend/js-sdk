var message = require('../message');

/**
 * @class baqend.util.Modules
 */
var Modules = Object.inherit(/** @lends baqend.util.Modules.prototype */ {

  /**
   * @type baqend.EntityManager
   * @private
   */
  _entityManager: null,

  /**
   * The connector used for baqend requests
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @param {baqend.EntityManager} entityManager
   * @param {baqend.connector.Connector} connector
   */
  constructor: function Modules(entityManager, connector) {
    this._entityManager = entityManager;
    this._connector = connector;
  },

  /**
   * Calls the baqend module, which is identified by the given bucket.
   * The optional query parameter will be attached as GET-parameters.
   *
   * @param {String} bucket Name of the baqend module
   * @param {Object|String=} query GET-Parameter as key-value-pairs or query string
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  get: function(bucket, query, doneCallback, failCallback) {
    if(Function.isInstance(query)) {
      failCallback = doneCallback;
      doneCallback = query;
      query = null;
    }

    var msg = new message.GetBaqendModule(bucket);
    msg.addQueryString(query);

    return this._send(msg, doneCallback, failCallback);
  },

  /**
   * Calls the baqend module, which is identified by the given bucket.
   *
   * @param {String} bucket Name of the baqend module
   * @param {Object|String} body Body of the POST-request
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  post: function(bucket, body, doneCallback, failCallback) {
    var msg = new message.PostBaqendModule(bucket, body);

    return this._send(msg, doneCallback, failCallback);
  },

  _send: function(msg, doneCallback, failCallback) {
    return this._entityManager._send(msg).then(function(code) {
      return code.response.entity;
    }).then(doneCallback, failCallback);
  }
});

module.exports = Modules;
