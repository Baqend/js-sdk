var ObjectFactory = require('./ObjectFactory').ObjectFactory;
var EntityFactory;

/**
 * @class jspa.binding.EntityFactory
 * @extends jspa.binding.ObjectFactory<T>
 * @template <T> The type of the factory
 */
exports.EntityFactory = EntityFactory = ObjectFactory.inherit(/** @lends jspa.binding.EntityFactory.prototype */ {

  /** @lends jspa.binding.EntityFactory */
  extend: {
    /**
     * Creates a new EntityFactory for the given type
     * @param {jspa.metamodel.ManagedType} managedType The metadata of type T
     * @param {jspa.EntityManager} db
     * @return {jspa.binding.EntityFactory<T>} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = ObjectFactory.create(managedType, db);
      Object.cloneOwnProperties(factory, EntityFactory.prototype);
      return factory;
    }
  },

  /**
   * Creates a new instance of the factory type
   * @params *[] args Constructor arguments used for instantiation
   * @return {T} A new created instance of T
   */
  newInstance: function(args) {
    var typeInstance = this._managedType.create();
    typeInstance.attach(this._db);
    this._managedType.typeConstructor.apply(typeInstance, args);
    return typeInstance;
  },

  /**
   * Gets a instance for the given id, or null if the id does not exists.
   * @param {String} id The id to query
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<T>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  get: function(id, depth, doneCallback, failCallback) {
    if(Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._db.find(this._managedType.typeConstructor, id, false, depth, doneCallback, failCallback);
  },

  find: function() {
    throw new Error("find is not yet implemented.");
  },

  partialUpdate: function() {
    throw new Error("partialUpdate is not yet implemented.");
  }
});