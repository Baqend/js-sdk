"use strict";
/**
 * @param {String} message
 * @param {Error=} cause
 */
class PersistentError extends Error {
  static of(error) {
    if (error instanceof PersistentError) {
      return error;
    } else {
      return new PersistentError(null, error);
    }
  };

  constructor(message, cause) {
    super();

    message = (message ? message : 'An unexpected persistent error occured. ') +
        (cause ? ': ' + cause.message : '');

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
}

module.exports = PersistentError;