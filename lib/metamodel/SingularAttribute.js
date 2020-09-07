'use strict';

const Attribute = require('./Attribute');
const Type = require('./Type');

/**
 * @alias metamodel.SingularAttribute
 * @extends metamodel.Attribute
 */
class SingularAttribute extends Attribute {
  /**
   * The constructor of the element type of this attribute
   * @type {Class.<*>}
   */
  get typeConstructor() {
    return this.type.typeConstructor;
  }

  /**
   * @inheritDoc
   * @type Attribute.PersistentAttributeType
   */
  get persistentAttributeType() {
    switch (this.type.persistenceType) {
      case Type.PersistenceType.BASIC:
        return Attribute.PersistentAttributeType.BASIC;
      case Type.PersistenceType.EMBEDDABLE:
        return Attribute.PersistentAttributeType.EMBEDDED;
      case Type.PersistenceType.ENTITY:
        return Attribute.PersistentAttributeType.ONE_TO_MANY;
      default:
        throw new Error('Unknown persistent attribute type.');
    }
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} type
   * @param {boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
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
    const persistedState = Attribute.attachState(object, {});
    const value = this.getValue(object);
    const changed = persistedState[this.name] !== value;

    if (options.persisting) {
      persistedState[this.name] = value;
    }

    if (changed) {
      state.setDirty();
    }

    return this.type.toJsonValue(state, value, options);
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state, object, jsonValue, options) {
    const value = this.type.fromJsonValue(state, jsonValue, this.getValue(object), options);

    if (options.persisting) {
      const persistedState = Attribute.attachState(object, {});
      persistedState[this.name] = value;
    }

    this.setValue(object, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return Object.assign({}, super.toJSON(), {
      type: this.type.ref,
    });
  }
}

module.exports = SingularAttribute;
