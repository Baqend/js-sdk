
jspa.message.PostObject = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.TransactionalMessage
	 * @memberOf jspa.message.PostObject
	 * @param {jspa.Transaction} transaction
	 * @param {jspa.util.State} state
	 */
	initialize: function(state) {
		this.superCall('post', state.type.identifier);
		
		this.state = state;
	},
	
	doSend: function() {
		this.request.entity = this.state.getDatabaseObject();
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 201:
			case 202:
				this.state.setDatabaseObjectInfo(this.response.entity['_objectInfo']);
				this.state.setPersistent();
				break;
			case 404:
				this.state.setDeleted();
				break;
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});
