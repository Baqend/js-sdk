var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityNotFoundError
 * @extends baqend.error.PersistentError
 *
 * @param {String} identity
 */
var EntityNotFoundError = PersistentError.inherit(/** @lends baqend.error.EntityNotFoundError.prototype */ {
  constructor: function EntityNotFoundError(identity) {
    PersistentError.call(this, 'Entity ' + identity + ' is not found');

    this.identity = identity;
  }
});

module.exports = EntityNotFoundError;