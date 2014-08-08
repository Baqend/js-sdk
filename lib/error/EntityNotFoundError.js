var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class jspa.error.EntityNotFoundError
 * @extends jspa.error.PersistentError
 */
exports.EntityNotFoundError = EntityNotFoundError = PersistentError.inherit(
    /**
     * @lends jspa.error.EntityNotFoundError.prototype
     */
    {
      /**
       * @param {String} identity
       */
      initialize: function (identity) {
        this.superCall('jspa.error.EntityNotFoundError: Entity ' + identity + ' is not found');

        this.identity = identity;
      }
    }
);