'use strict';

const PersistentError = require('./PersistentError');

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

    /**
     * The entity which cause the error
     * @type {binding.Entity}
     */
    this.entity = entity;
  }
}

module.exports = IllegalEntityError;
