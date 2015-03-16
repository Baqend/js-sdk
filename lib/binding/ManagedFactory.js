/**
 * @class baqend.binding.ManagedFactory
 */
var ManagedFactory = Object.inherit(/** @lends baqend.binding.ManagedFactory.prototype */ {

  /** @lends baqend.binding.ManagedFactory */
  extend: {
    /**
     * Creates a new ManagedFactory for the given type
     * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
     * @param {baqend.EntityManager} db
     * @return {baqend.binding.ManagedFactory} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = function() {
        return factory.newInstance(arguments);
      };

      Object.cloneOwnProperties(factory, ManagedFactory.prototype);
      factory.constructor(managedType, db);
      return factory;
    }
  },

  /**
   * Indicates if the given object is an instance of the factoryies type
   * @param {*} obj The instance to check
   * @return {boolean} <code>true</code> if the object is an instance of the factories type
   */
  isInstance: function(obj) {
    return this._managedType.typeConstructor.isInstance(obj);
  },

  /**
   * Return the object if the given object is an instance of the factoryies type
   * @param {*} obj The instance to check
   * @return {*} The object, if the object is an instance of the factories type otherwise <code>null</code>
   */
  asInstance: function(obj) {
    return this._managedType.typeConstructor.asInstance(obj);
  },

  /**
   * Methods that are added to object instances
   * This property is an alias for this factories type prototype
   * @type object
   */
  methods: null,

  /**
   * @protected
   * @type baqend.metamodel.ManagedType
   */
  _managedType: null,

  /**
   * @protected
   * @type baqend.EntityManager
   */
  _db: null,

  /**
   * Initialize a new ManagedFactory for the given type and database
   * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
   * @param {baqend.EntityManager} db The EntityManager used by this factory
   * @private
   */
  constructor: function ManagedFactory(managedType, db) {
    this.methods = managedType.typeConstructor.prototype;
    this._managedType = managedType;
    this._db = db;
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>} args Constructor arguments used for instantiation
   * @return {baqend.binding.Managed} A new created instance of T
   */
  newInstance: function(args) {
    var typeInstance = this._managedType.create();
    this._managedType.typeConstructor.apply(typeInstance, args);
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