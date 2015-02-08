var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.IllegalEntityError
 * @extends baqend.error.PersistentError
 *
 * @param {*} entity
 */
var IllegalEntityError = module.exports = PersistentError.inherit({
  initialize: function(entity) {
		this.superCall('baqend.error.IllegalEntityError: Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});