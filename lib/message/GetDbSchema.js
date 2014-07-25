var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.GetDbSchema
 * @extends jspa.message.Message
 */
exports.GetDbSchema = GetDbSchema = Message.inherit(/** @lends jspa.message.GetDbSchema.prototype */ {
	/**
	 * constructor
	 */
	initialize: function() {
		this.superCall('get', '/db/schema');
	},
	
	doReceive: function() {
		if (this.response.statusCode != 200) {
			throw new CommunicationError(this);
		}
	}
});
