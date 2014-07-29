var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.PutDbSchemaBucket
 * @extends jspa.message.Message
 */
exports.PutDbSchemaBucket = PutDbSchemaBucket = Message.inherit(/** @lends jspa.message.PutDbSchemaBucket.prototype */ {
	/**
   * @param {String} bucketName
   * @param {Object} jsonSchema
	 */
	initialize: function(bucketName, jsonSchema) {
		this.superCall('put', '/db/schema/' + bucketName, jsonSchema);
	},

	doReceive: function() {
		if (this.response.statusCode != 200) {
			throw new CommunicationError(this);
		}
	}
});