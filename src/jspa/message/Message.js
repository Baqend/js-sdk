/**
 * @class jspa.message.Message
 */
jspa.message.Message = Object.inherit({
	/**
	 * @constructor
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
	
	doSend: function() {
	},
	
	doReceive: function() {
	}
});