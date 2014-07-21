var Message = require('./Message').Message;
var CommunicationError = require('../error').CommunicationError;

/**
 * @class jspa.message.GetObject
 * @extends jspa.message.Message
 */
exports.GetObject = GetObject = Message.inherit(
    /**
     * @lends jspa.message.GetObject.prototype
     */
    {
	/**
	 * @param {jspa.util.State} state
	 * @param {String} tid
	 */
	initialize: function(state, tid) {
		var id = state.getIdentifier();
		
		if (tid) {
			id = id.replace('/db/', '/transaction/' + tid + '/dbview/');
		}
		
		this.superCall('get', id);
		
		this.state = state;
	},
	
	doSend: function() {
		var version = this.state.getVersion();
		if (version) {			
			Object.extend(this.request.headers, {
				'cache-control': 'max-age=0, no-cache',
				'pragma': 'no-cache'
			});
			
			// we can revalidate if the object is not dirty
			if (!this.state.isDirty) {
				this.request.headers['if-none-match'] = version == '*'? version: '"' + version + '"';
			}
		}
	},
	
	doReceive: function() {
		switch (this.response.statusCode) {
			case 304:			
				break;
			case 200:
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