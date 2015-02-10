var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

var Code = module.exports = Object.inherit(/** @lends baqend.util.Code.prototype */ {

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type Object
   * @private
   */
  _handler: null,

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

  initialize: function() {
    this._handler = {};
    this._code = {};
  },

  /**
   * Connects this instance with the given connector
   * @param {baqend.connector.Connector} connector The connector
   */
  connected: function(connector) {
    this._connector = connector;
  },

  /**
   * Converts the given funtion to a atring
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
   * Converts the given atring to a function
   * @param {String} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */
  stringToFunction: function(code) {
    return new Function('db', code);
  },

  /**
   * Sets the handler function for the given bucket and type
   *
   * @param {String} bucket
   * @param {String} codeType (insert, update, delete)
   * @param {(Function|String)} fn will be converted to a String
   */
  setHandler: function(bucket, codeType, fn) {
    this._handler[bucket] = this._handler[bucket] || {};
    this._handler[bucket][codeType] = Function.isInstance(fn)? fn: this.stringToFunction(fn);
  },

  /**
   * Returns the handler function for the given bucket and type
   *
   * @param {String} bucket
   * @param {String} codeType (insert, update, delete)
   * @returns {Function}
   */
  getHandler: function(bucket, codeType) {
    var bucketCode = this._handler[bucket] || {};
    var code = bucketCode[codeType];
    if(code) {
      return code;
    } else {
      return null;
    }
  },

  /**
   * Removes the function of the given bucket and handler type
   *
   * @param {String} bucket
   * @param {String} codeType
   */
  removeHandler: function(bucket, codeType) {
    var bucketCode = this._handler[bucket] || {};
    delete bucketCode[codeType];
    if (Object.keys(bucketCode).length == 0) {
      delete this._handler[bucket];
    }
  },

  /**
   * Sets the Baqend code function for the given bucket name
   *
   * @param {String} bucket Name of the Baqend code
   * @param {(Function|String)} fn Function of the Baqend code which will be converted to a String
   */
  setCode: function(bucket, fn) {
    this._code[bucket] = Function.isInstance(fn)? fn: this.stringToFunction(fn);
  },

  /**
   * Returns the Baqend code function for the given bucket name
   *
   * @param {String} bucket Name of the Baqend code
   * @returns {Function}
   */
  getCode: function(bucket) {
    var code = this._code[bucket];
    if(code) {
      return code;
    } else {
      return null;
    }
  },

  /**
   * Removes the Baqend code function for the given bucket name
   *
   * @param {String} bucket Name of the Baqend code
   */
  removeCode: function(bucket) {
    delete this._code[bucket];
  },

  /**
   * Loads the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadInsert: function(type, token) {
    return this._loadHandler(type.name, 'insert', token);
  },

  /**
   * Saves the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveInsert: function(type, code, token) {
    return this._saveHandler(type.name, 'insert', code, token);
  },

  /**
   * Deletes the insert code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteInsert: function(type, token) {
    return this._deleteHandler(type.name, 'insert', token);
  },

  /**
   * Loads the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadUpdate: function(type, token) {
    return this._loadHandler(type.name, 'update', token);
  },

  /**
   * Saves the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveUpdate: function(type, code, token) {
    return this._saveHandler(type.name, 'update', code, token);
  },

  /**
   * Deletes the update code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteUpdate: function(type, token) {
    return this._deleteHandler(type.name, 'update', token);
  },

  /**
   * Loads the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadDelete: function(type, token) {
    return this._loadHandler(type.name, 'delete', token);
  },

  /**
   * Saves the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveDelete: function(type, code, token) {
    return this._saveHandler(type.name, 'delete', code, token);
  },

  /**
   * Deletes the delete code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteDelete: function(type, token) {
    return this._deleteHandler(type.name, 'delete', token);
  },

  /**
   * Loads the validation code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadValidate: function(type, token) {
    return this._loadHandler(type.name, 'validate', token).then(function() {
      type.validationCode = this.getHandler(type.name, 'validate');
      return type.validationCode;
    }.bind(this));
  },

  /**
   * Saves the validate code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveValidate: function(type, code, token) {
    return this._saveHandler(type.name, 'validate', code, token).then(function() {
      type.validationCode = this._handler[type.name]['validate'];
      return type.validationCode;
    }.bind(this));
  },

  /**
   * Deletes the validate code for the given type
   *
   * @param {baqend.metamodel.ManagedType} type
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteValidate: function(type, token) {
    return this._deleteHandler(type.name, 'validate', token).then(function() {
      type.validationCode = null;
    });
  },

  /**
   * Saves Baqend code which will be identified by the given bucket
   *
   * @param {String} bucket Name of the Baqend code
   * @param {Function} fn Baqend code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  saveCode: function(bucket, fn, token) {
    var msg = new message.SetBaqendCode(bucket, this.functionToString(fn));
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function(code) {
      return this.stringToFunction(code.response.entity);
    }.bind(this));
  },

  /**
   * Loads Baqend code for the given bucket name
   *
   * @param {String} bucket to identify the Baqend code
   * @param {String} token to authenticate the user
   * @returns {Promise<Function>}
   */
  loadCode: function(bucket, token) {
    var msg = new message.GetBaqendCode(bucket);
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function(code) {
      return this.stringToFunction(code.response.entity);
    }.bind(this), function(e) {
      if (e.statusCode == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  },

  /**
   * Deletes Baqend code for the given bucket name
   *
   * @param {String} bucket to identify the Baqend code
   * @param {String} token to authenticate the user
   * @returns {Promise}
   */
  deleteCode: function(bucket, token) {
    var msg = new message.DeleteBaqendCode(bucket);
    msg.withAuthorizationToken(token);

    return this._connector.send(msg).then(function() {
      this.setCode(bucket, "");
    }.bind(this));
  },

  /**
   * Calls the baqend code, which is identified by the given bucket.
   * The obj parameter will be used as the "this" object.
   *
   * @param {String} bucket Name of the baqend code
   * @param {Object=} obj Input of the baqend code function
   * @param {String} token to authenticate the user
   * @param {baqend.EntityManager} entityManager is needed when the code will be called locally
   * @returns {Promise<Object>}
   */
  callCode: function(bucket, obj, token, entityManager) {
    var fn = this.getCode(bucket);
    if(fn) {
      return new Promise(function(resolve) {
        resolve(fn.call(obj, entityManager));
      });
    } else {
      var msg = new message.CallBaqendCode(bucket, obj);
      msg.withAuthorizationToken(token);
      return this._connector.send(msg).then(function(code) {
        return code.response.entity;
      });
    }
  },

  /**
   * Loads a list of all available baqend codes
   * Does not include handlers
   *
   * @param {String} token to authenticate the user
   * @returns {Promise<Array<String>>}
   */
  loadResources: function(token) {
    var msg = new message.GetAllCodeResources();
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function(data) {
      return data.response.entity;
    });
  },

  _saveHandler: function(bucket, codeType, fn, token) {
    return this._saveLoadHandler(bucket, codeType, fn, token);
  },

  _loadHandler: function(bucket, codeType, token) {
    return this._saveLoadHandler(bucket, codeType, null, token);
  },

  _saveLoadHandler: function(bucket, codeType, fn, token) {
    var msg = fn === null? new message.GetBaqendHandler(bucket, codeType): new message.SetBaqendHandler(bucket, codeType, this.functionToString(fn));
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function(code) {
      this.setHandler(bucket, codeType, code.response.entity);
      return this.getHandler(bucket, codeType);
    }.bind(this), function(e) {
      if (e.statusCode == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  },

  _deleteHandler: function(bucket, codeType, token) {
    var msg = new message.DeleteBaqendHandler(bucket, codeType);
    msg.withAuthorizationToken(token);
    return this._connector.send(msg).then(function() {
      this.removeHandler(bucket, codeType);
    }.bind(this));
  }
});
