"use strict";

var Metadata = require('../util/Metadata');

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
   * The metadata of this object
   * @type baqend.util.Metadata
   * @protected
   */
  get _metadata() {
    return this.__metadata || (this._metadata = new Metadata(this));
  }

  /**
   * The metadata of this object
   * @type baqend.util.Metadata
   * @protected
   */
  set _metadata(metadata) {
    if(!this.__metadata) {
      Object.defineProperty(this, '__metadata', {
        value: metadata,
        writable: false
      });
    } else {
      throw new Error("Metadata has already been set.")
    }
  }
}

module.exports = Managed;