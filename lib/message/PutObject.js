var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.PutObject
 * @extends jspa.message.Message
 */
exports.PutObject = PutObject = Message.inherit(
    /**
     * @lends jspa.message.PutObject.prototype
     */
    {
	/**
	 * @param {jspa.util.Metadata} state
	 */
	initialize: function(state) {
		this.superCall('put', state.getIdentifier());
		
		this.state = state;
	},
	
	doSend: function() {
		var version = this.state.getVersion();
		
		Object.extend(this.request.headers, {
			'if-match': !version || version == '*'? '*': '"' + version + '"'
		});
		
		this.request.entity = this.state.getDatabaseObject();
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 200:
				this.state.setDatabaseObject(this.response.entity);
				//mark as persistent in next case
			case 202:
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