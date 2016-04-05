"use strict";

var ManagedType = require('./ManagedType');
var Type = require('./Type');
var binding = require('../binding');

/**
 * @class baqend.metamodel.EmbeddableType
 * @extends baqend.metamodel.ManagedType
 */
class EmbeddableType extends ManagedType {

  get persistenceType() {
    return Type.PersistenceType.EMBEDDABLE;
  }

  constructor(name, typeConstructor) {
    super(name, typeConstructor);
  }

  /**
   * {@inheritDoc}
   */
  createProxyClass() {
    return this._enhancer.createProxy(binding.Managed);
  }

  /**
   * {@inheritDoc}
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.ManagedFactory} A factory which creates embeddable objects
   */
  createObjectFactory(db) {
    return binding.ManagedFactory.create(this, db);
  }

  /**
   * @inheritDoc
   */
  toJsonValue(state, object) {
    if (state._root && object instanceof this.typeConstructor && !object._metadata._root) {
      object._metadata._root = state._root;
    }

    return super.toJsonValue(state, object);
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