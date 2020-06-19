'use strict';

import { deprecated } from "./deprecated";

const isLocked = Symbol('IsLocked');
const readyPromise = Symbol('ReadyPromise');

/**
 * This base class provides an lock interface to execute exclusive operations
 */
export class Lockable {
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
   */
  get isReady(): boolean {
    return !this[isLocked];
  }

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @param failCallback When the lock can't be released caused by a none
   * recoverable error
   * @return A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready(doneCallback?: (this) => any, failCallback?: (Error) => any): Promise<this> {
    return this[readyPromise].then(doneCallback, failCallback);
  }

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param callback The exclusive operation to execute
   * @param [critical=false] Indicates if the operation is critical. If the operation is critical and the
   * operation fails, then the lock will not be released
   * @return A promise
   * @throws If the lock can't be aquired
   * @protected
   */
  withLock<T>(callback: () => Promise<T>, critical = false): Promise<T> {
    if (this[isLocked]) {
      throw new Error('Current operation has not been finished.');
    }

    try {
      this[isLocked] = true;
      const result = callback().then((res) => {
        this[isLocked] = false;
        return res;
      }, (e) => {
        if (!critical) {
          this[isLocked] = false;
        }
        throw e;
      });

      this[readyPromise] = result.then(() => this, (e) => {
        if (!critical) {
          return this;
        }
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
