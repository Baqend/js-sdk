'use strict';

/**
 * @class error.PersistentError
 * @extends Error
 *
 * @param {string} message
 * @param {Error=} cause
 */
// do not use class here, since we can't change the class prototype
function PersistentError(message, cause) {
  if (Object.prototype.hasOwnProperty.call(Error, 'captureStackTrace')) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /**
     * The error stack trace
     * @type {string}
     */
    this.stack = (new Error()).stack;
  }

  /**
   * The error message
   * @type {string}
   */
  this.message = (message || 'An unexpected persistent error occured.');

  /**
   * The name of the error
   * @type {string}
   */
  this.name = this.constructor.name;

  if (cause) {
    /**
     * The error cause
     * @type {Error}
     */
    this.cause = cause;
    if (cause.stack) {
      this.stack += '\nCaused By: ' + cause.stack;
    }
  }
}

PersistentError.of = function of(error) {
  if (error instanceof PersistentError) {
    return error;
  }

  return new PersistentError(null, error);
};

// custom errors must be manually extended for babel, otherwise the super call destroys the origin 'this' reference
PersistentError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: PersistentError,
    enumerable: false,
    configurable: true,
  },
});

module.exports = PersistentError;
