/**
 * This mixin provides an lock interface to execute exclusive operations
 *
 * @mixin baqend.util.Lockable
 */
var Lockable = module.exports = Trait.inherit(/** @lends baqend.util.Lockable.prototype */{

  /**
   * Indicates if there is currently an onging exclusive operation
   * @type Boolean
   * @private
   */
  _isLocked: false,

  /**
   * A promise which represents the state of the least exclusive operation
   * @type Promise
   * @private
   */
  _readyPromise: Promise.resolve(null),

  /**
   * A deferred used to explicit lock and unlock this instance
   */
  _deferred: null,

  /**
   * Indicates if there is currently no exclusive operation executed
   * @return {Boolean} <code>true</code> If no exclusive lock is hold
   */
  get isReady() {
    return !this._isLocked;
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {baqend.util.Lockable~callback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Promise<baqend.binding.Entity>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready: function(doneCallback) {
    var self = this;
    return this._readyPromise.then(function() {
      return self;
    }, function() {
      return self;
    }).then(doneCallback);
  },

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param {baqend.util.Lockable~callback} callback The exclusive operation to execute
   * @return {Promise<baqend.binding.Entity>} A promise
   * @throws {Error} If the lock can't be aquired
   */
  withLock: function(callback) {
    if(this._isLocked)
      throw new Error('Current operation has not been finished.');

    this._isLocked = true;
    return this._readyPromise = callback().then(function(result) {
      this._isLocked = false;
      return result;
    }.bind(this), function(e) {
      this._isLocked = false;
      throw e;
    }.bind(this));
  },

  /**
   * Try to acquire an exclusive lock, the lock must be released with the {@link baqend.util.Lockable#unlock()} method
   * @return {Promise.<*>} A promise which will be resolved, when the lock is released
   * @throws {Error} if there is a lock acquired
   */
  lock: function() {
    if(this._isLocked)
      throw new Error('There is a lock acquired currently.');

    this._isLocked = true;
    var deferred = this._deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    return this._readyPromise = deferred.promise;
  },

  /**
   * Unlock a previously acquired lock
   * @throws {Error} if there is no lock acquired
   */
  unlock: function() {
    if (!this._deferred)
      throw new Error('There is no lock acquired.');

    this._isLocked = false;
    this._deferred.resolve(this);
    this._deferred = null;
  }
});

/**
 * The operation callback is used by the {@link baqend.util.Lockable#withLock} method,
 * to perform an exclusive operation on the entity.
 * @callback baqend.util.Lockable~callback
 * @return {Promise<*>} A Promise, which reflects the result of the operation
 */