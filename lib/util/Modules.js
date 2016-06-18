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
   * @param {Object|string=} query GET-Parameter as key-value-pairs or query string
   * @param {Object=} options Additional request options
   * @param {string} [options.responseType=] The type used to provide the response data, defaults to text oder json depends
   *    on the received data, can be one of arraybuffer, blob, json, text, base64, data-url
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  get(bucket, query, options, doneCallback, failCallback) {
    if (query instanceof Function) {
      failCallback = options;
      doneCallback = query;
      options = {};
      query = null;
    }

    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    options = options || {};

    var msg = new message.GetBaqendModule(bucket)
      .addQueryString(query)
      .responseType(options.responseType);

    return this._send(msg, doneCallback, failCallback);
  }

  /**
   * Calls the baqend module, which is identified by the given bucket.
   *
   * @param {String} bucket Name of the baqend module
   * @param body {string|Blob|File|ArrayBuffer|FormData|json=} The POST-body data to send
   * @param {Object=} options Additional request options
   * @param {string=} options.requestType A optional type hint used to correctly interpret the provided data, can be one of
   *    arraybuffer, blob, json, text, base64, data-url, form
   * @param {string=} options.mimeType The mimType of the body. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string} [options.responseType=] The type used to provide the response data, defaults to text oder json depends
   *    on the received data, can be one of arraybuffer, blob, json, text, base64, data-url
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  post(bucket, body, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    options = options || {};

    var msg = new message.PostBaqendModule(bucket)
      .entity(body, options.requestType)
      .mimeType(options.mimeType || null)
      .responseType(options.responseType);

    return this._send(msg, doneCallback, failCallback);
  }

  _send(msg, doneCallback, failCallback) {
    return this._entityManager.send(msg).then((response) => {
      return response.entity;
    }).then(doneCallback, failCallback);
  }
}

module.exports = Modules;
