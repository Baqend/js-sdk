import { Accessor, Managed } from '../binding';
import { Json, JsonMap } from '../util';
import { ManagedType } from './ManagedType';
import { ManagedState } from '../intersection';

export enum PersistentAttributeType {
  BASIC = 0,
  ELEMENT_COLLECTION = 1,
  EMBEDDED = 2,
  MANY_TO_MANY = 3,
  MANY_TO_ONE = 4,
  ONE_TO_MANY = 5,
  ONE_TO_ONE = 6,
}

const ATTACHED_STATE = Symbol('AttachedState');
const ATTACHED_SIZE = Symbol('AttachedSize');

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

  public metadata: { [name: string]: string } | null = null;

  /**
   * Attach and returns the attached state of the given object or collection
   * @param obj The object or collection on which the state is attached
   * @param state The new state which should be attached to the object
   * @param overwriteExistingValue If true, overwrites any existing attached state with the given new state, if false
   * any previously attached state will kept and will be returned instead
   * @return The actual or new attached state whenever an existing state was found
   */
  static attachState<T>(obj: Managed | Array<any> | Set<any> | Map<any, any>, state: T,
    overwriteExistingValue?: boolean): T;

  /**
   * Retrieves the attached state of the given object or collection
   * @param obj The object or collection on which the state is attached
   * @return The actual attached state or undefined if no previous state was attached
   */
  static attachState<T>(obj: Managed | Array<any> | Set<any> | Map<any, any>): T | undefined;

  static attachState<T>(obj: Managed | Array<any> | Set<any> | Map<any, any>, state?: T,
    overwriteExistingValue: boolean = false): T | undefined {
    if (state !== undefined && (overwriteExistingValue || (obj as any)[ATTACHED_STATE] === undefined)) {
      // ensure that this property is not visible on browsers which do not support Symbols
      Object.defineProperty(obj, ATTACHED_STATE, { value: state, configurable: true });
    }
    return (obj as any)[ATTACHED_STATE];
  }

  /**
   * Attach and returns the the given size on the collection, in a meaner that it isn't enumerable
   * @param {Set<*>|Map<*,*>} collection The collection where the size is attached on
   * @param {number} size The size which should be attached, the previously attached size will be
   * returned if omitted
   * @return {number} The actual or new attached size whenever a new size was provided or not
   */
  static attachSize(collection: Set<any> | Map<any, any>, size?: number): number {
    if (size !== undefined) {
      // ensure that this property is not visible on browsers which do not support Symbols
      Object.defineProperty(collection, ATTACHED_SIZE, { value: size, configurable: true });
    }
    return (collection as any)[ATTACHED_SIZE] || -1;
  }

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
    return this.accessor!.getValue(entity, this);
  }

  /**
   * @param entity
   * @param value
   */
  setValue(entity: Managed, value: T | null): void {
    this.accessor!.setValue(entity, this, value);
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

    return this.metadata![key] || null;
  }

  /**
   * Gets this attribute value form the object as json
   * @param state The root object state
   * @param object The object which contains the value of this attribute
   * @param options additional options which are applied through the conversion
   * @return The converted json value
   */
  abstract getJsonValue(state: ManagedState, object: Managed,
    options: { excludeMetadata?: boolean; depth?: number | boolean; persisting: boolean }): Json | undefined;

  /**
   * Sets this attribute value from json to the object
   * @param state The root state
   * @param object The object which contains the attribute
   * @param jsonValue The json value to convert an set
   * @param options additional options which are applied through the conversion
   * @return
   */
  abstract setJsonValue(state: ManagedState, object: Managed, jsonValue: Json,
    options: { onlyMetadata?: boolean; persisting: boolean }): void;

  /**
   * Converts this attribute field to json
   * @return The attribute description as json
   */
  toJSON(): JsonMap {
    return {
      name: this.name,
      order: this.order,
      ...(this.metadata && { metadata: this.metadata }),
    };
  }
}
