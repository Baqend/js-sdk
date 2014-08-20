var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.PostObject
 * @extends jspa.message.Message
 */
exports.PostObject = PostObject = Message.inherit(
    /**
     * @lends jspa.message.PostObject.prototype
     */
    {
	/**
	 * @param {jspa.util.Metadata} state
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
				throw new CommunicationError(this);
		}
	}
});
