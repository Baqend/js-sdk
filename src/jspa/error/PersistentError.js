jspa.error.PersistentError = Error.inherit(util.Event, {
	cause: null,
	
	initialize: function(message, cause) {
		this.superCall(message? message: 'An unexpected error occured.');
		
		if (cause) {
			this.cause = cause;
		}
		
		this.initEvent('error', true, true);
	}
});