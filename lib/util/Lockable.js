"use strict";

/**
 * This base class provides an lock interface to execute exclusive operations
 * @alias util.Lockable
 */
class Lockable {

  constructor() {
    /**
     * Indicates if there is currently an onging exclusive operation
     * @type boolean
     * @private
     */
    this._isLocked = false;

    /**
     * A promise which represents the state of the least exclusive operation
     * @type Promise
     * @private
     */
    this._readyPromise = Promise.resolve(this);

    /**
     * A deferred used to explicit lock and unlock this instance
     * @private
     */
    this._deferred = null;
  }

  /**
   * Indicates if there is currently no exclusive operation executed
   * <code>true</code> If no exclusive lock is hold
   * @type {boolean}
   */
  get isReady() {
    return !this._isLocked;
  }

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {util.Lockable~callback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @param {util.Lockable~callback=} failCallback When the lock can't be released caused by a none
   * recoverable error
   * @return {Promise<util.Lockable>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready(doneCallback, failCallback) {
    return this._readyPromise.then(doneCallback, failCallback);
  }

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param {util.Lockable~callback} callback The exclusive operation to execute
   * @param {boolean} [critical=false] Indicates if the operation is critical. If the operation is critical and the
   * operation fails, then the lock will not be released
   * @return {Promise<util.Lockable>} A promise
   * @throws {Error} If the lock can't be aquired
   * @protected
   */
  withLock(callback, critical) {
    if(this._isLocked)
      throw new Error('Current operation has not been finished.');

    var self = this;
    try {
      this._isLocked = true;
      var result = callback().then(function(result) {
        self._isLocked = false;
        return result;
      }, function(e) {
        if (!critical)
          self._isLocked = false;
        throw e;
      });

      this._readyPromise = result.then(function() {
        return self;
      }, function(e) {
        if (!critical)
          return self;
        throw e;
      });

      return result;
    } catch (e) {
      if (critical) {
        this._readyPromise = Promise.reject(e);
      } else {
        this._isLocked = false;
      }
      throw e;
    }
  }
}

module.exports = Lockable;

/**
 * The operation callback is used by the {@link util.Lockable#withLock} method,
 * to perform an exclusive operation on the 
 * @callback util.Lockable~callback
 * @return {Promise<*>} A Promise, which reflects the result of the operation
 */