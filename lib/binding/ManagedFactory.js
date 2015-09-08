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
    var factory = class extends self {
      constructor(properties) {
        return factory.newInstance(properties);
      }
    };

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
   * Indicates if the given object is an instance of the factories type
   * @param {*} obj The instance to check
   * @return {boolean} <code>true</code> if the object is an instance of the factories type
   */
  static [Symbol.hasInstance](obj) {
    return obj instanceof this._managedType.typeConstructor;
  }

  /**
   * Creates a new instance of the factory type
   * @param {Object<*>} properties Constructor arguments used for instantiation
   * @return {baqend.binding.Managed} A new created instance of T
   */
  static newInstance(properties) {
    return new this._managedType.typeConstructor(properties);
  }

  /**
   * Adds methods to instances of this factories type
   * @param {object} methods The methods to add
   */
  static addMethods(methods) {
    Object.assign(this._managedType.typeConstructor.prototype, methods);
  }

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {function} fn The Method to add
   */
  static addMethod(name, fn) {
    this._managedType.typeConstructor.prototype[name] = fn;
  }

}

module.exports = ManagedFactory;