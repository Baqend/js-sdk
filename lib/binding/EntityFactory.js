"use strict";

var ManagedFactory = require('./ManagedFactory');
var Metadata = require('../util/Metadata');

/**
 * @class baqend.binding.EntityFactory
 * @extends baqend.binding.ManagedFactory
 */
class EntityFactory extends ManagedFactory {

  /**
   * Creates a new instance of the factory type
   * @param {Object<*>=} properties Constructor arguments used for instantiation
   * @param {...*} arguments Constructor arguments used for instantiation
   * @return {baqend.binding.Entity} A new created instance of T
   */
  static newInstance(properties) {
    var typeInstance = ManagedFactory.newInstance.apply(this, arguments);
    Metadata.get(typeInstance).db = this._db;
    return typeInstance;
  }

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
  static load(id, options, doneCallback, failCallback) {
    if(options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._db.load(this._managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  }

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {Object} json
   * @returns {baqend.binding.Entity} instance
   */
  static fromJSON(json) {
    var instance = json.id? this._db.getReference(this._managedType.typeConstructor, json.id): this.newInstance();
    var metadata = Metadata.get(instance);
    metadata.setJson(json);
    metadata.setDirty();
    return instance;
  }

  /**
   * Creates a new query for this class
   * @return {baqend.Query.Builder} The query builder
   */
  static find() {
    return this._db.createQueryBuilder(this._managedType.typeConstructor);
  }

  static partialUpdate() {
    throw new Error("partialUpdate is not yet implemented.");
  }
}

module.exports = EntityFactory;