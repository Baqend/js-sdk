var ManagedType = require('./ManagedType');
var Type = require('./Type');
var ManagedFactory = require('../binding/ManagedFactory');

/**
 * @class baqend.metamodel.EmbeddableType
 * @extends baqend.metamodel.ManagedType
 */
var EmbeddableType = module.exports = ManagedType.inherit(/** @lends baqend.metamodel.EmbeddableType.prototype */ {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  /**
   * {@inheritDoc}
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.ManagedFactory} A factory which creates embeddable objects
   */
  createObjectFactory: function(db) {
    return ManagedFactory.create(this, db);
  },

  /**
   * {@inheritDoc}
   * @param {baqend.util.Metadata} state {@inheritDoc}
   * @param {*} object {@inheritDoc}
   * @return {Object} {@inheritDoc}
   */
  toDatabaseValue: function (state, object) {
    if (this.typeConstructor.isInstance(object) && !object.hasOwnProperty('__metadata')) {
      object._metadata = {
        _root: state._root
      };
    }

    return this.superCall(state, object);
  },

  /**
   * @param {baqend.util.Metadata} state {@inheritDoc}
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
    return "EmbeddableType(" + this.ref + ")";
  }
});