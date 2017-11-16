'use strict';

const Enhancer = require('./Enhancer');
const Metadata = require('../util/Metadata');

/**
 * @alias binding.Managed
 */
class Managed {
  /**
   * Initialize the given instance
   * @param {binding.Managed} instance The managed instance to initialize
   * @param {Object=} properties The optional properties to set on the instance
   */
  static init(instance, properties) {
    const type = Enhancer.getBaqendType(instance.constructor);
    if (type) {
      Object.defineProperty(instance, '_metadata', {
        value: Metadata.create(type, instance),
        configurable: true,
      });
    }

    if (properties) {
      Object.assign(instance, properties);
    }
  }

  /**
   * Creates a subclass of this class
   * @param {Class<*>} childClass
   * @return {Class<*>} The extended child class
   */
  static extend(childClass) {
    childClass.prototype = Object.create(this.prototype, {
      constructor: {
        value: childClass,
        configurable: true,
        writable: true,
      },
    });
    childClass.extend = Managed.extend;
    return childClass;
  }

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */
  constructor(properties) {
    Managed.init(this, properties);
  }
}

Object.defineProperties(Managed.prototype, /** @lends binding.Managed.prototype */ {
  /**
   * Converts the managed object to an JSON-Object.
   * @return {json} JSON-Object
   * @method
   */
  toJSON: {
    value: function toJSON() {
      return this.metadata.type.toJsonValue(this.metadata, this, {});
    },
  },
});

/**
 * Contains the metadata of this managed object
 * @type util.Metadata
 * @name metadata
 * @memberOf binding.Managed
 * @private
 */

module.exports = Managed;
