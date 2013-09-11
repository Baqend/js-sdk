/**
 * @class jspa.message.PostTransaction
 * @extends jspa.message.Message
 */
jspa.message.PostTransaction = jspa.message.Message.inherit({
	/**
	 * @constructor
	 */
	initialize: function() {
		this.superCall('post', '/transaction');
		
		Object.extend(this.response.headers, {
			'location': null
		});
	},
	
	doReceive: function() {
		if (this.response.statusCode == 201) {
			this.tid = this.response.headers['location'].split('/transaction/').pop();
		} else
			throw new jspa.error.CommunicationError(this);
	}
});