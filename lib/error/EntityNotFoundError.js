var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class baqend.error.EntityNotFoundError
 * @extends baqend.error.PersistentError
 */
exports.EntityNotFoundError = EntityNotFoundError = PersistentError.inherit(
    /**
     * @lends baqend.error.EntityNotFoundError.prototype
     */
    {
      /**
       * @param {String} identity
       */
      initialize: function (identity) {
        this.superCall('baqend.error.EntityNotFoundError: Entity ' + identity + ' is not found');

        this.identity = identity;
      }
    }
);