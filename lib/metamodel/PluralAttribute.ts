'use strict';

import { Class, Json, JsonMap } from "../util";
import { Type } from "./Type";
import { Attribute, PersistentAttributeType } from "./Attribute";

const ATTACHED_STATE = Symbol('AttachedState');
const ATTACHED_SIZE = Symbol('AttachedSize');

export enum CollectionType {
  COLLECTION = 0,
  LIST = 1,
  MAP = 2,
  SET = 3,
}

export abstract class PluralAttribute<T, E> extends Attribute<T> {
  public elementType: Type<E>;
  public typeConstructor: Class<T>;

  /**
   * Returns the previously attached state of the given collection
   * @param collection The collection on which the state was attached
   * @return The actual attached state or null if no state was previously attached
   */
  static getAttachedState(collection: Array<any> | Set<any> | Map<any, any>): any {
    return collection[ATTACHED_STATE] || null;
  }

  /**
   * Attach the the given state on the collection, in a meaner that it isn't enumerable
   * @param collection The collection where the state should be attached on
   * @param state The state which should be attached
   * @return
   */
  static attachState(collection: Array<any> | Set<any> | Map<any, any>, state: any): void {
    // ensure that this property is not visible on browsers which do not support Symbols
    Object.defineProperty(collection, ATTACHED_STATE, { value: state, configurable: true });
  }

  /**
   * Returns the previously attached size of the given collection
   * @param collection The collection on which the size was attached
   * @return The actual attached state or -1 if no size was previously attached
   */
  static getAttachedSize(collection: Set<any> | Map<any, any>): number {
    return collection[ATTACHED_SIZE];
  }

  /**
   * Attach the the given size on the collection, in a meaner that it isn't enumerable
   * @param collection The collection where the size should be attached on
   * @param size The size which should be attached
   * @return
   */
  static attachSize(collection: Set<any> | Map<any, any>, size: number): void {
    // ensure that this property is not visible on browsers which do not support Symbols
    Object.defineProperty(collection, ATTACHED_SIZE, { value: size, configurable: true });
  }

  /**
   * Returns the collection attribute type
   */
  abstract get collectionType(): CollectionType;

  /**
   * @inheritDoc
   */
  get persistentAttributeType() {
    return PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param name - The attribute name
   * @param typeConstructor - The collection constructor of the attribute
   * @param elementType - The type of the elements of the attribute collection
   */
  protected constructor(name: string, typeConstructor: Class<T>, elementType: Type<E>) {
    super(name);
    this.elementType = elementType;
    this.typeConstructor = typeConstructor;
  }

  /**
   * Retrieves a serialized string value of the given json which can be used as object keys
   * @param json The json of which the key should be retrieved
   * @return A serialized version of the json
   */
  protected keyValue(json: Json): string {
    if (json && 'id' in (json as JsonMap)) {
      return json['id'];
    }

    return String(json);
  }
}
