/**
 * @class jspa.message.GetAllOids
 * @extends jspa.message.Message
 */
jspa.message.GetAllOids = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @param {jspa.metamodel.EntityType} type
     * @param {number} start
     * @param {number} count
	 */
	initialize: function(type, start, count) {
		this.superCall('get', this.createUri(type, start, count));
	},

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} type
     * @param {number} start
     * @param {number} count
     */
	createUri: function(type, start, count) {
		var uri = (type? type.identifier: '/db') + '/all_oids';
		
		if (start > 0)
			uri += ';start=' + start;
		
		if (count < Number.MAX_VALUE)
			uri += ';count=' + count;
		
		return uri;
	},
	
	doReceive: function() {
		if (this.response.statusCode == 200)
			this.oids = this.response.entity;
		else
			throw new jspa.error.CommunicationError(this);
	}
});