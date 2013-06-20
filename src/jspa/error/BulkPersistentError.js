jspa.error.BulkPersistentError = jspa.error.PersistentError.inherit({
	initialize: function(causes) {
		this.superCall('Some unexpected errors occured.');
		
		this.causes = [];
	},
	
	add: function(cause) {
		this.causes.push(cause);
	},
	
	remove: function(cause) {
		this.causes.splice(this.causes.indexOf(cause), 1);
	}
});