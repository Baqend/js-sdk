"use strict";
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityExistsError
 * @extends baqend.error.PersistentError
 *
 * @param {String} entity
 */
class EntityExistsError extends PersistentError {
  constructor(entity) {
    super('The entity ' + entity + ' is managed by a different db.');
    this.entity = entity;
  }
}

module.exports = EntityExistsError;