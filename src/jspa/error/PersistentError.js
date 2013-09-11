/**
 * @class jspa.error.PersistentError
 * @extends Error
 */
jspa.error.PersistentError = Error.inherit({
	cause: null,
	
	extend: {
		conv: function(e) {
			if (Error.isInstance(e)) {
				return new this(null, e);
			}
		}
	},

    /**
     * @constructor
     * @param {String} message
     * @param {Error} cause
     */
	initialize: function(message, cause) {
		this.superCall(message? message: 'An unexpected persistent error occured. ' + cause? cause.message: '');
		
		if (cause) {
			this.cause = cause;
            this.stack += 'Caused By: ' + cause.message + ' ' + cause.stack;
		}
	}
});