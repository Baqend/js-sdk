jspa.error.PersistentError = Error.inherit(util.Event, {
	cause: null,
	
	extend: {
		conv: function(e) {
			if (e && e.isInstanceOf(Error)) {
				return new this(null, e);
			}
		}
	},
	
	initialize: function(message, cause) {
		this.superCall(message? message: 'An unexpected persistent error occured. ' + cause? cause.message: '');
		
		if (cause) {
			this.cause = cause;
		}
		
		this.initEvent('error', true, true);
	}
});