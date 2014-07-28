var ManagedType = require('./ManagedType').ManagedType;
var Type = require('./Type').Type;

/**
 * @class jspa.metamodel.EmbeddableType
 * @extends jspa.metamodel.ManagedType
 */
exports.EmbeddableType = EmbeddableType = ManagedType.inherit(
    /**
     * @lends jspa.metamodel.EmbeddableType.prototype
     */
    {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  /**
   * @param {jspa.util.State} state
   * @param {*} obj
   * @param {Object} value
   * @return {*}
   */
  fromDatabaseValue: function (state, obj, value) {
    if (!obj && value) {
      obj = this.create();

      Object.defineProperty(obj, '__jspaEntity__', {
        value: state.entity
      });
    }

    return this.superCall(state, obj, value);
  },

  toString: function() {
    return "EmbeddableType(" + this.identifier + ")";
  }
});