"use strict";
var PersistentError = require('./PersistentError');

/**
 * @alias baqend.error.EntityExistsError
 * @extends baqend.error.PersistentError
 */
class EntityExistsError extends PersistentError {
  /**
   * @param {string} entity
   */
  constructor(entity) {
    super('The entity ' + entity + ' is managed by a different db.');
    this.entity = entity;
  }
}

module.exports = EntityExistsError;