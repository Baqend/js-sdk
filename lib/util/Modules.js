"use strict";

var message = require('../message');

/**
 * @alias baqend.util.Modules
 */
class Modules {

  /**
   * @param {baqend.EntityManager} entityManager
   * @param {baqend.connector.Connector} connector
   */
  constructor(entityManager, connector) {
    /**
     * @type baqend.EntityManager
     */
    this._entityManager = entityManager;
    /**
     * The connector used for baqend requests
     * @type baqend.connector.Connector
     */
    this._connector = connector;
  }

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
  get(bucket, query, doneCallback, failCallback) {
    if(query instanceof Function) {
      failCallback = doneCallback;
      doneCallback = query;
      query = null;
    }

    var msg = new message.GetBaqendModule(bucket)
      .addQueryString(query)
      .responseType(null);

    return this._send(msg, doneCallback, failCallback);
  }

  /**
   * Calls the baqend module, which is identified by the given bucket.
   *
   * @param {String} bucket Name of the baqend module
   * @param {Object|String} body Body of the POST-request
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  post(bucket, body, doneCallback, failCallback) {
    var msg = new message.PostBaqendModule(bucket)
      .entity(body)
      .responseType(null);

    return this._send(msg, doneCallback, failCallback);
  }

  _send(msg, doneCallback, failCallback) {
    return this._entityManager.send(msg).then((response) => {
      return response.entity;
    }).then(doneCallback, failCallback);
  }
}

module.exports = Modules;
