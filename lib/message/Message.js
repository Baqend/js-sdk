/**
 * @class baqend.message.Message
 */
exports.Message = Message = Object.inherit(/** @lends baqend.message.Message.prototype */ {

  extend: {
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
      TYPE_STILL_REFERENCED: 474
    }
  },

  /**
   * @type {Q.Deferred<baqend.message.Message>}
   */
  _deferred: null,

  /**
   * @type {boolean}
   */
  withCredentials: false,

	/**
   * @param {String} method
	 * @param {String} path
   * @param {Object} requestEntity
	 */
	initialize: function(method, path, requestEntity) {
		this.request = {
			method: method,
			path: path,
			headers: {
				'accept': 'application/json'
			},
			entity: requestEntity? requestEntity: null
		};
		
		this.response = {
			statusCode: 0,
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
   * @param {boolean|String} value
   */
  withAuthorizationToken: function(value) {
    if(value === true) {
      this.withCredentials = true;
    } else if(value) {
      this.setAuthorizationToken(value)
    }
  },

  /**
   * Handle the receive
   */
	doReceive: function() {}
});