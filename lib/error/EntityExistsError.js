"use strict";
var PersistentError = require('./PersistentError');

/**
 * @alias error.EntityExistsError
 * @extends error.PersistentError
 */
class EntityExistsError extends PersistentError {
  /**
   * @param {string} entity
   */
  constructor(entity) {
    super('The entity ' + entity + ' is managed by a different db.');

    /**
     * The entity which cause the error
     * @type {binding.Entity}
     */
    this.entity = entity;
  }
}

module.exports = EntityExistsError;