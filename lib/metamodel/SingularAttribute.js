"use strict";

var Attribute = require('./Attribute');
var Type = require('./Type');

/**
 * @class baqend.metamodel.SingularAttribute
 * @extends baqend.metamodel.Attribute
 */
class SingularAttribute extends Attribute {

  get typeConstructor() {
    return this.type.typeConstructor;
  }

  get persistentAttributeType() {
    switch (this.type.persistenceType) {
      case Type.PersistenceType.BASIC:
        return Attribute.PersistentAttributeType.BASIC;
      case Type.PersistenceType.EMBEDDABLE:
        return Attribute.PersistentAttributeType.EMBEDDED;
      case Type.PersistenceType.ENTITY:
        return Attribute.PersistentAttributeType.ONE_TO_MANY;
    }
  }

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} type
   * @param {Boolean=} isMetadata
   */
  constructor(name, type, isMetadata) {
    super(name, isMetadata);

    /** @type baqend.metamodel.Type */
    this.type = type;
  }

  /**
   * @inheritDoc
   */
  getJsonValue(state, object) {
    return this.type.toJsonValue(state, this.getValue(object));
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state, object, jsonValue) {
    this.setValue(object, this.type.fromJsonValue(state, jsonValue, this.getValue(object)));
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type.ref,
      order: this.order
    }
  }
}

module.exports = SingularAttribute;