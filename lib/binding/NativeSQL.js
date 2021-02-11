'use strict';

const message = require('../message');
const StatusCode = require('../connector/Message').StatusCode;
const deprecated = require('../util/deprecated');

/**
 * Creates a NativeSQL object, which represents one specific file reference.
 * This Query object can  be used to execute sql queries directly in the underlining database
 *
 * @alias binding.NativeSQL
 */
class NativeSQL {


  /**
   * Creates a new file object which represents a file at the given id. Data which is provided to the constructor will
   */
  constructor(em) {
    this.db = em;
  }


  /**
   * Execute a native sql
   * @param {string} sql to be executed
   * @param {binding.NativeSQL~doneCallback=} doneCallback The callback is invoked after the sql executed
   * successfully
   * @param {binding.NativeSQL~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<json>} A promise which will be fulfilled when sql is successfully executed
   */
  execute(sql, doneCallback, failCallback) {

    const sqlMessage = new message.SqlQuery(sql)
        .responseType('json');
    return this.db.send(sqlMessage).then((response) => {
      //this.db.addToWhiteList(this.id);
     // this.fromHeaders(response.headers);
      //console.log(response.entity);
      //console.log(response.entity);
      return response.entity;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }

  /**
   * @param {Object<string,string>} headers
   * @return {void}
   * @private
   */
  fromHeaders(headers) {
    this.fromJSON({
      eTag: File.parseETag(headers.etag),
      lastModified: headers['last-modified'],
      createdAt: headers['baqend-created-at'],
      mimeType: headers['content-type'],
      acl: headers['baqend-acl'] && JSON.parse(headers['baqend-acl']),
      size: +headers['baqend-size'],
      headers: headers['baqend-custom-headers'] && JSON.parse(headers['baqend-custom-headers']),
    });
  }

  /**
   * The database connection to use
   * @name db
   * @type {EntityManager}
   * @memberOf NativeSQL.prototype
   * @field
   * @readonly
   */

}

/**
 * The database connection to use
 * @member NativeSQL.prototype
 */
deprecated(NativeSQL.prototype, '_db', 'db');
deprecated(NativeSQL.prototype, '_conditional', 'conditional');
deprecated(NativeSQL.prototype, '_setMetadata', 'setDataOptions');
deprecated(NativeSQL.prototype, '_checkAvailable', 'checkAvailable');


/**
 * The download callback is called, when the asynchronous download completes successfully
 * @callback binding.NativeSQL~doneCallback
 * @param {json} data The response in the requested format
 * @return {*} A Promise, result or undefined
 */


/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.NativeSQL~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {*} A Promise, result or undefined
 */

module.exports = NativeSQL;