var Metadata = require('../util/Metadata').Metadata;

var Managed;

/**
 * @mixin jspa.binding.Managed
 */
exports.Managed = Managed = Trait.inherit(/** @lends jspa.binding.Managed.prototype */ {

  /**
   * Gets the metadata of this object
   * @type jspa.util.Metadata
   */
  get _metadata() {
    Object.defineProperty(this, '_metadata', {
      value: new Metadata(this),
      configurable: true
    });
    return this._metadata;
  }
});




