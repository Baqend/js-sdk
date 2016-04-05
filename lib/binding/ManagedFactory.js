"use strict";

/**
 * @class baqend.binding.ManagedFactory
 */
class ManagedFactory {

  /**
   * Creates a new ManagedFactory for the given type
   * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
   * @param {baqend.EntityManager} db
   * @return {baqend.binding.ManagedFactory} A new object factory to created instances of T
   */
  static create(managedType, db) {
    var self = this;
    var factory = function Factory(properties) {
      return factory.newInstance(arguments);
    };

    //copy all static methods to the factory
    Object.setPrototypeOf(factory, self);

    //lets instanceof work properly
    factory.prototype = managedType.typeConstructor.prototype;
    factory._managedType = managedType;
    factory._db = db;

    return factory;
  }

  /**
   * Methods that are added to object instances
   * This property is an alias for this factories type prototype
   * @type object
   */
  static get methods() {
    return this._managedType.typeConstructor.prototype;
  }

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {baqend.binding.Managed} A new created instance of T
   */
  static newInstance(args) {
    var typeInstance = this._managedType.create(args);
    typeInstance._metadata.db = this._db;
    return typeInstance;
  }

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param {Object} json
   * @returns {baqend.binding.Managed} instance
   */
  static fromJSON(json) {
    var instance = this.newInstance();
    var metadata = instance._metadata;
    this._managedType.fromJsonValue(metadata, json, instance);
    return instance;
  }

  /**
   * Adds methods to instances of this factories type
   * @param {object} methods The methods to add
   */
  static addMethods(methods) {
    Object.assign(this.methods, methods);
  }

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {function} fn The Method to add
   */
  static addMethod(name, fn) {
    this.methods[name] = fn;
  }
}

module.exports = ManagedFactory;