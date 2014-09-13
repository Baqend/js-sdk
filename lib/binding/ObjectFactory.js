var ObjectFactory;

/**
 * @class jspa.binding.ObjectFactory
 * @template <T> The type of the factory
 */
exports.ObjectFactory = ObjectFactory = Object.inherit(/** @lends jspa.binding.ObjectFactory.prototype */ {

  /** @lends jspa.binding.ObjectFactory */
  extend: {
    /**
     * Creates a new ObjectFactory for the given type
     * @param {jspa.metamodel.ManagedType} managedType The metadata of type T
     * @param {jspa.EntityManager} db
     * @return {jspa.binding.ObjectFactory<T>} A new object factory to created instances of T
     */
    create: function(managedType, db) {
      var factory = function() {
        return factory.newInstance(arguments);
      };

      Object.cloneOwnProperties(factory, ObjectFactory.prototype);
      factory.initialize(managedType, db);
      return factory;
    }
  },

  /**
   * Methods that are added to object instances
   * @type object
   */
  methods: null,

  /**
   * @protected
   * @type jspa.metamodel.ManagedType
   */
  _managedType: null,

  /**
   * @protected
   * @type jspa.EntityManager
   */
  _db: null,

  /**
   * Initialize a new ObjectFactory for the given type and database
   * @param {jspa.metamodel.ManagedType} managedType The metadata of type T
   * @param {jspa.EntityManager} db The EntityManager used by this factory
   * @private
   */
  initialize: function(managedType, db) {
    this.methods = managedType.typeConstructor.prototype;
    this._managedType = managedType;
    this._db = db;
  },

  /**
   * Creates a new instance of the factory type
   * @params *[] args Constructor arguments used for instantiation
   * @return {T} A new created instance of T
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