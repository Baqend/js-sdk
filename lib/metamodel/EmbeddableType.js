'use strict';

const ManagedType = require('./ManagedType');
const Type = require('./Type');
const binding = require('../binding');

/**
 * @alias metamodel.EmbeddableType
 * @extends metamodel.ManagedType
 */
class EmbeddableType extends ManagedType {
  /**
   * @inheritDoc
   * @type {Type.PersistenceType}
   */
  get persistenceType() {
    return Type.PersistenceType.EMBEDDABLE;
  }

  /**
   * @param {string} ref
   * @param {Class<binding.Entity>=} typeConstructor
   * @constructor
   */

  /**
   * {@inheritDoc}
   */
  createProxyClass() {
    return this.enhancer.createProxy(binding.Managed);
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
    if (state.root && object instanceof this.typeConstructor && !object._metadata.root) {
      object._metadata.root = state.root;
    }

    return super.toJsonValue(state, object, options);
  }

  /**
   * @inheritDoc
   */
  fromJsonValue(state, jsonObject, currentObject, options) {
    let obj = currentObject;

    if (jsonObject) {
      if (!(obj instanceof this.typeConstructor)) {
        obj = this.create();
      }

      if (state.root && !obj._metadata.root) {
        obj._metadata.root = state.root;
      }
    }

    return super.fromJsonValue(state, jsonObject, obj, options);
  }

  toString() {
    return 'EmbeddableType(' + this.ref + ')';
  }
}

module.exports = EmbeddableType;
