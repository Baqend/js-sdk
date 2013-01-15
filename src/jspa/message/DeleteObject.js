
jspa.message.DeleteObject = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.TransactionalMessage
	 * @memberOf jspa.message.DeleteObject
	 * @param {jspa.Transaction} transaction
	 * @param {jspa.util.State} state
	 */
	initialize: function(state) {
		this.superCall('delete', state.getDatabaseValue(state.model.id));
		
		this.state = state;
	},
	
	doSend: function() {
		var version = this.state.getDatabaseValue(this.state.model.version);
		if (version) {
			Object.extend(this.request.headers, {
				'if-match': version == '*'? version: '"' + version + '"'
			});
		}
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 202:
			case 204:
			case 404:
				this.state.setDeleted();
				break;
			default:
				throw new jspa.error.CommunicationError(this);
		}
	}
});