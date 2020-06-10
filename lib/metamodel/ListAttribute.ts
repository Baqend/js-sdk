'use strict';

import { CollectionType, PluralAttribute } from "./PluralAttribute";
import { Json, JsonArray, Metadata } from "../util";
import { Type } from "./Type";

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
  getJsonValue(state: Metadata, object, options): JsonArray | null {
    const value = this.getValue(object);

    if (!(value instanceof this.typeConstructor)) {
      return null;
    }

    const len = value.length;
    const persisting: (E | null)[] = new Array(len);
    const attachedState = PluralAttribute.getAttachedState(value);
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
      PluralAttribute.attachState(value, persisting);
    }

    if (state.isPersistent && changed) {
      state.setDirty();
    }

    return json;
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state: Metadata, obj, json: JsonArray, options) {
    let value: (E | null)[] | null = null;

    if (json) {
      value = this.getValue(obj);

      const len = json.length;
      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(len); // eslint-disable-line new-cap
      }

      const persisting = new Array(len);
      const persistedState = PluralAttribute.getAttachedState(value) || [];

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
        PluralAttribute.attachState(value, persisting);
      }
    }

    this.setValue(obj, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return {
      type: ListAttribute.ref + '[' + this.elementType.ref + ']',
      ...super.toJSON()
    }
  }
}
