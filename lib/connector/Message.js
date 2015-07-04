var CommunicationError = require('../error/CommunicationError');

/**
 * @class baqend.connector.Message
 *
 * @param {String} arguments... The path arguments
 */
var Message = Object.inherit(/** @lends baqend.connector.Message.prototype */ {

  /** @lends baqend.connector.Message */
  extend: {
    /**
     * @enum {number}
     */
    StatusCode: {
      NOT_MODIFIED: 304,
      BAD_CREDENTIALS: 460,
      BUCKET_NOT_FOUND: 461,
      INVALID_PERMISSION_MODIFICATION: 462,
      INVALID_TYPE_VALUE: 463,
      OBJECT_NOT_FOUND: 404,
      OBJECT_OUT_OF_DATE: 412,
      PERMISSION_DENIED: 466,
      QUERY_DISPOSED: 467,
      QUERY_NOT_SUPPORTED: 468,
      SCHEMA_NOT_COMPATIBLE: 469,
      SCHEMA_STILL_EXISTS: 470,
      SYNTAX_ERROR: 471,
      TRANSACTION_INACTIVE: 472,
      TYPE_ALREADY_EXISTS: 473,
      TYPE_STILL_REFERENCED: 474,
      SCRIPT_ABORTION: 475
    },

    /**
     * Creates a new message class with the given message specification
     * @param {object} spec
     * @return {Function}
     */
    create: function(spec) {
      return Message.inherit({
        spec: spec
      });
    }
  },

  /**
   * Message specification
   * @type object
   */
  spec: null,

  /**
   * @type {boolean}
   */
  withCredentials: false,

  initialize: function() {
    var args = arguments;
    var index = 0;

    this.request = {
      method: this.spec.method,
      path: this.spec.params.map(function(param) {
        if (Number.isInstance(param)) {
          index++;
          return encodeURIComponent(args[param]);
        } else {
          return param;
        }
      }).join(''),
      headers: {
        'accept': 'application/json, text/*;q=0.1'
      },
      entity: args[index] || null
    };

    this.response = {
      status: 0,
      headers: {},
      entity: null
    };
  },

  setIfMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-Match'] = value;
  },

  setIfNoneMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-None-Match'] = value;
  },

  setCacheControl: function(value) {
    this.request.headers['Cache-Control'] = value;
  },

  getAuthorizationToken: function() {
    return this.response.headers['Orestes-Authorization-Token'] || this.response.headers['orestes-authorization-token'];
  },

  setAuthorizationToken: function(value) {
    this.request.headers['Authorization'] = 'BAT ' + value;
  },

  /**
   * @param {String=} value
   */
  withAuthorizationToken: function(value) {
    if(value) {
      this.setAuthorizationToken(value)
    } else {
      this.request.withCredentials = true;
    }
  },

  /**
   * Adds the given String to the request path.
   * If the parameter is an object the query string will be created.
   *
   * @param {String|Object} query which will added to the request path
   */
  addQueryString: function(query) {
    if(String.isInstance(query)) {
      this.request.path += query;
    } else if(query) {
      var sep = ~this.request.path.indexOf("?")? "&": "?";
      Object.keys(query).forEach(function(key, i) {
        this.request.path += sep + key + "=" + encodeURIComponent(query[key]);
        if(i == 0) {
          sep = "&";
        }
      }.bind(this));
    }
  },

  /**
   * Handle the receive
   */
  doReceive: function() {
    if (this.spec.status.indexOf(this.response.status) == -1) {
      throw new CommunicationError(this);
    }
  }
});

module.exports = Message;