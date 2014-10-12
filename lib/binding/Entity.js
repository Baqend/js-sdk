var Managed = require('./Managed').Managed;
var Q = require('q');

var Entity;

/**
 * @mixin baqend.binding.Entity
 * @mixes baqend.binding.Managed
 */
exports.Entity = Entity = Managed.inherit(/** @lends baqend.binding.Entity.prototype */ {

  /**
   * A promise which represents the state of the least requested operation
   * @type Q.Promise
   * @private
   */
  _readyPromise: Q(null),

  /**
   * Gets the unique id of this object
   * @return {*} The unique id
   */
  get id() {
    return this._metadata.id;
  },

  /**
   * Sets the id of this object, if it is not already set throws an error otherwise
   * @param {*} value The new unique id of the object
   */
  set id(value) {
    if (this._metadata.id)
      throw new Error('Id can\'t be set twice.');

    this._metadata.id = value;
  },

  /**
   * The object read/write permissions
   * @type baqend.Acl
   */
  get acl() {
    return this._metadata.acl;
  },

  /**
   * Attach this object to the given db
   * @param {baqend.EntityManager} db The db which will be used for future crud operations
   */
  attach: function(db) {
    db.attach(this);
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {baqend.binding.Entity~doneCallback} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Q.Promise<baqend.binding.Entity>} A promise which completes successfully, when the previously requested
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
   * @param {baqend.binding.Entity~callback} callback
   * @return {Q.Promise<baqend.binding.Entity>}
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
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
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

    return this._metadata.db.save(this, false, force, depth).then(doneCallback, failCallback);
  },

  /**
   * Saves the object and refresh the local object state.
   * Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Boolean} [force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
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

    return this._metadata.db.save(this, true, force, depth).then(doneCallback, failCallback);
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Number|Boolean} [depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insert: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.insert(this, false, depth).then(doneCallback, failCallback);
  },

  /**
   * Inserts a new object and refresh the local object state.
   * Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Number|Boolean} [depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insertAndRefresh: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.insert(this, true, depth).then(doneCallback, failCallback);
  },

  /**
   * Updates an existing.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Boolean} [force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
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

    return this._metadata.db.update(this, false, force, depth).then(doneCallback, failCallback);;
  },

  /**
   * Updates an existing object and refresh the local object state.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Boolean} [force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
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

    return this._metadata.db.update(this, true, force, depth).then(doneCallback, failCallback);
  },

  /**
   * Refresh the local object state, with the server state.
   * Removed objects will be marked as removed.
   * @param {Number|Boolean} [depth=0] The object depth which will be refreshed. Depth 0 refreshes this object only,
   * <code>true</code> refreshes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  refresh: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.find(this.constructor, this._metadata.id, true, depth).then(doneCallback, failCallback);
  },

  /**
   * Remove an existing object.
   * @param {Boolean} [force=false] Force the remove operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
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

    return this._metadata.db.remove(this, force, depth).then(doneCallback, failCallback);
  },

  attr: function() {
    throw new Error("Attr is not yet implemented.");
  },

  /**
   * Converts the entity to an JSON-Object.
   * @param {Boolean} includeObjectInfo
   * @return {Object} JSON-Object
   */
  toJSON: function(includeObjectInfo) {
    return this._metadata.getDatabaseObject(!includeObjectInfo, !includeObjectInfo);
  }
});

/**
 * The operation callback is used by the {@link baqend.binding.Entity#withLock} method,
 * to perform an exclusive operation on the entity.
 * @callback baqend.binding.Entity~callback
 * @return {Q.Promise<*>} A Promise, which reflects the result of the operation
 */

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback baqend.binding.Entity~doneCallback
 * @param {baqend.binding.Entity} entity This entity
 * @return {Q.Promise<*>|*|undefined} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback baqend.binding.Entity~failCallback
 * @param {baqend.error.PersistentError} error The error which reject the operation
 * @return {Q.Promise<*>|*|undefined} A Promise, result or undefined
 */

