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

  create: function() {
    var instance = Object.create(this.typeConstructor.prototype);

    Object.defineProperty(instance, '_metadata', {
      value: {type: this},
      writable: false,
      enumerable: false,
      configurable: true
    });

    return instance;
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function (state, object) {
    if (state._root && this.typeConstructor.isInstance(object) && !object._metadata._root) {
      object._metadata._root = state._root;
    }

    return this.superCall(state, object);
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function (state, jsonObject, currentObject) {
    if (jsonObject) {
      if (!this.typeConstructor.isInstance(currentObject))
        currentObject = this.create();

      if (state._root && !currentObject._metadata._root)
        currentObject._metadata._root = state._root;
    }

    return this.superCall(state, jsonObject, currentObject);
  },

  toString: function() {
    return "EmbeddableType(" + this.ref + ")";
  }
});

module.exports = EmbeddableType;