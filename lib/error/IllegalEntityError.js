"use strict";

var PersistentError = require('./PersistentError');

/**
 * @alias baqend.error.IllegalEntityError
 * @extends baqend.error.PersistentError
 */
class IllegalEntityError extends PersistentError {
	/**
	 * @param {baqend.binding.Entity} entity
	 */
  constructor(entity) {
		super('Entity ' + entity + ' is not a valid entity');
		this.entity = entity;
	}
}

module.exports = IllegalEntityError;