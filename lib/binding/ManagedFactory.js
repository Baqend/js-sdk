"use strict";

const Factory = require('./Factory');
const Managed = require('./Managed');

/**
 * @class binding.ManagedFactory<T>
 * @extends binding.Factory<T>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} args Additional constructor params passed through the type constructor
 * @return {T} The new managed instance
 */
const ManagedFactory = Factory.extend(/** @lends binding.ManagedFactory<T>.prototype */ {

  /**
   * Creates a new ManagedFactory for the given type
   * @param {metamodel.ManagedType} managedType The metadata of type T
   * @param {EntityManager} db
   * @return {binding.ManagedFactory<*>} A new object factory to created instances of T
   * @static
   * @ignore
   */
  create(managedType, db) {
    //invoke super method
    let factory = Factory.create.call(this, managedType.typeConstructor);
    factory.methods = factory.prototype;

    factory._managedType = managedType;
    factory._db = db;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {T} A new created instance of T
   */
  newInstance(args) {
    let instance = args ? Factory.newInstance.call(this, args) : this._managedType.create(args);
    instance._metadata.db = this._db;
    return instance;
  },

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param {json} json
   * @return {T} instance
   */
  fromJSON(json) {
    const instance = this.newInstance();
    const metadata = instance._metadata;
    return this._managedType.fromJsonValue(metadata, json, instance, {});
  },

  /**
   * Adds methods to instances of this factories type
   * @param {Object<string, Function>} methods The methods to add
   * @return {void}
   */
  addMethods(methods) {
    Object.assign(this.methods, methods);
  },

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {Function} fn The Method to add
   * @return {void}
   */
  addMethod(name, fn) {
    this.methods[name] = fn;
  }
});

/**
 * Methods that are added to object instances
 * This property is an alias for this factory type prototype
 * @name methods
 * @type {Object<string, Function>}
 * @memberOf binding.ManagedFactory<T>.prototype
 */

/**
 * The managed type of this factory
 * @name _managedType
 * @type metamodel.ManagedType
 * @protected
 * @memberOf binding.ManagedFactory<T>.prototype
 */

/**
 * The owning EntityManager where this factory belongs to
 * @name _db
 * @type EntityManager
 * @protected
 * @memberOf binding.ManagedFactory<T>.prototype
 */

/**
 * Creates a new instance of the of this type
 * @function
 * @name new
 * @param {Object<string, *>} properties Additional properties which will be applied to the created instance
 * @return {T} A new created instance of this class
 * @memberOf binding.ManagedFactory<T>.prototype
 */

module.exports = ManagedFactory;
