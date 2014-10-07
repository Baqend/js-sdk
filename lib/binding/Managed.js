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
    Object.defineProperty(this, '_metadata', {
      value: new Metadata(this),
      configurable: true
    });
    return this._metadata;
  }
});




