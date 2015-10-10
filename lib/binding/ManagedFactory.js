/**
 * @class baqend.binding.ManagedFactory
 */
var ManagedFactory = {};
Object.defineProperty(ManagedFactory, 'methods', {
  /**
   * Methods that are added to object instances
   * This property is an alias for this factories type prototype
   * @type object
   */
  get: function() {
    return this.prototype;
  }
});

Object.extend(ManagedFactory, /** @lends baqend.binding.ManagedFactory */ {
  /**
   * Creates a new ManagedFactory for the given type
   * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
   * @param {baqend.EntityManager} db
   * @return {baqend.binding.ManagedFactory} A new object factory to created instances of T
   */
  create: function(managedType, db) {
    var self = this;
    var factory = function Factory() {
      return factory.newInstance.apply(factory, arguments);
    };

    Object.cloneOwnProperties(factory, self);

    //lets instanceof work properly
    factory.prototype = managedType.typeConstructor.prototype;
    factory._managedType = managedType;
    factory._db = db;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {Object<*>} properties A hash of initial properties
   * @param {...*} arguments Constructor arguments used for instantiation
   * @return {baqend.binding.Managed} A new created instance of T
   */
  newInstance: function(properties) {
    var typeInstance = Object.create(this.prototype);
    this.prototype.constructor.apply(typeInstance, arguments);
    typeInstance._metadata.db = this._db;
    return typeInstance;
  },

  /**
   * Adds methods to instances of this factories type
   * @param {object} methods The methods to add
   */
  addMethods: function(methods) {
    Object.extend(this.methods, methods);
  },

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {function} fn The Method to add
   */
  addMethod: function(name, fn) {
    this.methods[name] = fn;
  }
});

module.exports = ManagedFactory;