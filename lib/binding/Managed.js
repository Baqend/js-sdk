var Metadata = require('../util/Metadata');

/**
 * @mixin baqend.binding.Managed
 */
var Managed = module.exports = Trait.inherit(/** @lends baqend.binding.Managed.prototype */ {

  /**
   * The metadata of this object
   * @type baqend.util.Metadata
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