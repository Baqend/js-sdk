"use strict";
var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

/**
 * @alias util.Code
 * @param {metamodel.Metamodel} metamodel
 */
class Code {

  constructor(metamodel, entityManagerFactory) {
    /**
     * @private
     * @type metamodel.Metamodel
     */
    this._metamodel = metamodel;
    /** @type EntityManagerFactory */
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Converts the given function to a string
   * @param {Function} fn The JavaScript function to serialize
   * @return {string} The serialized function
   */
  functionToString(fn) {
    if(!fn)
      return "";

    var str = fn.toString();
    str = str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
    if (str.charAt(0) == '\n')
      str = str.substring(1);

    if (str.charAt(str.length - 1) == '\n')
      str = str.substring(0, str.length - 1);

    return str;
  }

  /**
   * Converts the given string to a module wrapper function
   * @param {Array<string>} signature The expected parameters of the function
   * @param {string} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */
  stringToFunction(signature, code) {
    return new Function(signature, code);
  }

  /**
   * Loads a list of all available modules
   * Does not include handlers
   *
   * @returns {Promise<Array<string>>}
   */
  loadModules() {
    var msg = new message.GetAllModules();
    return this.entityManagerFactory.send(msg).then((response) => {
      return response.entity;
    });
  }

  /**
   * Loads Baqend code which will be identified by the given bucket and code codeType
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @param {boolean} [asFunction=false] set it to <code>true</code>, to parse the code as a function and return it
   * instead of a string
   * @returns {Promise<string|Function>} The code as string or as a parsed function
   */
  loadCode(type, codeType, asFunction) {
    var bucket = Object(type) instanceof String? type: type.name;
    var msg = new message.GetBaqendCode(bucket, codeType)
      .responseType('text');

    return this.entityManagerFactory.send(msg).then((response) => {
      return this._parseCode(bucket, codeType, asFunction, response.entity);
    }, function(e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND)
        return null;

      throw e;
    });
  }

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @param {string|Function} fn Baqend code as a string or function
   * @return {Promise<string|Function>} The stored code as a string or as a parsed function
   */
  saveCode(type, codeType, fn) {
    var bucket = Object(type) instanceof String? type: type.name;
    var asFunction = fn instanceof Function;

    var msg = new message.SetBaqendCode(bucket, codeType)
        .entity(asFunction? this.functionToString(fn): fn, 'text')
        .responseType('text');

    return this.entityManagerFactory.send(msg).then((response) => {
      return this._parseCode(bucket, codeType, asFunction, response.entity);
    });
  }

  /**
   * Deletes Baqend code identified by the given bucket and code type
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @returns {Promise<*>} succeed if the code was deleted
   */
  deleteCode(type, codeType) {
    var bucket = Object(type) instanceof String? type: type.name;
    var msg = new message.DeleteBaqendCode(bucket, codeType);
    return this.entityManagerFactory.send(msg).then(() => {
      return this._parseCode(bucket, codeType, false, null);
    });
  }

  _parseCode(bucket, codeType, asFunction, code) {
    if (codeType == 'validate') {
      var type = this._metamodel.entity(bucket);
      type.validationCode = code;
      return asFunction? type.validationCode: code;
    } else {
      return asFunction? this.stringToFunction(['module', 'exports'], code): code;
    }
  }
}

module.exports = Code;
