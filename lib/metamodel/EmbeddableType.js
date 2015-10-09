var ManagedType = require('./ManagedType');
var Type = require('./Type');
var binding = require('../binding');

/**
 * @class baqend.metamodel.EmbeddableType
 * @extends baqend.metamodel.ManagedType
 */
var EmbeddableType = ManagedType.inherit(/** @lends baqend.metamodel.EmbeddableType.prototype */ {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  constructor: function EmbeddableType(name, typeConstructor) {
    ManagedType.call(this, name, typeConstructor);
  },

  /**
   * {@inheritDoc}
   */
  createProxyClass: function() {
    return this._enhancer.createProxy(binding.Managed);
  },

  /**
   * {@inheritDoc}
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.ManagedFactory} A factory which creates embeddable objects
   */
  createObjectFactory: function(db) {
    return binding.ManagedFactory.create(this, db);
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function (state, object) {
    if (this.typeConstructor.isInstance(object) && !object.hasOwnProperty('__metadata')) {
      object._metadata = {
        _root: state._root
      };
    }

    return this.superCall(state, object);
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function (state, jsonObject, currentObject) {
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

module.exports = EmbeddableType;