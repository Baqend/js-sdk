"use strict";
/**
 * This mixin provides an lock interface to execute exclusive operations
 *
 * @class baqend.util.Lockable
 */
class Lockable {

  constructor() {
    /**
     * Indicates if there is currently an onging exclusive operation
     * @type Boolean
     * @private
     */
    this._isLocked = false;

    /**
     * A promise which represents the state of the least exclusive operation
     * @type Promise
     * @private
     */
    this._readyPromise = Promise.resolve(null);

    /**
     * A deferred used to explicit lock and unlock this instance
     * @private
     */
    this._deferred = null;
  }

  /**
   * Indicates if there is currently no exclusive operation executed
   * <code>true</code> If no exclusive lock is hold
   * @type {Boolean}
   */
  get isReady() {
    return !this._isLocked;
  }

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {baqend.util.Lockable~callback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @param {baqend.util.Lockable~callback=} failCallback When the lock can't be released caused by a none
   * recoverable error
   * @return {Promise<baqend.util.Lockable>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready(doneCallback, failCallback) {
    var self = this;
    return this._readyPromise.then(function() {
      return self;
    }, function(e) {
      // the error was critical, the lock wasn't released
      if (self._isLocked)
        throw e;

      return self;
    }).then(doneCallback, failCallback);
  }

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param {baqend.util.Lockable~callback} callback The exclusive operation to execute
   * @param {Boolean} [critical=false] Indicates if the operation is critical. If the operation is critical and the
   * operation fails, then the lock will not be released
   * @return {Promise<baqend.util.Lockable>} A promise
   * @throws {Error} If the lock can't be aquired
   * @protected
   */
  withLock(callback, critical) {
    if(this._isLocked)
      throw new Error('Current operation has not been finished.');

    try {
      this._isLocked = true;
      return this._readyPromise = callback().then(function(result) {
        this._isLocked = false;
        return result;
      }.bind(this), function(e) {
        if (!critical)
          this._isLocked = false;
        throw e;
      }.bind(this));
    } catch (e) {
      if (!critical)
        this._isLocked = false;
      throw e;
    }
  }
}

module.exports = Lockable;

/**
 * The operation callback is used by the {@link baqend.util.Lockable#withLock} method,
 * to perform an exclusive operation on the entity.
 * @callback baqend.util.Lockable~callback
 * @return {Promise<*>} A Promise, which reflects the result of the operation
 */