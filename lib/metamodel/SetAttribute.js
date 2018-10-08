'use strict';

const Attribute = require('./Attribute');
const PluralAttribute = require('./PluralAttribute');

/**
 * @alias metamodel.SetAttribute
 * @extends metamodel.PluralAttribute
 */
class SetAttribute extends PluralAttribute {
  /**
   * Get the type id for this set type
   * @return {string}
   */
  static get ref() {
    return '/db/collection.Set';
  }

  /**
   * @inheritDoc
   * @type PluralAttribute.CollectionType
   */
  get collectionType() {
    return PluralAttribute.CollectionType.SET;
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} elementType
   * @param {Object=} flags
   */
  constructor(name, elementType, flags) {
    super(name, elementType, flags);

    this.typeConstructor = Set;
  }

  /**
   * @inheritDoc
   */
  getJsonValue(state, object, options) {
    const value = this.getValue(object);

    if (!(value instanceof this.typeConstructor)) {
      return null;
    }

    const persisting = {};
    const persistedState = Attribute.attachState(value) || {};
    let changed = Attribute.attachSize(value) !== value.size;

    const json = [];
    const iter = value.values();
    for (let item = iter.next(); !item.done; item = iter.next()) {
      const el = item.value;
      const jsonValue = this.elementType.toJsonValue(state, el, options);
      json.push(jsonValue);

      persisting[jsonValue] = el;
      changed = changed || persistedState[jsonValue] !== el;
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
  setJsonValue(state, obj, json, options) {
    let value = null;

    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(); // eslint-disable-line new-cap
      }

      const persisting = {};
      const persistedState = Attribute.attachState(value) || {};

      value.clear();
      for (let i = 0, len = json.length; i < len; i += 1) {
        const jsonValue = json[i];
        const id = jsonValue && jsonValue.id ? jsonValue.id : jsonValue;
        const el = this.elementType.fromJsonValue(state, jsonValue, persistedState[id], options);
        value.add(el);

        persisting[id] = el;
      }

      if (options.persisting) {
        Attribute.attachState(value, persisting, true);
        Attribute.attachSize(value, value.size);
      }
    }

    this.setValue(obj, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return Object.assign({}, super.toJSON(), {
      type: SetAttribute.ref + '[' + this.elementType.ref + ']',
    });
  }
}

module.exports = SetAttribute;
