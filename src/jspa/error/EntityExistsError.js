jspa.error.EntityExistsError = jspa.error.PersistentError.inherit({
	initialize: function(identity) {
		this.superCall('Entity ' + identity + ' exists already');
		
		this.identity = identity;
	}
});