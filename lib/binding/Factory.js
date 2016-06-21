"use strict";

/**
 * This factory creates instances of type T, by invoking the {@link #new()} method or by instanciating this factory directly
 * @class
 * @alias baqend.binding.Factory
 *
 * @param {...any} arguments constructor params passed to the type constructor
 * @return {T} The new instance
 */
var Factory = extend( /** @lends baqend.binding.Factory */ {

  /**
   * Creates a child factory of this factory
   * @param {Object} factoryMembers additional members applied to the child factory
   * @returns {Object} The new created child Factory
   * @static
   * @ignore
   */
  extend(factoryMembers) {
    //copy all factory members to the child factory
    return extend({}, this, factoryMembers);
  },

  /**
   * Creates a new Factory for the given type
   * @param {Class<*>} type the type constructor of T
   * @return {baqend.binding.Factory} A new object factory to created instances of T
   * @static
   * @ignore
   */
  create(type) {
    var factory = function Factory(properties) {
      return factory.newInstance(arguments);
    };

    extend(factory, this);

    //lets instanceof work properly
    factory.prototype = type.prototype;
    factory._type = type;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {...any} arguments Constructor arguments used for instantiation
   * @return {*} A new created instance of *
   * @instance
   */
  new() {
    return this.newInstance(arguments);
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} a Constructor arguments used for instantiation
   * @return {*} A new created instance of *
   * @instance
   */
  newInstance(a) {
    var instance;
    if (!a || a.length == 0) {
      instance = new this._type();
    } else {
      //es6 constructors can't be called, therfore we must provide all arguments separately
      //TODO: uggly! replace this with the spread operator if node support it
      instance = new this._type(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9]);
    }

    return instance;
  }
});

function extend(target) {
  for (let i = 1, source; source = arguments[i]; ++i)
    for (let prop of Object.getOwnPropertyNames(source))
      Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
  return target;
}

module.exports = Factory;