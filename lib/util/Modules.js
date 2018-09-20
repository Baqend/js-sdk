'use strict';

const message = require('../message');
const deprecated = require('./deprecated');

/**
 * An executor of Modules running on Baqend.
 *
 * @alias util.Modules
 */
class Modules {
  /**
   * @param {EntityManager} entityManager
   */
  constructor(entityManager) {
    /**
     * @type EntityManager
     */
    this.entityManager = entityManager;
  }

  /**
   * Calls the module, which is identified by the given bucket
   *
   * The optional query parameter will be attached as GET-parameters.
   *
   * @param {string} bucket Name of the module
   * @param {Object<string, string>|string} [query] GET-Parameter as key-value-pairs or query string
   * @param {Object=} options Additional request options
   * @param {string=} options.responseType The type used to provide the response data, defaults to text oder json
   * depends on the received data, can be one of arraybuffer, blob, json, text, base64, data-url
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @return {Promise<*>}
   */
  get(bucket, query, options, doneCallback, failCallback) {
    if (query instanceof Function) {
      return this.get(bucket, {}, query, options, doneCallback);
    }

    if (options instanceof Function) {
      return this.get(bucket, query, {}, options, doneCallback);
    }

    const opt = options || {};

    const msg = new message.GetBaqendModule(bucket)
      .addQueryString(query)
      .responseType(opt.responseType || null);

    return this.send(msg, doneCallback, failCallback);
  }

  /**
   * Calls the module, which is identified by the given bucket
   *
   * @param {string} bucket Name of the module
   * @param {string|Blob|File|ArrayBuffer|FormData|json} [body] The POST-body data to send
   * @param {Object=} options Additional request options
   * @param {string=} options.requestType A optional type hint used to correctly interpret the provided data, can be one
   * of arraybuffer, blob, json, text, base64, data-url, form
   * @param {string=} options.mimeType The mimType of the body. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} options.responseType The type used to provide the response data, defaults to text oder json
   * depends on the received data, can be one of arraybuffer, blob, json, text, base64, data-url
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @return {Promise<*>}
   */
  post(bucket, body, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.post(bucket, body, {}, options, doneCallback);
    }

    const opt = options || {};

    const msg = new message.PostBaqendModule(bucket)
      .entity(body, opt.requestType)
      .mimeType(opt.mimeType || null)
      .responseType(opt.responseType || null);

    return this.send(msg, doneCallback, failCallback);
  }

  send(msg, doneCallback, failCallback) {
    return this.entityManager.send(msg)
      .then(response => response.entity)
      .then(doneCallback, failCallback);
  }
}

deprecated(Modules.prototype, '_entityManager', 'entityManager');
deprecated(Modules.prototype, '_send', 'send');

module.exports = Modules;
