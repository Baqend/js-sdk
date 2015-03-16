/**
 * @class baqend.error.PersistentError
 * @extends Error
 *
 * @param {String} message
 * @param {Error=} cause
 */
var PersistentError = Error.inherit(/* @lends baqend.error.PersistentError.prototype */ {
	cause: null,

  /**
   * @lends baqend.error.PersistentError
   */
	extend: {
		conv: function(e) {
			if (Error.isInstance(e)) {
				return new this(null, e);
			}
		}
	},

	initialize: function(message, cause) {
		this.superCall(message? message: 'baqend.error.PersistentError: An unexpected persistent error occured. ' + cause? cause.message: '');

		if (cause) {
			this.cause = cause;
      if(cause.stack) {
        this.stack += '\nCaused By: ' + cause.stack;
      }
		}
	}
});

module.exports = PersistentError;