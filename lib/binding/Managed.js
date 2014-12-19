var Metadata = require('../util/Metadata').Metadata;

var Managed;

/**
 * @mixin baqend.binding.Managed
 */
exports.Managed = Managed = Trait.inherit(/** @lends baqend.binding.Managed.prototype */ {

  /**
   * Gets the metadata of this object
   * @type baqend.util.Metadata
   */
  get _metadata() {
    if(!this.__metadata) {
      this.__metadata = new Metadata(this);
    }
    return this.__metadata;
  }

});