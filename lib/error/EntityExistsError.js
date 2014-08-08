var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class jspa.error.EntityExistsError
 * @extends jspa.error.PersistentError
 */
exports.EntityExistsError = EntityExistsError = PersistentError.inherit(
    /**
     * @lends jspa.error.EntityExistsError.prototype
     */
    {
      /**
       * @param {String} identity
       */
      initialize: function (identity) {
        this.superCall('jspa.error.EntityExistsError: Entity ' + identity + ' exists already');

        this.identity = identity;
      }
    }
);