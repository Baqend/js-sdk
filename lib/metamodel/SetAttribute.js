"use strict";

const PluralAttribute = require('./PluralAttribute');

/**
 * @alias metamodel.SetAttribute
 * @extends metamodel.PluralAttribute
 */
class SetAttribute extends PluralAttribute {

  static get ref() {
    return '/db/collection.Set'
  }

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
  getJsonValue (state, object, options) {
    const value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      const persisting = {}, persistedState = value.__persistedState__ || {};
      let changed = !value.__persistedState__ || value.__persistedSize__ !== value.size;

      const json = [];
      for (let el of value) {
        let jsonValue = this.elementType.toJsonValue(state, el, options);
        json.push(jsonValue);

        persisting[jsonValue] = el;
        changed |= persistedState[jsonValue] !== el;
      }

      if (options.persisting) {
        Object.defineProperties(value, {
          '__persistedState__': {value: persisting, configurable: true},
          '__persistedSize__': {value: value.size, configurable: true}
        });
      }

      if (state.isPersistent && changed)
        state.setDirty();

      return json;
    } else {
      return null;
    }
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state, obj, json, options) {
    let value = null;

    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor();
      }

      const persisting = {}, persistedState = value.__persistedState__ || {};

      value.clear();
      for (let i = 0, len = json.length; i < len; ++i) {
        let jsonValue = json[i];
        let id = jsonValue && jsonValue.id ? jsonValue.id : jsonValue;
        let el = this.elementType.fromJsonValue(state, jsonValue, persistedState[id], options);
        value.add(el);

        persisting[id] = el;
      }

      if (options.persisting) {
        Object.defineProperties(value, {
          '__persistedState__': {value: persisting, configurable: true},
          '__persistedSize__': {value: value.size, configurable: true}
        });
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
