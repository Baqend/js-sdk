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
   * @protected
   */
  _metadata: {
    get: function() {
      if(!this.__metadata) {
        this.__metadata = new Metadata(this);
      }
      return this.__metadata;
    },

    set: function(metadata) {
      if(!this.__metadata) {
        this.__metadata = metadata;
      } else {
        throw new Error("Metadata has already been set.")
      }
    }
  }

});

module.exports = Managed;