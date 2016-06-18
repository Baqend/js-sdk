"use strict";

var Metadata = require('../util/Metadata');

/**
 * @alias baqend.binding.Managed
 */
class Managed {

  /**
   * Initialize the given instance
   * @param instance The managed instance to initialize
   * @param {Object=} properties The optional properties to set on the instance
   */
  static init(instance, properties) {
    var type = instance.constructor.__baqendType__;
    if (type) {
      Object.defineProperty(instance, '_metadata', {
        value: Metadata.create(type, instance),
        configurable: true
      });
    }

    if (properties)
      Object.assign(instance, properties);
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

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */
  constructor(properties) {
    Managed.init(this, properties);
  }
}

Object.defineProperties(Managed.prototype, /** @lends baqend.binding.Managed.prototype */ {
  /**
   * Converts the managed object to an JSON-Object.
   * @return {Object} JSON-Object
   * @method
   */
  toJSON: {
    value: function toJSON() {
      return this._metadata.type.toJsonValue(this._metadata, this);
    }
  }
});

/**
 * Contains the metadata of this managed object
 * @type baqend.util.Metadata
 * @name _metadata
 * @memberOf baqend.binding.Managed
 * @private
 */

module.exports = Managed;