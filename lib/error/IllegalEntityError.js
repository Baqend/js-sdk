"use strict";

var PersistentError = require('./PersistentError');

/**
 * @alias error.IllegalEntityError
 * @extends error.PersistentError
 */
class IllegalEntityError extends PersistentError {
	/**
	 * @param {binding.Entity} entity
	 */
  constructor(entity) {
		super('Entity ' + entity + ' is not a valid entity');
		this.entity = entity;
	}
}

module.exports = IllegalEntityError;