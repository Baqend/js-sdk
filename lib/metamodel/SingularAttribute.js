"use strict";

var Attribute = require('./Attribute');
var Type = require('./Type');

/**
 * @alias metamodel.SingularAttribute
 * @extends metamodel.Attribute
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
   * @param {string} name
   * @param {metamodel.Type} type
   * @param {boolean=} isMetadata
   */
  constructor(name, type, isMetadata) {
    super(name, isMetadata);

    /** @type metamodel.Type */
    this.type = type;
  }

  /**
   * @inheritDoc
   */
  getJsonValue(state, object, options) {
    return this.type.toJsonValue(state, this.getValue(object), options);
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
