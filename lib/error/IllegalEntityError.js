var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class baqend.error.IllegalEntityError
 * @extends baqend.error.PersistentError
 */
exports.IllegalEntityError = IllegalEntityError = PersistentError.inherit({
  /**
   * @param {*} entity
   */
  initialize: function(entity) {
		this.superCall('baqend.error.IllegalEntityError: Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});