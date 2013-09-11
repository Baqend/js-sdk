/**
 * @class jspa.error.RollbackError
 * @extends jspa.error.PersistentError
 */
jspa.error.RollbackError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {Error} cause
     */
    initialize: function(cause) {
		this.superCall('The transaction has been rollbacked', cause);
	}
});
