/**
 * @class jspa.error.EntityExistsError
 * @extends jspa.error.PersistentError
 */
jspa.error.EntityExistsError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {String} identity
     */
    initialize: function(identity) {
		this.superCall('Entity ' + identity + ' exists already');
		
		this.identity = identity;
	}
});