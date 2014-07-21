var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.PutTransactionAborted
 * @extends jspa.message.Message
 */
exports.PutTransactionAborted = PutTransactionAborted = Message.inherit(
    /**
     * @lends jspa.message.PutTransactionAborted.prototype
     */
    {
	/**
	 * @param {String} tid
	 */
	initialize: function(tid) {
		this.superCall('put', '/transaction/' + tid + '/aborted');
	},
	
	doReceive: function() {
		if (this.response.statusCode != 202)
			throw new CommunicationError(this);
	}
});