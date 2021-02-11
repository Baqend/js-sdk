import { Attribute, PersistentAttributeType } from './Attribute';
import { PersistenceType, Type } from './Type';
import {
  Class, Json,
} from '../util';
import { Managed } from '../binding';
import { ManagedState } from '../intersection';

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
  getJsonValue(state: ManagedState, object: Managed,
    options: { excludeMetadata?: boolean; depth?: number | boolean; persisting: boolean }): Json | undefined {
    const persistedState: { [key: string]: any } = Attribute.attachState(object, {});
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
  setJsonValue(state: ManagedState, object: Managed, jsonValue: Json,
    options: { onlyMetadata?: boolean; persisting: boolean }): void {
    const value = this.type.fromJsonValue(state, jsonValue, this.getValue(object), options);

    if (options.persisting) {
      const persistedState: { [key: string]: any } = Attribute.attachState(object, {});
      persistedState[this.name] = value;
    }

    this.setValue(object, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return {
      type: this.type.ref,
      ...super.toJSON(),
    };
  }
}
