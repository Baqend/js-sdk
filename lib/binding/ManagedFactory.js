"use strict";

/**
 * @class baqend.binding.ManagedFactory
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {baqend.binding.Managed} The new managed instance
 */
var ManagedFactory = extend( /** @lends baqend.binding.ManagedFactory.prototype */ {

  /**
   * Creates a child factory of this factory
   * @param {Object} properties additional properties applied to the child factory
   * @returns {Object} The new created child Factory
   * @static
   */
  extend(properties) {
    //copy all factory methods to the child factory
    return extend({}, this, properties);
  },

  /**
   * Creates a new ManagedFactory for the given type
   * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
   * @param {baqend.EntityManager} db
   * @return {baqend.binding.ManagedFactory} A new object factory to created instances of T
   * @static
   */
  create(managedType, db) {
    var factory = function Factory(properties) {
      return factory.newInstance(arguments);
    };

    extend(factory, this);

    //lets instanceof work properly
    factory.prototype = managedType.typeConstructor.prototype;
    factory.methods = factory.prototype;

    factory._managedType = managedType;
    factory._db = db;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {baqend.binding.Managed} A new created instance of T
   */
  newInstance(args) {
    var typeInstance = this._managedType.create(args);
    typeInstance._metadata.db = this._db;
    return typeInstance;
  },

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param {Object} json
   * @returns {baqend.binding.Managed} instance
   */
  fromJSON(json) {
    var instance = this.newInstance();
    var metadata = instance._metadata;
    this._managedType.fromJsonValue(metadata, json, instance);
    return instance;
  },

  /**
   * Adds methods to instances of this factories type
   * @param {object} methods The methods to add
   */
  addMethods(methods) {
    Object.assign(this.methods, methods);
  },

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {function} fn The Method to add
   */
  addMethod(name, fn) {
    this.methods[name] = fn;
  }

  /**
   * Methods that are added to object instances
   * This property is an alias for this factory type prototype
   * @name methods
   * @type object
   * @memberOf baqend.binding.ManagedFactory.prototype
   */

  /**
   * The managed type of this factory
   * @name _managedType
   * @type baqend.metamodel.ManagedType
   * @protected
   * @memberOf baqend.binding.ManagedFactory.prototype
   */

  /**
   * The owning EntityManager where this factory belongs to
   * @name _db
   * @type baqend.EntityManager
   * @protected
   * @memberOf baqend.binding.ManagedFactory.prototype
   */
});

function extend(target) {
  for (let i = 1, source; source = arguments[i]; ++i)
    for (let prop of Object.getOwnPropertyNames(source))
      Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
  return target;
}

module.exports = ManagedFactory;