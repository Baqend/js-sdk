import { CollectionType, PluralAttribute } from './PluralAttribute';
import { Attribute } from './Attribute';
import { Type } from './Type';
import { JsonArray, JsonMap } from '../util';
import { Managed } from '../binding';
import { ManagedState } from '../intersection';

export class SetAttribute<T> extends PluralAttribute<Set<T | null>, T> {
  /**
   * Get the type id for this set type
   * @return
   */
  static get ref(): string {
    return '/db/collection.Set';
  }

  /**
   * @inheritDoc
   */
  get collectionType() {
    return CollectionType.SET;
  }

  /**
   * @param name The name of the attribute
   * @param elementType The element type of the collection
   */
  constructor(name: string, elementType: Type<T>) {
    super(name, Set, elementType);
  }

  /**
   * @inheritDoc
   */
  getJsonValue(state: ManagedState, object: Managed,
    options: { excludeMetadata?: boolean; depth?: number | boolean, persisting: boolean }): JsonArray | null {
    const value = this.getValue(object);

    if (!(value instanceof this.typeConstructor)) {
      return null;
    }

    const persisting: { [key: string]: T | null } = {};
    const persistedState: JsonMap = Attribute.attachState(value) || {};
    let changed = Attribute.attachSize(value) !== value.size;

    const json: JsonArray = [];
    const iter = value.values();
    for (let item = iter.next(); !item.done; item = iter.next()) {
      const el = item.value;
      const jsonValue = this.elementType.toJsonValue(state, el, options);
      json.push(jsonValue);

      const keyValue = this.keyValue(jsonValue);
      persisting[keyValue] = el;
      changed = changed || persistedState[keyValue] !== el;
    }

    if (options.persisting) {
      Attribute.attachState(value, persisting, true);
      Attribute.attachSize(value, value.size);
    }

    if (changed) {
      state.setDirty();
    }

    return json;
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state: ManagedState, object: Managed, json: JsonArray,
    options: { onlyMetadata?: boolean; persisting: boolean }): void {
    let value: Set<T | null> | null = null;

    if (json) {
      value = this.getValue(object);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(); // eslint-disable-line new-cap
      }

      const persisting: { [keyValue: string]: T | null } = {};
      const persistedState: { [keyValue: string]: T | null } = Attribute.attachState(value) || {};

      value.clear();
      for (let i = 0, len = json.length; i < len; i += 1) {
        const jsonValue = json[i];
        const keyValue = this.keyValue(jsonValue);

        const el = this.elementType.fromJsonValue(state, jsonValue, persistedState[keyValue], options);
        value.add(el);

        persisting[keyValue] = el;
      }

      if (options.persisting) {
        Attribute.attachState(value, persisting, true);
        Attribute.attachSize(value, value.size);
      }
    }

    this.setValue(object, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return {
      type: `${SetAttribute.ref}[${this.elementType.ref}]`,
      ...super.toJSON(),
    };
  }
}
