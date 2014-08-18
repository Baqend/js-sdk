/**
 * @class jspa.message.Message
 */
exports.Message = Message = Object.inherit(
/**
 * @lends jspa.message.Message.prototype
 */
{

  /**
   * @type {Q.Deferred<jspa.message.Message>}
   */
  deferred: null,

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

  /**
   * Handle the send
   */
	doSend: function() {},

  /**
   * Handle the receive
   */
	doReceive: function() {}
});