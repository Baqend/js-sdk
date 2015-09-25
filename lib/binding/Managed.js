"use strict";

var Metadata = require('../util/Metadata');

/**
 * @class baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
class Managed {

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