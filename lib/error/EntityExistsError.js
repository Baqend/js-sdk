var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class baqend.error.EntityExistsError
 * @extends baqend.error.PersistentError
 */
exports.EntityExistsError = EntityExistsError = PersistentError.inherit(/** @lends baqend.error.EntityExistsError.prototype */{
  /**
   * @param {String} entity
   */
  initialize: function(entity) {
    this.superCall('baqend.error.EntityExistsError: The entity ' + entity + ' is managed by a different db.');

    this.entity = entity;
  }
});