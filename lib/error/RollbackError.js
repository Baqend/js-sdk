"use strict";

var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.RollbackError
 * @extends baqend.error.PersistentError
 *
 * @param {Error} cause
 */
class RollbackError extends PersistentError {
  constructor(cause) {
    super('baqend.error.RollbackError: The transaction has been rollbacked', cause);
  }
}

module.exports = RollbackError;
