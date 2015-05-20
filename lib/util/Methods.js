var message = require('../message');

/**
 * @class baqend.util.Methods
 */
var Methods = Object.inherit(/** @lends baqend.util.Methods.prototype */ {

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
  constructor: function Methods(entityManager, connector) {
    this._entityManager = entityManager;
    this._connector = connector;
  },

  /**
   * Calls the baqend code, which is identified by the given bucket.
   * The optional query parameter will be attached as GET-parameters.
   *
   * @param {String} bucket bucket Name of the baqend code
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

    var msg = new message.GetBaqendMethod(bucket);
    msg.addQueryString(query);

    return this._send(msg, doneCallback, failCallback);
  },

  /**
   * Calls the baqend code, which is identified by the given bucket.
   *
   * @param {String} bucket bucket Name of the baqend code
   * @param {Object|String} body Body of the POST-request
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  post: function(bucket, body, doneCallback, failCallback) {
    var msg = new message.PostBaqendMethod(bucket, body);

    return this._send(msg, doneCallback, failCallback);
  },

  _send: function(msg, doneCallback, failCallback) {
    msg.withAuthorizationToken(this._entityManager.token);

    return this._connector.send(msg).then(function(code) {
      return code.response.entity;
    }).then(doneCallback, failCallback);
  }

});

module.exports = Methods;
