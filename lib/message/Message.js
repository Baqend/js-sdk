/**
 * @class jspa.message.Message
 */
exports.Message = Message = Object.inherit(/** @lends jspa.message.Message.prototype */ {

  /**
   * @type {Q.Deferred<jspa.message.Message>}
   */
  _deferred: null,

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

  /**
   * Handle the send
   */
	doSend: function() {},

  /**
   * Handle the receive
   */
	doReceive: function() {}
});