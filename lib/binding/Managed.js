"use strict";

var util = require('../util');

/**
 * @class baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
class Managed {

  static init(instance) {
    var type = instance.constructor.__baqendType__;
    if (type) {
      Object.defineProperty(instance, '_metadata', {
        value: util.Metadata.create(type, instance),
        configurable: true
      });
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
        writable: true
      }
    });
    childClass.extend = Managed.extend;
    return childClass;
  }

  constructor(properties) {
    Managed.init(this);

    if (properties)
      Object.assign(this, properties);
  }
}

Object.defineProperties(Managed.prototype, /** @lends baqend.binding.Managed.prototype */ {
  /**
   * Converts the managed object to an JSON-Object.
   * @return {Object} JSON-Object
   */
  toJSON: {
    value: function toJSON() {
      return this._metadata.type.toJsonValue(this._metadata, this);
    }
  }
});

module.exports = Managed;