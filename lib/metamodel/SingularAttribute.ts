'use strict';

import { Attribute, PersistentAttributeType } from "./Attribute";
import { PersistenceType, Type } from "./Type";
import { Class, Json, JsonArray, JsonMap } from "../util";
import { Metadata } from "../intersection";
import { Managed } from "../binding";

export class SingularAttribute<T> extends Attribute<T> {
  public type: Type<T>;
  
  /**
   * The constructor of the element type of this attribute
   */
  get typeConstructor(): Class<T> {
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
   * @param name
   * @param type
   * @param isMetadata <code>true</code> if the attribute is an metadata attribute
   */
  constructor(name: string, type: Type<T>, isMetadata?: boolean) {
    super(name, isMetadata);
    this.type = type;
  }

  /**
   * @inheritDoc
   */
  getJsonValue(state: Metadata, object: Managed, options: { excludeMetadata?: boolean; depth?: number | boolean, persisting: boolean }): Json | undefined {
    return this.type.toJsonValue(state, this.getValue(object), options);
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state: Metadata, object: Managed, jsonValue: Json, options: { onlyMetadata?: boolean, persisting: boolean }) {
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