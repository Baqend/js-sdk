'use strict';

import { CollectionType, PluralAttribute } from "./PluralAttribute";
import { PersistentError } from "../error/PersistentError";
import { Type } from "./Type";
import { Class, Json, JsonMap } from "../util";

export class MapAttribute<K, V> extends PluralAttribute<Map<K | null, V | null>, V> {
  public keyType: Type<K>;

  /**
   * Get the type id for this map type
   * @return {string}
   */
  static get ref() {
    return '/db/collection.Map';
  }

  /**
   * @inheritDoc
   */
  get collectionType() {
    return CollectionType.MAP;
  }

  /**
   * @param {string} name
   * @param {Type} keyType
   * @param {Type} elementType
   */
  constructor(name: string, keyType: Type<K>, elementType: Type<V>) {
    super(name, Map, elementType);
    this.keyType = keyType;
  }

  /**
   * @inheritDoc
   */
  getJsonValue(state, object, options): JsonMap | null {
    const value = this.getValue(object);

    if (!(value instanceof this.typeConstructor)) {
      return null;
    }

    const persisting: {[key: string]: [K | null, V | null]} = {};
    const persistedState = PluralAttribute.getAttachedState(value) || {};
    let changed = PluralAttribute.getAttachedSize(value) !== value.size;

    const json: JsonMap = {};
    const iter = value.entries();
    for (let el = iter.next(); !el.done; el = iter.next()) {
      const entry = el.value;

      if (entry[0] === null || entry[0] === undefined) {
        throw new PersistentError('Map keys can\'t be null nor undefined.');
      }

      const jsonKey = this.keyValue(this.keyType.toJsonValue(state, entry[0], options));
      json[jsonKey] = this.elementType.toJsonValue(state, entry[1], options);

      persisting[jsonKey] = [entry[0], entry[1]];
      changed = changed || (persistedState[jsonKey] || [])[1] !== entry[1];
    }

    if (options.persisting) {
      PluralAttribute.attachState(value, persisting);
      PluralAttribute.attachSize(value, value.size);
    }

    if (state.isPersistent && changed) {
      state.setDirty();
    }

    return json;
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state, obj, json, options) {
    let value: Map<K | null, V | null> | null = null;

    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor();
      }

      const persisting: {[key: string]: [K | null, V | null]} = {};
      const persistedState = PluralAttribute.getAttachedState(value) || {};

      value.clear();
      const jsonKeys = Object.keys(json);
      for (let i = 0, len = jsonKeys.length; i < len; i += 1) {
        const jsonKey = jsonKeys[i];
        const persistedEntry = persistedState[jsonKey] || [];
        // ensures that "false" keys will be converted to false, disallow null as keys
        const key = this.keyType.fromJsonValue(state, jsonKey, persistedEntry[0], options);
        const val = this.elementType.fromJsonValue(state, json[jsonKey], persistedEntry[1], options);

        persisting[jsonKey] = [key, val];
        value.set(key, val);
      }

      if (options.persisting) {
        PluralAttribute.attachState(value, persisting);
        PluralAttribute.attachSize(value, value.size);
      }
    }

    this.setValue(obj, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return {
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']',
      ...super.toJSON()
    }
  }
}
