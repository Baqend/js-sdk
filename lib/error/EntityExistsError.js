var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityExistsError
 * @extends baqend.error.PersistentError
 *
 * @param {String} entity
 */
var EntityExistsError = PersistentError.inherit(/** @lends baqend.error.EntityExistsError.prototype */{
  constructor: function EntityExistsError(entity) {
    PersistentError.call(this, 'The entity ' + entity + ' is managed by a different db.');

    this.entity = entity;
  }
});

module.exports = EntityExistsError;