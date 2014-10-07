var PersistentError = require('./PersistentError').PersistentError;

/**
 * @class baqend.error.RollbackError
 * @extends baqend.error.PersistentError
 */
exports.RollbackError = RollbackError = PersistentError.inherit(
/**
 * @lends baqend.error.RollbackError
 */
{
  /**
   * @param {Error} cause
   */
  initialize: function(cause) {
		this.superCall('baqend.error.RollbackError: The transaction has been rollbacked', cause);
	}
});
