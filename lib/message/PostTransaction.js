var Message = require('./Message').Message;
var CommunicationError = require('../error/CommunicationError').CommunicationError;

/**
 * @class jspa.message.PostTransaction
 * @extends jspa.message.Message
 */
exports.PostTransaction = PostTransaction = Message.inherit(
    /**
     * @lends jspa.message.PostTransaction.prototype
     */
    {
	/**
   * Constructs
	 */
	initialize: function() {
		this.superCall('post', '/transaction');
		
		Object.extend(this.response.headers, {
			'location': null
		});
	},
	
	doReceive: function() {
		if (this.response.statusCode == 201) {
			this.tid = this.response.headers['location'].split('/transaction/').pop();
		} else
			throw new CommunicationError(this);
	}
});