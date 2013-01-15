jspa.error.IllegalEntityError = jspa.error.PersistentError.inherit({
	initialize: function(entity) {
		this.superCall('Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});