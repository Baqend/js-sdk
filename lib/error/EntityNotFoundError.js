"use strict";

var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityNotFoundError
 * @extends baqend.error.PersistentError
 *
 * @param {String} identity
 */
class EntityNotFoundError extends PersistentError {
  constructor(identity) {
    super('baqend.error.EntityNotFoundError: Entity ' + identity + ' is not found');

    this.identity = identity;
  }
}

module.exports = EntityNotFoundError;