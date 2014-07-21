var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.DeleteObject
 * @extends jspa.message.Message
 */
exports.DeleteObject = DeleteObject = Message.inherit(
    /**
     * @lends jspa.message.DeleteObject.prototype
     */
    {
	/**
	 * @param {State} state
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
				throw new CommunicationError(this);
		}
	}
});