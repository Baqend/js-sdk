"use strict";

var Managed = require('./Managed');

/**
 * @class baqend.binding.Entity
 * @extends baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
class Entity extends Managed /** @lends baqend.binding.Entity.prototype */ {

  /**
   * Indicates if the given object is an entity instance
   * @param {*} obj The instance to check
   * @return {boolean} <code>true</code> if the object is an entity
   */
  static isEntity(obj) {
    return obj instanceof Object && "_metadata" in obj && "id" in obj;
  }

  /**
   * The unique id of this object
   * if the id is already set an error will be thrown
   * @return {String}
   */
  get id() {
    return this._metadata.id;
  }

  /**
   * @param {String} value
   */
  set id(value) {
    if (this._metadata.id)
      throw new Error('Id can\'t be set twice.');

    this._metadata.id = value;
  }

  /**
   * The version of this object
   * @type {*}
   */
  get version() {
    return this._metadata.version;
  }

  set version(value) {
    this._metadata.version = value;
  }

  /**
   * The object read/write permissions
   * @type baqend.Acl
   */
  get acl() {
    return this._metadata.acl;
  }

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {baqend.util.Lockable~callback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Promise<baqend.binding.Entity>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready(doneCallback) {
    return this._metadata.ready(doneCallback);
  }

  /**
   * Attach this object to the given db
   * @param {baqend.EntityManager} db The db which will be used for future crud operations
   */
  attach(db) {
    db.attach(this);
  }

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Object} [options] The save options
   * @param {Boolean} [options.force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {Boolean} [options.reload=false] Reload the local object state from remote.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  save(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.save(this, options).then(doneCallback, failCallback);
  }

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Object} [options] The insertion options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {Boolean} [options.reload=false] Reload the local object state from remote.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insert(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
  }

  /**
   * Updates an existing object.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Object} [options] The update options
   * @param {Boolean} [options.force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {Boolean} [options.reload=false] Reload the local object state from remote.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  update(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.update(this, options).then(doneCallback, failCallback);;
  }

  /**
   * Load the remote state and replaces the local object state.
   * Removed objects will be marked as removed.
   * @param {Object} [options] The load options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be loaded. Depth 0 loads this object only,
   * <code>true</code> loads objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.reload(this, options).then(doneCallback, failCallback);
  }

  /**
   * Delete an existing object.
   * @param {Object} [options] The remove options
   * @param {Boolean} [options.force=false] Force the remove operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  delete(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.delete(this, options).then(doneCallback, failCallback);
  }

  /**
   * Saves the object and repeats the operation if the object is out of date.
   * In each pass the callback will be called. Ths first parameter of the callback is the entity and the second one
   * is a function to abort the process.
   *
   * @param {Function} cb Will be called in each pass
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  optimisticSave(cb, doneCallback, failCallback) {
    return this._metadata.db.optimisticSave(this, cb).then(doneCallback, failCallback);
  }

  attr() {
    throw new Error("Attr is not yet implemented.");
  }

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @returns {baqend.util.ValidationResult} Contains the result of the Validation
   */
  validate() {
    return this._metadata.db.validate(this);
  }

  /**
   * Converts the entity to an JSON-Object.
   * @param {Boolean} excludeMetadata
   * @return {Object} JSON-Object
   */
  toJSON(excludeMetadata) {
    return this._metadata.getJson(excludeMetadata, excludeMetadata);
  }
}

module.exports = Entity;

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

