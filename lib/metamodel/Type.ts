import { Class, Json } from '../util';
import { ManagedState } from '../intersection';

export enum PersistenceType {
  BASIC = 0,
  EMBEDDABLE = 1,
  ENTITY = 2,
  MAPPED_SUPERCLASS = 3,
}

export abstract class Type<T> {
  public readonly ref: string;

  public readonly name: string;

  // this property cant be made protected right now, since it cause a wired error in the BasicTypes class
  // @see #https://github.com/microsoft/TypeScript/issues/17293
  /* protected */ _typeConstructor?: Class<T>;

  /**
   * The persistent type of this type
   */
  get persistenceType(): number {
    return -1;
  }

  /**
   * @type boolean
   * @readonly
   */
  get isBasic() {
    return this.persistenceType === PersistenceType.BASIC;
  }

  /**
   * @type boolean
   * @readonly
   */
  get isEmbeddable() {
    return this.persistenceType === PersistenceType.EMBEDDABLE;
  }

  /**
   * @type boolean
   * @readonly
   */
  get isEntity() {
    return this.persistenceType === PersistenceType.ENTITY;
  }

  /**
   * @type boolean
   * @readonly
   */
  get isMappedSuperclass() {
    return this.persistenceType === PersistenceType.MAPPED_SUPERCLASS;
  }

  /**
   * The type constructor of this type
   */
  get typeConstructor(): Class<T> {
    return this._typeConstructor!!;
  }

  /**
   * @param typeConstructor - sets the type constructor of this type if it is not already set
   */
  set typeConstructor(typeConstructor: Class<T>) {
    if (this._typeConstructor) {
      throw new Error('typeConstructor has already been set.');
    }
    this._typeConstructor = typeConstructor;
  }

  /**
   * @param ref
   * @param typeConstructor
   */
  protected constructor(ref: string, typeConstructor?: Class<T>) {
    if (ref.indexOf('/db/') !== 0) {
      throw new SyntaxError(`Type ref ${ref} is invalid.`);
    }

    this.ref = ref;
    this.name = ref.substring(4);
    this._typeConstructor = typeConstructor;
  }

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param state The root object state
   * @param jsonValue The json data to merge
   * @param currentValue The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @param options additional options which are applied through the conversion
   * @param [options.onlyMetadata=false] Indicates that only the metadata should be updated of the object
   * @param [options.persisting=false] indicates if the current state will be persisted.
   * Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
   * @return The merged object instance
   */
  abstract fromJsonValue(state: ManagedState, jsonValue: Json, currentValue: T | null,
    options: { persisting: boolean, onlyMetadata?: boolean }) : T | null;

  /**
   * Converts the given object to json
   * @param state The root object state
   * @param object The object to convert
   * @param options additional options which are applied through the conversion
   * @param [options.excludeMetadata=false] Indicates that no metadata should be exposed on the generated json
   * @param [options.depth=0] The object depth to serialize
   * @param [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent if its true
   * @return The converted object as json
   */
  abstract toJsonValue(state: ManagedState, object: T | null,
    options: { excludeMetadata?: boolean, depth?: number | boolean, persisting: boolean }): Json;
}
