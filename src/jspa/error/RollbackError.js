jspa.error.RollbackError = jspa.error.PersistentError.inherit({
	initialize: function(cause) {
		this.superCall('The transaction has been rollbacked', cause);
	}
});
