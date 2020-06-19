'use strict';

import { Accessor, Entity, Managed } from "../binding";
import { Json, JsonMap } from "../util";
import { Metadata } from "../intersection";
import { ManagedType } from "./ManagedType";
import { PluralAttribute } from "./PluralAttribute";

export enum PersistentAttributeType {
  BASIC = 0,
  ELEMENT_COLLECTION = 1,
  EMBEDDED = 2,
  MANY_TO_MANY = 3,
  MANY_TO_ONE = 4,
  ONE_TO_MANY = 5,
  ONE_TO_ONE = 6,
}

export abstract class Attribute<T> {
  public static readonly PersistentAttributeType = PersistentAttributeType;

  public isMetadata: boolean;
  public isId = false;
  public isVersion = false;
  public isAcl = false;

  public name: string;
  public order: number | null = null;
  public accessor: Accessor | null = null;
  public declaringType: ManagedType<any> | null = null;
  public metadata: {[name: string]: string} | null = null;

  /**
   * Returns the persistent attribute type
   */
  get persistentAttributeType(): PersistentAttributeType {
    return -1;
  }

  /**
   * @type boolean
   * @readonly
   */
  get isAssociation() {
    return this.persistentAttributeType > PersistentAttributeType.EMBEDDED;
  }

  get isCollection() {
    return this.persistentAttributeType === PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param name The attribute name
   * @param isMetadata <code>true</code> if the attribute is an metadata attribute
   */
  protected constructor(name: string, isMetadata?: boolean) {
    this.isMetadata = !!isMetadata;
    this.name = name;
  }

  /**
   * @param declaringType The type that owns this attribute
   * @param order Position of the attribute
   * @return
   */
  init(declaringType: ManagedType<any>, order: number): void {
    if (this.declaringType) {
      throw new Error('The attribute is already initialized.');
    }

    this.order = order;
    this.accessor = new Accessor();
    this.declaringType = declaringType;
  }

  /**
   * @param entity
   * @return
   */
  getValue(entity: Managed): T | null {
    return this.accessor!!.getValue(entity, this);
  }

  /**
   * @param entity
   * @param value
   */
  setValue(entity: Managed, value: T | null): void {
    this.accessor!!.setValue(entity, this, value);
  }

  /**
   * Retrieves whether this type has specific metadata
   *
   * @param key
   * @return
   */
  hasMetadata(key: string): boolean {
    return !!this.metadata && key in this.metadata;
  }

  /**
   * Gets some metadata of this type
   *
   * @param key
   * @return
   */
  getMetadata(key: string): string | null {
    if (!this.hasMetadata(key)) {
      return null;
    }

    return this.metadata!![key] || null;
  }

  /**
   * Gets this attribute value form the object as json
   * @param state The root object state
   * @param object The object which contains the value of this attribute
   * @param options additional options which are applied through the conversion
   * @return The converted json value
   */
  abstract getJsonValue(state: Metadata, object: Managed, options: { excludeMetadata?: boolean; depth?: number | boolean }): Json;

  /**
   * Sets this attribute value from json to the object
   * @param state The root state
   * @param object The object which contains the attribute
   * @param jsonValue The json value to convert an set
   * @param options additional options which are applied through the conversion
   * @return
   */
  abstract setJsonValue(state: Metadata, object: Managed, jsonValue: Json, options: { onlyMetadata?: boolean }): void;

  /**
   * Converts this attribute field to json
   * @return The attribute description as json
   */
  toJSON(): JsonMap {
    return {
      name: this.name,
      order: this.order,
      ...(this.metadata && {metadata: this.metadata}),
    };
  }
}


