var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

/**
 * @class baqend.util.Code
 * @param {baqend.metamodel.Metamodel} metamodel
 */
var Code = Object.inherit(/** @lends baqend.util.Code.prototype */ {

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type baqend.metamodel.Metamodel
   * @private
   */
  _metamodel: null,

  constructor: function Code(metamodel) {
    this._metamodel = metamodel;
  },

  /**
   * Connects this instance with the given connector
   * @param {baqend.connector.Connector} connector The connector
   */
  connected: function(connector) {
    this._connector = connector;
  },

  /**
   * Converts the given function to a string
   * @param {Function} fn The JavaScript function to serialize
   * @return {String} The serialized function
   */
  functionToString: function(fn) {
    if(!fn)
      return "";

    var str = fn.toString();
    str = str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
    if (str.charAt(0) == '\n')
      str = str.substring(1);

    if (str.charAt(str.length - 1) == '\n')
      str = str.substring(0, str.length - 1);

    return str;
  },

  /**
   * Converts the given string to a module wrapper function
   * @param {Array<String>} signature The expected parameters of the function
   * @param {String} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */
  stringToFunction: function(signature, code) {
    return new Function(signature, code);
  },

  /**
   * Loads a list of all available baqend modules
   * Does not include handlers
   *
   * @param {String} token to authenticate the user
   * @returns {Promise<Array<String>>}
   */
  loadModules: function(token) {
    var msg = new message.GetAllModules();
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function(data) {
      return data.response.entity;
    });
  },

  /**
   * Loads Baqend code which will be identified by the given bucket and code codeType
   *
   * @param {baqend.metamodel.ManagedType|String} type The entity type for the baqend handler or the Name of the
   * Baqend code
   * @param {String} codeType The type of the code
   * @param {String} token to authenticate the user
   * @param {boolean} [asFunction=false] set it to <code>true</code>, to parse the code as a function and return it
   * instead of a string
   * @returns {Promise<Function|String>} The baqend code as string or as a parsed function
   */
  loadCode: function(type, codeType, token, asFunction) {
    var bucket = String.isInstance(type)? type: type.name;
    var msg = new message.GetBaqendCode(bucket, codeType);
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function(msg) {
      return this._parseCode(bucket, codeType, asFunction, msg.response.entity);
    }.bind(this), function(e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND)
        return null;

      throw e;
    });
  },

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param {baqend.metamodel.ManagedType|String} type The entity type for the baqend handler or the Name of the
   * Baqend code
   * @param {String} codeType The type of the code
   * @param {String|Function} fn Baqend code as a string or function
   * @param {String} token to authenticate the user
   * @returns {Promise<Function|String>} The stored baqend code as a string or as a parsed function
   */
  saveCode: function(type, codeType, fn, token) {
    var bucket = String.isInstance(type)? type: type.name;
    var asFunction = Function.isInstance(fn);

    var msg = new message.SetBaqendCode(bucket, codeType, asFunction? this.functionToString(fn): fn);
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function(msg) {
      return this._parseCode(bucket, codeType, asFunction, msg.response.entity);
    }.bind(this));
  },

  /**
   * Deletes Baqend code identified by the given bucket and code type
   *
   * @param {baqend.metamodel.ManagedType|String} type The entity type for the baqend handler or the Name of the
   * Baqend code
   * @param {String} codeType The type of the code
   * @param {String} token to authenticate the user
   * @returns {Promise<void>} succeed if the code was deleted
   */
  deleteCode: function(type, codeType, token) {
    var bucket = String.isInstance(type)? type: type.name;
    var msg = new message.DeleteBaqendCode(bucket, codeType);
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function() {
      return this._parseCode(bucket, codeType, false, null);
    }.bind(this));
  },

  _parseCode: function(bucket, codeType, asFunction, code) {
    if (codeType == 'validate') {
      var type = this._metamodel.entity(bucket);
      type.validationCode = code;
      return asFunction? type.validationCode: code;
    } else {
      return asFunction? this.stringToFunction(['module', 'exports'], code): code;
    }
  }
});

module.exports = Code;
