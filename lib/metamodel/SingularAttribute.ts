'use strict';

import { Attribute, PersistentAttributeType } from "./Attribute";
import { PersistenceType, Type } from "./Type";

export class SingularAttribute<T> extends Attribute<T> {
  public type: Type<T>;
  
  /**
   * The constructor of the element type of this attribute
   * @type {Class.<*>}
   */
  get typeConstructor() {
    return this.type.typeConstructor;
  }

  /**
   * @inheritDoc
   */
  get persistentAttributeType() {
    switch (this.type.persistenceType) {
      case PersistenceType.BASIC:
        return PersistentAttributeType.BASIC;
      case PersistenceType.EMBEDDABLE:
        return PersistentAttributeType.EMBEDDED;
      case PersistenceType.ENTITY:
        return PersistentAttributeType.ONE_TO_MANY;
      default:
        throw new Error('Unknown persistent attribute type.');
    }
  }

  /**
   * @param {string} name
   * @param {Type} type
   * @param {boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
   */
  constructor(name, type, isMetadata) {
    super(name, isMetadata);
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
  setJsonValue(state, object, jsonValue, options) {
    this.setValue(object, this.type.fromJsonValue(state, jsonValue, this.getValue(object), options));
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return {
      type: this.type.ref,
      ...super.toJSON()
    }
  }
}