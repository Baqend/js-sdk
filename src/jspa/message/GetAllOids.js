jspa.message.GetAllOids = jspa.message.Message.inherit({
	/**
	 * @constructor
	 * @super jspa.message.Message
	 * @memberOf jspa.message.GetAllOids
	 * @param jspa.EntityTransaction transaction
	 */
	initialize: function(type, start, count) {
		this.superCall('get', this.createUri(type, start, count));
	},
	
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