var util = require('../util');

/**
 * @class baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
var Managed = Object.inherit(/** @lends baqend.binding.Managed.prototype */ {

  extend: {
    /**
     * Creates a subclass of this class
     * @param {Class<*>} childClass
     * @return {Class<*>} The extended child class
     */
    extend: function(childClass) {
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
  },

  constructor: function Managed(properties) {
    if (properties)
      Object.extend(this, properties);
  },

  /**
   * Converts the managed object to an JSON-Object.
   * @return {Object} JSON-Object
   */
  toJSON: function() {
    return this._metadata.type.toJsonValue(this._metadata, this);
  }
});

module.exports = Managed;