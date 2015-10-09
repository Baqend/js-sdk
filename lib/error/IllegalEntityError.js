var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.IllegalEntityError
 * @extends baqend.error.PersistentError
 *
 * @param {*} entity
 */
var IllegalEntityError = PersistentError.inherit({
  constructor: function IllegalEntityError(entity) {
		PersistentError.call(this, 'Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});

module.exports = IllegalEntityError;