var ManagedFactory = require('./ManagedFactory');
var Metadata = require('../util/Metadata');

/**
 * @class baqend.binding.EntityFactory
 * @extends baqend.binding.ManagedFactory
 */
var EntityFactory = ManagedFactory.inherit(/** @lends baqend.binding.EntityFactory.prototype */ {

  /** @lends baqend.binding.EntityFactory */
  extend: {
    /**
     * Creates a new EntityFactory for the given type
     * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
     * @param {baqend.EntityManager} db
     * @return {baqend.binding.EntityFactory} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = ManagedFactory.create(managedType, db);
      Object.cloneOwnProperties(factory, EntityFactory.prototype);
      return factory;
    }
  },

  constructor: function EntityFactory(managedType, db) {
    ManagedFactory.call(this, managedType, db);
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} args Constructor arguments used for instantiation
   * @return {baqend.binding.Entity} A new created instance of T
   */
  newInstance: function(args) {
    var typeInstance = this._managedType.create();
    Metadata.get(typeInstance).db = this._db;
    this._managedType.typeConstructor.apply(typeInstance, args);
    return typeInstance;
  },

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
  load: function(id, options, doneCallback, failCallback) {
    if(Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = depth;
      options = { };
    }

    return this._db.load(this._managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  },

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {Object} json
   * @returns {baqend.binding.Entity} instance
   */
  fromJSON: function(json) {
    var instance = json.id? this._db.getReference(this._managedType.typeConstructor, json.id): this.newInstance();
    var metadata = Metadata.get(instance);
    metadata.setJson(json);
    metadata.setDirty();
    return instance;
  },

  /**
   * Creates a new query for this class
   * @return {baqend.Query.Builder} The query builder
   */
  find: function() {
    return this._db.createQueryBuilder(this._managedType.typeConstructor);
  },

  partialUpdate: function() {
    throw new Error("partialUpdate is not yet implemented.");
  }
});

module.exports = EntityFactory;