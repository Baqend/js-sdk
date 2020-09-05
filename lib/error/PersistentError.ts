interface PersistentErrorConstructor {
  /**
   * Wraps the given error into a persistent error, if the error is not already an persistent error
   * @param error - The error to wrap
   */
  of(error: Error): PersistentError;

  /**
   * @param message - a error message
   * @param cause - a optional cause of the error
   */
  new(message: string | null, cause?: Error): PersistentError;
}

export interface PersistentError extends Error {
  /**
   * The name of the error
   */
  name: string;

  /**
   * The error message
   */
  message: string;

  /**
   * The error stack trace
   */
  stack?: string;

  /**
   * The error cause
   */
  cause?: Error;
}

export const PersistentError = (() => {
  function PersistentErrorConstructor(this: PersistentError, message: string | null, cause?: Error) {
    if (Object.prototype.hasOwnProperty.call(Error, 'captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error()).stack;
    }

    this.message = (message || 'An unexpected persistent error occurred.');
    this.name = this.constructor.name;

    if (cause) {
      this.cause = cause;
      if (cause.stack) {
        this.stack += `\nCaused By: ${cause.stack}`;
      }
    }
  }

  // custom errors must be manually extended, since JS Errors can't be super called in a class hierarchy,
  // otherwise the super call destroys the origin 'this' reference
  PersistentErrorConstructor.prototype = Object.create(Error.prototype, {
    constructor: {
      value: PersistentErrorConstructor,
      writable: true,
      enumerable: false,
      configurable: true,
    },
  });

  return PersistentErrorConstructor as any as PersistentErrorConstructor;
})();

PersistentError.of = function of(error: Error): PersistentError {
  if (error instanceof PersistentError) {
    return error;
  }

  return new PersistentError(null, error);
};
