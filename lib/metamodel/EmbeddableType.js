"use strict";

var ManagedType = require('./ManagedType');
var Type = require('./Type');
var binding = require('../binding');

/**
 * @alias metamodel.EmbeddableType
 * @extends metamodel.ManagedType
 */
class EmbeddableType extends ManagedType {

  get persistenceType() {
    return Type.PersistenceType.EMBEDDABLE;
  }

  /**
   * @param {string} ref
   * @param {Class<binding.Entity>=} typeConstructor
   */
  constructor(ref, typeConstructor) {
    super(ref, typeConstructor);
  }

  /**
   * {@inheritDoc}
   */
  createProxyClass() {
    return this._enhancer.createProxy(binding.Managed);
  }

  /**
   * {@inheritDoc}
   * @param {EntityManager} db {@inheritDoc}
   * @return {binding.ManagedFactory<*>} A factory which creates embeddable objects
   */
  createObjectFactory(db) {
    return binding.ManagedFactory.create(this, db);
  }

  /**
   * @inheritDoc
   */
  toJsonValue(state, object, options) {
    if (state._root && object instanceof this.typeConstructor && !object._metadata._root) {
      object._metadata._root = state._root;
    }

    return super.toJsonValue(state, object, options);
  }

  /**
   * @inheritDoc
   */
  fromJsonValue(state, jsonObject, currentObject) {
    if (jsonObject) {
      if (!(currentObject instanceof this.typeConstructor))
        currentObject = this.create();

      if (state._root && !currentObject._metadata._root)
        currentObject._metadata._root = state._root;
    }

    return super.fromJsonValue(state, jsonObject, currentObject);
  }

  toString() {
    return "EmbeddableType(" + this.ref + ")";
  }
}

module.exports = EmbeddableType;
