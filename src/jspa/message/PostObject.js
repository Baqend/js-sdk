/**
 * @class jspa.message.PostObject
 * @extends jspa.message.Message
 */
jspa.message.PostObject = jspa.message.Message.inherit({
	/**
	 * @constructor
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
				this.state.setDatabaseObject(this.response.entity);
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
