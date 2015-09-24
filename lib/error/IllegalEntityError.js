"use strict";

var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.IllegalEntityError
 * @extends baqend.error.PersistentError
 *
 * @param {*} entity
 */
class IllegalEntityError extends PersistentError {
  constructor(entity) {
		super('IllegalEntityError: Entity ' + entity + ' is not a valid entity');
		this.entity = entity;
	}
}

module.exports = IllegalEntityError;