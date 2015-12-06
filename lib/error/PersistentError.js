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
    of: function(error) {
      if (error instanceof PersistentError) {
        return error;
      } else {
        return new PersistentError(null, error);
      }
    }
  },

  constructor: function PersistentError(message, cause) {
    message = (message ? message : 'An unexpected persistent error occured.');

    if (Error.hasOwnProperty('captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error()).stack;
    }

    this.message = message;
    this.name = this.constructor.name;

    if (cause) {
      this.cause = cause;
      if (cause.stack) {
        this.stack += '\nCaused By: ' + cause.stack;
      }
    }
  }
});

module.exports = PersistentError;