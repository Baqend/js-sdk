var ManagedType = require('./ManagedType').ManagedType;
var Type = require('./Type').Type;

/**
 * @class jspa.metamodel.EmbeddableType
 * @extends jspa.metamodel.ManagedType
 */
exports.EmbeddableType = EmbeddableType = ManagedType.inherit(/** @lends jspa.metamodel.EmbeddableType.prototype */ {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  /**
   * {@inheritDoc}
   * @param {jspa.util.Metadata} state {@inheritDoc}
   * @param {*} object {@inheritDoc}
   * @return {Object} {@inheritDoc}
   */
  toDatabaseValue: function (state, object) {
    if (this.typeConstructor.isInstance(object) && !object.hasOwnProperty('__jspaEntity__')) {
      Object.defineProperty(object, '__jspaEntity__', {
        value: state.entity
      });
    }

    return this.superCall(state, object);
  },

  /**
   * @param {jspa.util.Metadata} state {@inheritDoc}
   * @param {Object} jsonObject {@inheritDoc}
   * @param {*} currentObject {@inheritDoc}
   * @return {*} {@inheritDoc}
   */
  fromDatabaseValue: function (state, jsonObject, currentObject) {
    if (!currentObject && jsonObject) {
      currentObject = this.create();

      Object.defineProperty(currentObject, '__jspaEntity__', {
        value: state.entity
      });
    }

    return this.superCall(state, jsonObject, currentObject);
  },

  toString: function() {
    return "EmbeddableType(" + this.identifier + ")";
  }
});