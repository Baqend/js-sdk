var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.PutDbSchema
 * @extends jspa.message.Message
 */
exports.PutDbSchema = PutDbSchema = Message.inherit(/** @lends jspa.message.PutDbSchema.prototype */ {
	/**
	 * @param {jspa.metamodel.Metamodel} metamodel
   * @param {String} types
	 */
	initialize: function(metamodel, types) {
		this.superCall('put', '/db/schema');
		this.types = types;
	},
	
	doSend: function() {
		this.request.entity = this.types;
	},
	
	doReceive: function() {
		if (this.response.statusCode != 200) {
			throw new CommunicationError(this);
		}
	}
});