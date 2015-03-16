var Metadata = require('../util/Metadata');

/**
 * @class baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
var Managed = Trait.inherit(/** @lends baqend.binding.Managed.prototype */ {

  /**
   * The metadata of this object
   * @type baqend.util.Metadata
   * @private
   */
  _metadata: {
    get: function() {
      return this.__metadata || (this._metadata = new Metadata(this));
    },

    set: function(metadata) {
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

});

module.exports = Managed;