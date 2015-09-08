"use strict";

var ManagedType = require('./ManagedType');
var Type = require('./Type');
var ManagedFactory = require('../binding/ManagedFactory');

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
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.ManagedFactory} A factory which creates embeddable objects
   */
  createObjectFactory(db) {
    return ManagedFactory.create(this, db);
  }

  /**
   * @inheritDoc
   */
  toJsonValue (state, object) {
    if (object instanceof this.typeConstructor && !object.hasOwnProperty('__metadata')) {
      object._metadata = {
        _root: state._root
      };
    }

    return super.toJsonValue(state, object);
  }

  /**
   * @inheritDoc
   */
  fromJsonValue (state, jsonObject, currentObject) {
    if (!currentObject && jsonObject) {
      currentObject = this.create();
      currentObject._metadata._root = state._root;
    }

    return super.fromJsonValue(state, jsonObject, currentObject);
  }

  toString() {
    return "EmbeddableType(" + this.ref + ")";
  }
}

module.exports = EmbeddableType;