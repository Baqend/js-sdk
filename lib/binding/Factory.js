'use strict';

const deprecated = require('../util/deprecated');

function extend(target) {
  for (let i = 1, sourceLen = arguments.length; i < sourceLen; i += 1) {
    const source = arguments[i];
    const properties = Object.getOwnPropertyNames(source);
    for (let j = 0, len = properties.length; j < len; j += 1) {
      const prop = properties[j];
      Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
    }
  }
  return target;
}

/**
 * This factory creates instances of type T, by invoking the {@link #new()} method
 * or by instantiating this factory directly
 * @class binding.Factory<T>
 *
 * @param {...*} args constructor params passed to the type constructor
 * @return {T} The new instance
 */
const Factory = extend(/** @lends binding.Factory<T>.prototype */ {

  /**
   * Creates a child factory of this factory
   * @param {Object} factoryMembers additional members applied to the child factory
   * @return {Object} The new created child Factory
   * @static
   * @ignore
   */
  extend(factoryMembers) {
    // copy all factory members to the child factory
    return extend({}, this, factoryMembers);
  },

  /**
   * Creates a new Factory for the given type
   * @param {Class<*>} type the type constructor of T
   * @return {binding.Factory} A new object factory to created instances of T
   * @static
   * @ignore
   */
  create(type) {
    // We want te explicitly name the created factory and give the constructor a properly argument name
    // eslint-disable-next-line no-shadow, no-unused-vars
    const factory = function Factory(properties) {
      return factory.newInstance(arguments);
    };

    extend(factory, this);

    // lets instanceof work properly
    factory.prototype = type.prototype;
    factory.type = type;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {...*} args Constructor arguments used for instantiation
   * @return {T} A new created instance of *
   * @instance
   */
  new(/* ...args */) {
    return this.newInstance(arguments);
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} args Constructor arguments used for instantiation
   * @return {T} A new created instance of *
   * @instance
   */
  newInstance(args) {
    if (!args || args.length === 0) {
      // eslint-disable-next-line new-cap
      return new this.type();
    }

    // es6 constructors can't be called, therefore bind all arguemnts and invoke the constructor
    // then with the bounded parameters
    // The first argument is shift out by invocation with `new`.
    const a = [null];
    Array.prototype.push.apply(a, args);
    const boundConstructor = (Function.prototype.bind.apply(this.type, a));
    // eslint-disable-next-line new-cap
    return new boundConstructor();
  },
});

deprecated(Factory, '_type', 'type');

module.exports = Factory;
