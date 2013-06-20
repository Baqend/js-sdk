jspa.error.EntityNotFoundError = jspa.error.PersistentError.inherit({
	initialize: function(identity) {
		this.superCall('Entity ' + identity + ' is not found');
		
		this.identity = identity;
	}
});