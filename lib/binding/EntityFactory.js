"use strict";

var ManagedFactory = require('./ManagedFactory');

/**
 * @class binding.EntityFactory<T>
 * @extends binding.ManagedFactory<T>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {T} The new managed instance
 */
var EntityFactory = ManagedFactory.extend(/** @lends binding.EntityFactory<T>.prototype */ {
  /**
   * Loads the instance for the given id, or null if the id does not exists.
   * @param {string} id The id to query
   * @param {Object} [options] The load options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 loads only this object,
   * <code>true</code> loads the objects by reachability.
   * @param {boolean} [options.refresh=false] Indicates whether the object should be revalidated (cache bypass).
   * @param {boolean} [options.local=false] Indicates whether the local copy (from the entity manager)
   * of an object should be returned if it exists. This value might be stale.
   * @param {binding.EntityFactory~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.EntityFactory~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load(id, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._db.load(this._managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  },

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {json} json
   * @returns {T} instance
   */
  fromJSON(json) {
    var instance = json.id ? this._db.getReference(this._managedType.typeConstructor, json.id) : this.newInstance();
    var metadata = instance._metadata;
    metadata.setJson(json);
    return instance;
  },

  /**
   * Creates a new query for this class
   * @return {query.Builder<T>} The query builder
   */
  find() {
    return this._db.createQueryBuilder(this._managedType.typeConstructor);
  },

  partialUpdate() {
    throw new Error("partialUpdate is not yet implemented.");
  }

  /**
   * Creates a new instance of the of this type
   * @function
   * @name new
   * @param {Object<string, *>} properties Additional properties which will be applied to the created instance
   * @return {binding.Entity} A new created instance of this class
   * @memberOf binding.EntityFactory.prototype
   */
});

module.exports = EntityFactory;

/**
 * The entity callback is called, when the asynchronous operation completes successfully
 * @callback binding.EntityFactory~doneCallback
 * @param {T} entity The entity
 * @return {Promise<*>|*} A Promise or result
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.EntityFactory~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise or result
 */