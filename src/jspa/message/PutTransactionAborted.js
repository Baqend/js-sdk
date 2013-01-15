jspa.message.PutTransactionAborted = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.TransactionalMessage
	 * @memberOf jspa.message.PutTransactionAborted
	 * @param jspa.EntityTransaction transaction
	 */
	initialize: function(tid) {
		this.superCall('put', '/transaction/' + tid + '/aborted');
	},
	
	doReceive: function() {
		if (this.response.statusCode != 202)
			throw new jspa.error.CommunicationError(this);
	}
});