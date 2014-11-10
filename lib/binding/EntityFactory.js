var ManagedFactory = require('./ManagedFactory').ManagedFactory;
var Metadata = require('../util/Metadata').Metadata;
var EntityFactory;

/**
 * @class baqend.binding.EntityFactory
 * @extends baqend.binding.ManagedFactory<T>
 * @template <T> The type of the factory
 */
exports.EntityFactory = EntityFactory = ManagedFactory.inherit(/** @lends baqend.binding.EntityFactory.prototype */ {

  /** @lends baqend.binding.EntityFactory */
  extend: {
    /**
     * Creates a new EntityFactory for the given type
     * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
     * @param {baqend.EntityManager} db
     * @return {baqend.binding.EntityFactory<T>} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = ManagedFactory.create(managedType, db);
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
    Metadata.get(typeInstance).db = this._db;
    this._managedType.typeConstructor.apply(typeInstance, args);
    return typeInstance;
  },

  /**
   * Gets a instance for the given id, or null if the id does not exists.
   * @param {String} id The id to query
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<T>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  get: function(id, depth, doneCallback, failCallback) {
    if(Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._db.find(this._managedType.typeConstructor, id, false, depth).then(doneCallback, failCallback);
  },

  _getHandler: function(codeType) {
    var fn = this._db.code.getHandler(this._managedType.name, codeType);
    if(fn) {
      return function(obj) {
        return fn.call(obj, this._db);
      }.bind(this);
    } else {
      return null;
    }
  },

  /**
   * Returns the code of the insert handler.
   * The code must previously be loaded by the {@link baqend.metamodel.Code} object of the {@link baqend.EntityManager}.
   *
   * @returns {Function} null if no code has been loaded
   */
  get onInsert() {
    return this._getHandler('insert');
  },

  /**
   * Returns the code of the delete handler.
   * The code must previously be loaded by the {@link baqend.metamodel.Code} object of the {@link baqend.EntityManager}.
   *
   * @returns {Function} null if no code has been loaded
   */
  get onDelete() {
    return this._getHandler('delete');
  },

  /**
   * Returns the code of the update handler.
   * The code must previously be loaded by the {@link baqend.metamodel.Code} object of the {@link baqend.EntityManager}.
   *
   * @returns {Function} null if no code has been loaded
   */
  get onUpdate() {
    return this._getHandler('update');
  },

  /**
   * Returns the code of the validation handler.
   *
   * @returns {Function}
   */
  get onValidate() {
    return this._managedType.validationCode;
  },

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {Object} json
   * @returns {baqend.binding.Entity} instance
   */
  fromJSON: function(json) {
    var instance = json._objectInfo? this._db.getReference(this._managedType.typeConstructor, json._objectInfo.id): this.newInstance();
    var metadata = Metadata.get(instance);
    metadata.setDatabaseObject(json);
    metadata.setPersistent();
    return instance;
  },

  find: function() {
    throw new Error("find is not yet implemented.");
  },

  partialUpdate: function() {
    throw new Error("partialUpdate is not yet implemented.");
  }
});