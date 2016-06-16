"use strict";

var ManagedFactory = require('./ManagedFactory');

/**
 * @class baqend.binding.EntityFactory
 * @extends baqend.binding.ManagedFactory
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {baqend.binding.Entity} The new managed instance
 */
var EntityFactory = ManagedFactory.extend( /** @lends baqend.binding.EntityFactory.prototype */ {
  /**
   * Loads the instance for the given id, or null if the id does not exists.
   * @param {String} id The id to query
   * @param {Object} [options] The load options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be saved. Depth 0 saves only this object,
   * <code>true</code> saves the objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load(id, options, doneCallback, failCallback) {
    if(options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._db.load(this._managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  },

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {Object} json
   * @returns {baqend.binding.Entity} instance
   */
  fromJSON(json) {
    var instance = json.id? this._db.getReference(this._managedType.typeConstructor, json.id): this._managedType.create();
    var metadata = instance._metadata;
    metadata.setJson(json);
    metadata.setDirty();
    return instance;
  },

  /**
   * Creates a new query for this class
   * @return {baqend.Query.Builder} The query builder
   */
  find() {
    return this._db.createQueryBuilder(this._managedType.typeConstructor);
  },

  partialUpdate() {
    throw new Error("partialUpdate is not yet implemented.");
  }
});

module.exports = EntityFactory;