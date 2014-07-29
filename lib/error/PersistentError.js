/**
 * @class jspa.error.PersistentError
 * @extends Error
 */
exports.PersistentError = PersistentError = Error.inherit(
/**
 * @lends jspa.error.PersistentError.prototype
 */
{
	cause: null,

  /**
   * @lends jspa.error.PersistentError
   */
	extend: {
		conv: function(e) {
			if (Error.isInstance(e)) {
				return new this(null, e);
			}
		}
	},

  /**
   * @param {String} message
   * @param {Error} cause
   */
	initialize: function(message, cause) {
		this.superCall(message? message: 'jspa.error.PersistentError: An unexpected persistent error occured. ' + cause? cause.message: '');

		if (cause) {
			this.cause = cause;
      this.stack += '\nCaused By: ' + cause.stack;
		}
	}
});