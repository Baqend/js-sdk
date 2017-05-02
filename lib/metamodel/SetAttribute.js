"use strict";

var PluralAttribute = require('./PluralAttribute');

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
   */
  constructor(name, elementType) {
    super(name, elementType);

    this.typeConstructor = Set;
  }

  /**
   * @inheritDoc
   */
  getJsonValue (state, object, options) {
    var value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      var persisting = {}, persistedState = value.__persistedState__ || {};
      var changed = !value.__persistedState__ || value.__persistedSize__ !== value.size;

      var json = [];
      for (let el of value) {
        let jsonValue = this.elementType.toJsonValue(state, el, options);
        json.push(jsonValue);

        persisting[jsonValue] = el;
        changed |= persistedState[jsonValue] !== el;
      }

      if (state.persisting) {
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
   * {@inheritDoc}
   */
  setJsonValue(state, obj, json) {
    var value = null;

    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor();
      }

      var persisting = {}, persistedState = value.__persistedState__  || {};

      value.clear();
      for (let i = 0, len = json.length; i < len; ++i) {
        let jsonValue = json[i];
        let id = jsonValue && jsonValue.id ? jsonValue.id : jsonValue
        let el = this.elementType.fromJsonValue(state, jsonValue, persistedState[id]);
        value.add(el);

        persisting[id] = el;
      }

      if (state.persisting) {
        Object.defineProperties(value, {
          '__persistedState__': {value: persisting, configurable: true},
          '__persistedSize__': {value: value.size, configurable: true}
        });
      }
    }

    this.setValue(obj, value);
  }

  /**
   * {@inheritDoc}
   * @returns {json} {@inheritDoc}
   */
  toJSON() {
    return {
      name: this.name,
      type: SetAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
}

module.exports = SetAttribute;
