jspa.message.PutTransactionCommited = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.TransactionalMessage
	 * @memberOf jspa.message.PutTransactionTidCommited
	 * @param jspa.EntityTransaction transaction
	 */
	initialize: function(tid, readSet) {
		this.superCall('put', '/transaction/' + tid + '/commited', readSet);
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 200:
				this.oids = this.response.entity;
				break;
			case 412:
				throw new jspa.error.RollbackError();
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});