"use strict";

var Factory = require('./Factory');
var Managed = require('./Managed');

/**
 * @class baqend.binding.ManagedFactory<T>
 * @extends baqend.binding.Factory<T>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {baqend.binding.Managed} The new managed instance
 */
var ManagedFactory = Factory.extend( /** @lends baqend.binding.ManagedFactory.prototype */ {

  /**
   * Creates a new ManagedFactory for the given type
   * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
   * @param {baqend.EntityManager} db
   * @return {baqend.binding.ManagedFactory} A new object factory to created instances of T
   * @static
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
   * @param {Array<*>=} args Constructor arguments used for instantiation
   * @return {baqend.binding.Managed} A new created instance of T
   */
  newInstance(args) {
    let instance = Factory.newInstance.call(this, args);
    instance._metadata.db = this._db;
    return instance;
  },

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param {Object} json
   * @returns {baqend.binding.Managed} instance
   */
  fromJSON(json) {
    var instance = this._managedType.create();
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

module.exports = ManagedFactory;