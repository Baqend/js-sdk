import { CollectionType, PluralAttribute } from './PluralAttribute';
import { Attribute } from './Attribute';
import { JsonArray } from '../util';
import { Type } from './Type';
import { Managed } from '../binding';
import { ManagedState } from '../intersection/Metadata';

export class ListAttribute<E> extends PluralAttribute<Array<E | null>, E> {
  /**
   * Get the type id for this list type
   */
  static get ref(): string {
    return '/db/collection.List';
  }

  /**
   * @inheritDoc
   */
  get collectionType() {
    return CollectionType.LIST;
  }

  /**
   * @param name
   * @param elementType
   */
  constructor(name: string, elementType: Type<E>) {
    super(name, Array, elementType);
  }

  /**
   * @inheritDoc
   */
  getJsonValue(state: ManagedState, object: Managed,
    options: { excludeMetadata?: boolean; depth?: number | boolean; persisting: boolean }): JsonArray | null {
    const value = this.getValue(object);

    if (!(value instanceof this.typeConstructor)) {
      return null;
    }

    const len = value.length;
    const persisting: (E | null)[] = new Array(len);
    const attachedState: any[] | undefined = Attribute.attachState(value);
    const persistedState = attachedState || [];

    let changed = !attachedState || attachedState.length !== len;

    const json: JsonArray = new Array(len);
    for (let i = 0; i < len; i += 1) {
      const el = value[i];
      json[i] = this.elementType.toJsonValue(state, el, options);
      persisting[i] = el;

      changed = changed || persistedState[i] !== el;
    }

    if (options.persisting) {
      Attribute.attachState(value, persisting, true);
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
    let value: (E | null)[] | null = null;

    if (json) {
      value = this.getValue(object);

      const len = json.length;
      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(len); // eslint-disable-line new-cap
      }

      const persisting = new Array(len);
      const persistedState: any[] = Attribute.attachState(value) || [];

      // clear additional items
      if (len < value.length) {
        value.splice(len, value.length - len);
      }

      for (let i = 0; i < len; i += 1) {
        const el = this.elementType.fromJsonValue(state, json[i], persistedState[i], options);
        value[i] = el;
        persisting[i] = el;
      }

      if (options.persisting) {
        Attribute.attachState(value, persisting, true);
      }
    }

    this.setValue(object, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return {
      type: `${ListAttribute.ref}[${this.elementType.ref}]`,
      ...super.toJSON(),
    };
  }
}
