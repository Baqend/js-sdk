"use strict";

var PersistentError = require('./PersistentError');

/**
 * @alias baqend.error.RollbackError
 * @extends baqend.error.PersistentError
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
