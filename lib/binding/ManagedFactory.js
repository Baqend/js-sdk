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
    var factory = class Factory extends self {
      constructor() {
        return factory.newInstance.apply(factory, arguments);
        super(); //make babelify happy
      }
    };
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
   * @param {Object<*>} [properties=] A hash of initial properties
   * @param {...*} arguments Constructor arguments used for instantiation
   * @return {baqend.binding.Managed} A new created instance of T
   */
  static newInstance(properties) {
    var typeInstance;
    if (arguments.length > 1) {
      var a = arguments;
      //TODO: uggly! replace this with the spread operator if node support it
      typeInstance = new this._managedType.typeConstructor(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9]);
    } else {
      typeInstance = new this._managedType.typeConstructor(properties);
    }
    typeInstance._metadata.db = this._db;
    return typeInstance;
  }

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
  static addMethods(methods) {
    Object.assign(this.methods, methods);
  }

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {function} fn The Method to add
   */
  addMethod: function(name, fn) {
    this.methods[name] = fn;
  }
}

module.exports = ManagedFactory;