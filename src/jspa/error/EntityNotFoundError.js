/**
 * @class jspa.error.EntityNotFoundError
 * @extends jspa.error.PersistentError
 */
jspa.error.EntityNotFoundError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {String} identity
     */
    initialize: function(identity) {
		this.superCall('Entity ' + identity + ' is not found');
		
		this.identity = identity;
	}
});