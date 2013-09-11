/**
 * @class jspa.message.DeleteObject
 * @extends jspa.message.Message
 */
jspa.message.DeleteObject = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.Transaction} transaction
	 * @param {jspa.util.State} state
	 */
	initialize: function(state) {
		this.superCall('delete', state.getIdentifier());

		this.state = state;
	},
	
	doSend: function() {
		this.request.entity = this.state.getDatabaseObjectInfo();
		
		var version = this.state.getVersion();
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