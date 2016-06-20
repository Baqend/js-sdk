"use strict";
/**
 * @class baqend.error.PersistentError
 * @extends Error
 *
 * @param {string} message
 * @param {Error=} cause
 */

//do not use class here, since we can't change the class prototype
function PersistentError(message, cause) {
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

PersistentError.of = function of(error) {
  if (error instanceof PersistentError) {
    return error;
  } else {
    return new PersistentError(null, error);
  }
};

//custom errors must be manually extended for babel, otherwise the super call destroys the origin 'this' reference
PersistentError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: PersistentError,
    enumerable: false,
    configurable: true
  }
});

module.exports = PersistentError;