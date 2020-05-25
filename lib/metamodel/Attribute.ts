'use strict';

import { Accessor } from "../binding";
import { JsonMap } from "../util";
import { Metadata } from "../util";
import { ManagedType } from "./ManagedType";

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

  get isCollection(): boolean {
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
   * @param {ManagedType} declaringType The type that owns this attribute
   * @param {number} order Position of the attribute
   * @return {void}
   */
  init(declaringType, order) {
    if (this.declaringType) {
      throw new Error('The attribute is already initialized.');
    }

    this.order = order;
    this.accessor = new Accessor();
    this.declaringType = declaringType;
  }

  /**
   * @param {Object} entity
   * @return {*}
   */
  getValue(entity): T {
    return this.accessor!!.getValue(entity, this);
  }

  /**
   * @param {Object} entity
   * @param value
   */
  setValue(entity, value: T | null): void {
    this.accessor!!.setValue(entity, this, value);
  }

  /**
   * Retrieves whether this type has specific metadata
   *
   * @param {string} key
   * @return {boolean}
   */
  hasMetadata(key) {
    return this.metadata && !!this.metadata[key];
  }

  /**
   * Gets some metadata of this type
   *
   * @param {string} key
   * @return {null|string}
   */
  getMetadata(key) {
    if (!this.hasMetadata(key)) {
      return null;
    }

    return this.metadata!![key] || null;
  }

  /**
   * Gets this attribute value form the object as json
   * @param state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @param {Object} options additional options which are applied through the conversion
   * @return {*} The converted json value
   */
  abstract getJsonValue(state: Metadata, object, options);

  /**
   * Sets this attribute value from json to the object
   * @param state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   * @param {Object} options additional options which are applied through the conversion
   * @return {void}
   */
  abstract setJsonValue(state: Metadata, object, jsonValue, options);

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


