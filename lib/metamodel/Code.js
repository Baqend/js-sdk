/**
 * Created by hannes on 27.10.14.
 */

var message = require('../message');

var Code;

exports.Code = Code = Object.inherit(/** @lends baqend.metamodel.Metamodel.prototype */ {

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type Object
   * @private
   */
  _code: null,

  /**
   * @type Boolean
   * @private
   */
  _isLoaded: false,

  /**
   * @param {baqend.connector.Connector} connector
   */
  initialize: function(connector) {
    this._code = {};
    this._connector = connector;
  },

  _toString: function(fn) {
    fn = fn.toString();
    return fn.slice(fn.indexOf("{") + 1, fn.lastIndexOf("}"));
  },

  _fromString: function(code) {
    return new Function('db', code);
  },

  /**
   * Sets the given function for bucket and code type
   *
   * @param {String} bucket
   * @param {String} codeType (insert, update, delete)
   * @param {(Function|String)} fn will be converted to a String
   */
  setCode: function(bucket, codeType, fn) {
    this._code[bucket] = this._code[bucket] || {};
    this._code[bucket][codeType] = String.isInstance(fn)? fn: this._toString(fn);
  },

  /**
   * Returns the function for the given bucket and code type
   *
   * @param {String} bucket
   * @param {String} codeType (insert, update, delete)
   * @returns {Function}
   */
  getCode: function(bucket, codeType) {
    var bucketCode = this._code[bucket] || {};
    var code = bucketCode[codeType];
    if(code) {
      return this._fromString(code);
    } else {
      return null;
    }
  },

  /**
   * Removes the function for the given bucket and code type
   *
   * @param {String} bucket
   * @param {String} codeType
   */
  removeCode: function(bucket, codeType) {
    var bucketCode = this._code[bucket] || {};
    delete bucketCode[codeType];
  },

  /**
   * Loads the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  loadInsert: function(type, token) {
    return this._load(type.name, 'insert', token);
  },

  /**
   * Saves the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  saveInsert: function(type, code, token) {
    return this._save(type.name, 'insert', code, token);
  },

  /**
   * Deletes the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise}
   */
  deleteInsert: function(type, token) {
    return this._delete(type.name, 'insert', token);
  },

  /**
   * Loads the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  loadUpdate: function(type, token) {
    return this._load(type.name, 'update', token);
  },

  /**
   * Saves the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  saveUpdate: function(type, code, token) {
    return this._save(type.name, 'update', code, token);
  },

  /**
   * Deletes the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise}
   */
  deleteUpdate: function(type, token) {
    return this._delete(type.name, 'update', token);
  },

  /**
   * Loads the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  loadDelete: function(type, token) {
    return this._load(type.name, 'delete', token);
  },

  /**
   * Saves the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  saveDelete: function(type, code, token) {
    return this._save(type.name, 'delete', code, token);
  },

  /**
   * Deletes the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise}
   */
  deleteDelete: function(type, token) {
    return this._delete(type.name, 'delete', token);
  },

  /**
   * Loads the validation code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  loadValidate: function(type, token) {
    return this._load(type.name, 'validate', token).then(function() {
      type.validationCode = this._code[type.name]['validate'];
      return type.validationCode;
    }.bind(this));
  },

  /**
   * Saves the validate code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Q.Promise<Function>}
   */
  saveValidate: function(type, code, token) {
    return this._save(type.name, 'validate', code, token).then(function() {
      type.validationCode = this._code[type.name]['validate'];
      return type.validationCode;
    }.bind(this));
  },

  /**
   * Deletes the validate code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Q.Promise}
   */
  deleteValidate: function(type, token) {
    return this._delete(type.name, 'validate', token).then(function() {
      type.validationCode = null;
    });
  },

  _save: function(bucket, codeType, fn, token) {
    return this._saveLoad(bucket, codeType, fn, token);
  },

  _load: function(bucket, codeType, token) {
    return this._saveLoad(bucket, codeType, null, token);
  },

  _saveLoad: function(bucket, codeType, fn, token) {
    var msg = fn === null? new message.GetBaqendCode(bucket, codeType): new message.SetBaqendCode(bucket, codeType, this._toString(fn));
    msg.withAuthorizationToken(token || true);
    return this._connector.send(msg).then(function(code) {
      this.setCode(bucket, codeType, code.response.entity);
    }.bind(this));
  },

  _delete: function(bucket, codeType, token) {
    var msg = new message.DeleteBaqendCode(bucket, codeType);
    msg.withAuthorizationToken(token || true);
    return this._connector.send(msg).then(function() {
      this.removeCode(bucket, codeType);
    }.bind(this));
  }
});
