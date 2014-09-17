var ManagedType = require('./ManagedType').ManagedType;
var Type = require('./Type').Type;
var ManagedFactory = require('../binding/ManagedFactory').ManagedFactory;

/**
 * @class jspa.metamodel.EmbeddableType
 * @extends jspa.metamodel.ManagedType
 */
exports.EmbeddableType = EmbeddableType = ManagedType.inherit(/** @lends jspa.metamodel.EmbeddableType.prototype */ {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  /**
   * {@inheritDoc}
   * @param {jspa.EntityManager} db {@inheritDoc}
   * @return {jspa.binding.ManagedFactory} A factory which creates embeddable objects
   */
  createObjectFactory: function(db) {
    return ManagedFactory.create(this, db);
  },

  /**
   * {@inheritDoc}
   * @param {jspa.util.Metadata} state {@inheritDoc}
   * @param {*} object {@inheritDoc}
   * @return {Object} {@inheritDoc}
   */
  toDatabaseValue: function (state, object) {
    if (this.typeConstructor.isInstance(object) && !object.hasOwnProperty('_metadata')) {
      object._metadata = {
        _root: state._root
      };
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
      currentObject._metadata._root = state._root;
    }

    return this.superCall(state, jsonObject, currentObject);
  },

  toString: function() {
    return "EmbeddableType(" + this.identifier + ")";
  }
});