'use strict';

const deprecated = require('./deprecated');

const isLocked = Symbol('IsLocked');
const readyPromise = Symbol('ReadyPromise');

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
    this[isLocked] = false;

    /**
     * A promise which represents the state of the least exclusive operation
     * @type Promise
     * @private
     */
    this[readyPromise] = Promise.resolve(this);
  }

  /**
   * Indicates if there is currently no exclusive operation executed
   * <code>true</code> If no exclusive lock is hold
   * @type {boolean}
   */
  get isReady() {
    return !this[isLocked];
  }

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {util.Lockable~doneCallback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @param {util.Lockable~failCallback=} failCallback When the lock can't be released caused by a none
   * recoverable error
   * @return {Promise<this>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready(doneCallback, failCallback) {
    return this[readyPromise].then(doneCallback, failCallback);
  }

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param {util.Lockable~callback} callback The exclusive operation to execute
   * @param {boolean} [critical=false] Indicates if the operation is critical. If the operation is critical and the
   * operation fails, then the lock will not be released
   * @return {Promise<T>} A promise
   * @throws {Error} If the lock can't be aquired
   * @alias util.Lockable.prototype.withLock<T>
   * @protected
   */
  withLock(callback, critical) {
    if (this[isLocked]) {
      throw new Error('Current operation has not been finished.');
    }

    try {
      this[isLocked] = true;
      const result = callback().then((result) => {
        this[isLocked] = false;
        return result;
      }, (e) => {
        if (!critical)
          this[isLocked] = false;
        throw e;
      });

      this[readyPromise] = result.then(() => {
        return this;
      }, (e) => {
        if (!critical)
          return this;
        throw e;
      });

      return result;
    } catch (e) {
      if (critical) {
        this[readyPromise] = Promise.reject(e);
      } else {
        this[isLocked] = false;
      }
      throw e;
    }
  }
}

deprecated(Lockable.prototype, '_isLocked', isLocked);
deprecated(Lockable.prototype, '_readyPromise', readyPromise);

module.exports = Lockable;

/**
 * The operation callback is used by the {@link util.Lockable#withLock} method,
 * to perform an exclusive operation on the
 * @callback util.Lockable~callback
 * @return {Promise<T>} A Promise, which reflects the result of the operation
 */

/**
 * The done callback is called, when the last operation on this object completes
 * @callback util.Lockable~doneCallback
 * @param {this} entity This entity instance
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the last critical operation on this object fails
 * @callback util.Lockable~failCallback
 * @param {Error} error The error which reject the operation
 * @return {Promise<*>|*} A Promise, result or undefined
 */
