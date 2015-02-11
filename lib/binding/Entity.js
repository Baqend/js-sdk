var Managed = require('./Managed');
var Lockable = require('../util/Lockable');

/**
 * @mixin baqend.binding.Entity
 * @extends baqend.binding.Managed
 * @extends baqend.util.Lockable
 */
var Entity = module.exports = Managed.inherit(Lockable, /** @lends baqend.binding.Entity.prototype */ {

  /**
   * Gets the unique id of this object
   * @return {*} The unique id
   */
  get id() {
    return this._metadata.id;
  },

  /**
   * Sets the id of this object, if it is not already set throws an error otherwise
   * @param {String} value The new unique id of the object
   */
  set id(value) {
    if (this._metadata.id)
      throw new Error('Id can\'t be set twice.');

    this._metadata.id = value;
  },

  /**
   * Gets the version of this object
   * @return {*} The version of the object
   */
  get version() {
    return this._metadata.version;
  },

  /**
   * Sets the version of this object
   * @param {String} value The version of the object
   */
  set version(value) {
    this._metadata.version = value;
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
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Object} [options] The save options
   * @param {Boolean} [options.force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state with the remote state.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  save: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.save(this, options).then(doneCallback, failCallback);
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Object} [options] The insertion options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state with the remote state.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insert: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
  },

  /**
   * Updates an existing object.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Object} [options] The update options
   * @param {Boolean} [options.force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state with the remote state.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  update: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.update(this, options).then(doneCallback, failCallback);;
  },

  /**
   * Refresh the local object state, with the server state.
   * Removed objects will be marked as removed.
   * @param {Object} [options] The refresh options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be refreshed. Depth 0 refreshes this object only,
   * <code>true</code> refreshes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  refresh: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.refresh(this, options).then(doneCallback, failCallback);
  },

  /**
   * Remove an existing object.
   * @param {Object} [options] The remove options
   * @param {Boolean} [options.force=false] Force the remove operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  remove: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.remove(this, options).then(doneCallback, failCallback);
  },

  attr: function() {
    throw new Error("Attr is not yet implemented.");
  },

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @returns {baqend.util.ValidationResult} Contains the result of the Validation
   */
  validate: function() {
    return this._metadata.db.validate(this);
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
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback baqend.binding.Entity~doneCallback
 * @param {baqend.binding.Entity} entity This entity
 * @return {Promise<*>|*|undefined} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback baqend.binding.Entity~failCallback
 * @param {baqend.error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*|undefined} A Promise, result or undefined
 */

