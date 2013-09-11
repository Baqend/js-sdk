/**
 * @class jspa.error.IllegalEntityError
 * @extends jspa.error.PersistentError
 */
jspa.error.IllegalEntityError = jspa.error.PersistentError.inherit({
    /**
     * @constructor
     * @param {*} entity
     */
    initialize: function(entity) {
		this.superCall('Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});