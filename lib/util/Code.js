'use strict';

const message = require('../message');
const StatusCode = require('../connector/Message').StatusCode;
const deprecated = require('./deprecated');

/**
 * Representation of a Code which runs on Baqend.
 *
 * @alias util.Code
 */
class Code {
  /**
   * @param {metamodel.Metamodel} metamodel
   * @param {EntityManagerFactory} entityManagerFactory
   */
  constructor(metamodel, entityManagerFactory) {
    /**
     * @type metamodel.Metamodel
     */
    this.metamodel = metamodel;
    /** @type EntityManagerFactory */
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Converts the given function to a string
   * @param {Function} fn The JavaScript function to serialize
   * @return {string} The serialized function
   */
  functionToString(fn) {
    if (!fn) {
      return '';
    }

    let str = fn.toString();
    str = str.substring(str.indexOf('{') + 1, str.lastIndexOf('}'));
    if (str.charAt(0) === '\n') {
      str = str.substring(1);
    }

    if (str.charAt(str.length - 1) === '\n') {
      str = str.substring(0, str.length - 1);
    }

    return str;
  }

  /**
   * Converts the given string to a module wrapper function
   * @param {Array<string>} signature The expected parameters of the function
   * @param {string} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */
  stringToFunction(signature, code) {
    return new Function(signature, code); // eslint-disable-line no-new-func
  }

  /**
   * Loads a list of all available modules
   * Does not include handlers
   *
   * @return {Promise<Array<string>>}
   */
  loadModules() {
    const msg = new message.GetAllModules();
    return this.entityManagerFactory.send(msg)
      .then(response => response.entity);
  }

  /**
   * Loads Baqend code which will be identified by the given bucket and code codeType
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @param {boolean} [asFunction=false] set it to <code>true</code>, to parse the code as a function and return it
   * instead of a string
   * @return {Promise<string|Function>} The code as string or as a parsed function
   */
  loadCode(type, codeType, asFunction) {
    const bucket = Object(type) instanceof String ? type : type.name;
    const msg = new message.GetBaqendCode(bucket, codeType)
      .responseType('text');

    return this.entityManagerFactory.send(msg)
      .then(response => this.parseCode(bucket, codeType, asFunction, response.entity), (e) => {
        if (e.status === StatusCode.OBJECT_NOT_FOUND) {
          return null;
        }

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
    const bucket = Object(type) instanceof String ? type : type.name;
    const asFunction = fn instanceof Function;

    const msg = new message.SetBaqendCode(bucket, codeType)
      .entity(asFunction ? this.functionToString(fn) : fn, 'text')
      .responseType('text');

    return this.entityManagerFactory.send(msg)
      .then(response => this.parseCode(bucket, codeType, asFunction, response.entity));
  }

  /**
   * Deletes Baqend code identified by the given bucket and code type
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @return {Promise<*>} succeed if the code was deleted
   */
  deleteCode(type, codeType) {
    const bucket = Object(type) instanceof String ? type : type.name;
    const msg = new message.DeleteBaqendCode(bucket, codeType);
    return this.entityManagerFactory.send(msg)
      .then(() => this.parseCode(bucket, codeType, false, null));
  }

  parseCode(bucket, codeType, asFunction, code) {
    if (codeType === 'validate') {
      const type = this.metamodel.entity(bucket);
      type.validationCode = code;
      return asFunction ? type.validationCode : code;
    }

    return asFunction ? this.stringToFunction(['module', 'exports'], code) : code;
  }
}

deprecated(Code.prototype, '_metamodel', 'metamodel');
deprecated(Code.prototype, '_parseCode', 'parseCode');

module.exports = Code;
