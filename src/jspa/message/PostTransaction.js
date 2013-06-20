jspa.message.PostTransaction = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.TransactionalMessage
	 * @memberOf jspa.message.PostTransaction
	 * @param jspa.EntityTransaction transaction
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