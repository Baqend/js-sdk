var Managed = require('./Managed').Managed;
var Q = require('q');

var Entity;

/**
 * @mixin jspa.binding.Entity
 * @mixes jspa.binding.Managed
 */
exports.Entity = Entity = Managed.inherit(/** @lends jspa.binding.Entity.prototype */ {

  /**
   * A promise which represents the state of the least requested operation
   * @type Q.Promise
   * @private
   */
  _readyPromise: Q(null),

  /**
   * Attach this object to the given db
   * @param {jspa.EntityManager} db The db which will be used for future crud operations
   */
  attach: function(db) {
    db.addReference(this);
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {jspa.binding.Entity~doneCallback} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Q.Promise<jspa.binding.Entity>} A promise which completes successfully, when the previously requested
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
   * @param {jspa.binding.Entity~callback} callback
   * @return {Q.Promise<jspa.binding.Entity>}
   */
  withLock: function(callback) {
    if(this._readyPromise.isPending())
      throw new Error('Current operation has not been finished.');

    return this._readyPromise = callback();
  },

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Boolean} [force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  save: function(force, depth, doneCallback, failCallback) {
    if (Function.isInstance(force)) {
      failCallback = depth;
      doneCallback = force;
      depth = 0;
      force = false;
    } else if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.save(this, false, force, depth, doneCallback, failCallback);
  },

  /**
   * Saves the object and refresh the local object state.
   * Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Boolean} [force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  saveAndRefresh: function(force, depth, doneCallback, failCallback) {
    if (Function.isInstance(force)) {
      failCallback = depth;
      doneCallback = force;
      depth = 0;
      force = false;
    } else if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.save(this, true, force, depth, doneCallback, failCallback);
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Number|Boolean} [depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insert: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.insert(this, false, depth, doneCallback, failCallback);
  },

  /**
   * Inserts a new object and refresh the local object state.
   * Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Number|Boolean} [depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insertAndRefresh: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.insert(this, true, depth, doneCallback, failCallback);
  },

  /**
   * Updates an existing.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Boolean} [force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  update: function(force, depth, doneCallback, failCallback) {
    if (Function.isInstance(force)) {
      failCallback = depth;
      doneCallback = force;
      depth = 0;
      force = false;
    } else if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.update(this, false, force, depth, doneCallback, failCallback);;
  },

  /**
   * Updates an existing object and refresh the local object state.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Boolean} [force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  updateAndRefresh: function(force, depth, doneCallback, failCallback) {
    if (Function.isInstance(force)) {
      failCallback = depth;
      doneCallback = force;
      depth = 0;
      force = false;
    } else if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.update(this, true, force, depth, doneCallback, failCallback);
  },

  /**
   * Refresh the local object state, with the server state.
   * Removed objects will be marked as removed.
   * @param {Number|Boolean} [depth=0] The object depth which will be refreshed. Depth 0 refreshes this object only,
   * <code>true</code> refreshes objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  refresh: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.find(this.constructor, this._metadata.id, true, depth, doneCallback, failCallback);
  },

  /**
   * Remove an existing object.
   * @param {Boolean} [force=false] Force the remove operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {jspa.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  remove: function(force, depth, doneCallback, failCallback) {
    if (Function.isInstance(force)) {
      failCallback = depth;
      doneCallback = force;
      depth = 0;
      force = false;
    } else if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.remove(this, force, depth, doneCallback, failCallback);
  },

  attr: function() {
    throw new Error("Attr is not yet implemented.");
  }
});

/**
 * The operation callback is used by the {@link jspa.binding.Entity#withLock} method,
 * to perform an exclusive operation on the entity.
 * @callback jspa.binding.Entity~callback
 * @return {Q.Promise<*>} A Promise, which reflects the result of the operation
 */

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback jspa.binding.Entity~doneCallback
 * @param {jspa.binding.Entity} entity This entity
 * @return {Q.Promise<*>|*|undefined} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback jspa.binding.Entity~failCallback
 * @param {jspa.error.PersistentError} error The error which reject the operation
 * @return {Q.Promise<*>|*|undefined} A Promise, result or undefined
 */
