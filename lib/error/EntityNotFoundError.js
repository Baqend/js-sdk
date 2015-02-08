var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityNotFoundError
 * @extends baqend.error.PersistentError
 *
 * @param {String} identity
 */
var EntityNotFoundError = module.exports = PersistentError.inherit(/** @lends baqend.error.EntityNotFoundError.prototype */ {
  initialize: function(identity) {
    this.superCall('baqend.error.EntityNotFoundError: Entity ' + identity + ' is not found');

    this.identity = identity;
  }
});