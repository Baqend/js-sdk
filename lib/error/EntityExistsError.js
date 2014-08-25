var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class jspa.error.EntityExistsError
 * @extends jspa.error.PersistentError
 */
exports.EntityExistsError = EntityExistsError = PersistentError.inherit(/** @lends jspa.error.EntityExistsError.prototype */{
  /**
   * @param {String} entity
   */
  initialize: function(entity) {
    this.superCall('jspa.error.EntityExistsError: The entity ' + entity + ' is managed by a different db.');

    this.entity = entity;
  }
});