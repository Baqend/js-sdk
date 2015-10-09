var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.RollbackError
 * @extends baqend.error.PersistentError
 *
 * @param {Error} cause
 */
var RollbackError = PersistentError.inherit(/* @lends baqend.error.RollbackError */ {
  constructor: function RollbackError(cause) {
    PersistentError.call(this, 'The transaction has been rollbacked', cause);
  }
});

module.exports = RollbackError;
