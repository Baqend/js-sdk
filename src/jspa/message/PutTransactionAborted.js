/**
 * @class jspa.message.PutTransactionAborted
 * @extends jspa.message.Message
 */
jspa.message.PutTransactionAborted = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {String} tid
	 */
	initialize: function(tid) {
		this.superCall('put', '/transaction/' + tid + '/aborted');
	},
	
	doReceive: function() {
		if (this.response.statusCode != 202)
			throw new jspa.error.CommunicationError(this);
	}
});