var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityExistsError
 * @extends baqend.error.PersistentError
 *
 * @param {String} entity
 */
var EntityExistsError = PersistentError.inherit(/** @lends baqend.error.EntityExistsError.prototype */{
  initialize: function(entity) {
    this.superCall('baqend.error.EntityExistsError: The entity ' + entity + ' is managed by a different db.');

    this.entity = entity;
  }
});

module.exports = EntityExistsError;