var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class jspa.error.RollbackError
 * @extends jspa.error.PersistentError
 */
exports.RollbackError = RollbackError = PersistentError.inherit(
/**
 * @lends jspa.error.RollbackError
 */
{
  /**
   * @param {Error} cause
   */
  initialize: function(cause) {
		this.superCall('The transaction has been rollbacked', cause);
	}
});
