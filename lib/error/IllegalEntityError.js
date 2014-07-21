var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class jspa.error.IllegalEntityError
 * @extends jspa.error.PersistentError
 */
exports.IllegalEntityError = IllegalEntityError = PersistentError.inherit({
  /**
   * @param {*} entity
   */
  initialize: function(entity) {
		this.superCall('Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});