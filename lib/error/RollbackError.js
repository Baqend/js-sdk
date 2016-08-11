"use strict";

var PersistentError = require('./PersistentError');

/**
 * @alias error.RollbackError
 * @extends error.PersistentError
 */
class RollbackError extends PersistentError {
  /**
   * @param {Error} cause
   */
  constructor(cause) {
    super('The transaction has been rollbacked', cause);
  }
}

module.exports = RollbackError;
