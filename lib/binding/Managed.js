"use strict";

var util = require('../util');

/**
 * @class baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
class Managed {

  /**
   * Creates a subclass of this class
   * @param {Class<*>} childClass
   * @return {Class<*>} The extended child class
   */
  static extend(childClass) {
    childClass.prototype = Object.create(this.prototype, {
      constructor: {
        value: childClass,
        enumerable: false,
        configurable: true,
        writable: true
      }
    });
    childClass.extend = Managed.extend;
    return childClass;
  }

  constructor(properties) {
    if (properties)
      Object.assign(this, properties);
  }

  /**
   * Converts the managed object to an JSON-Object.
   * @return {Object} JSON-Object
   */
  toJSON() {
    return this._metadata.type.toJsonValue(this._metadata, this);
  }
}

module.exports = Managed;