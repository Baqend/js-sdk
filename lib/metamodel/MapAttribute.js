"use strict";

const PluralAttribute = require('./PluralAttribute');
const PersistentError = require('../error/PersistentError');

/**
 * @alias metamodel.MapAttribute
 * @extends metamodel.PluralAttribute
 */
class MapAttribute extends PluralAttribute {

  static get ref() {
    return '/db/collection.Map';
  }

  get collectionType() {
    return PluralAttribute.CollectionType.MAP;
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} keyType
   * @param {metamodel.Type} elementType
   * @param {Object=} flags
   */
  constructor(name, keyType, elementType, flags) {
    super(name, elementType, flags);
    /** @type metamodel.Type */
    this.keyType = keyType;
    this.typeConstructor = Map;
  }

  /**
   * @inheritDoc
   */
  getJsonValue (state, object, options) {
    const value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      const persisting = {}, persistedState = value.__persistedState__ || {};
      let changed = !value.__persistedState__ || value.__persistedSize__ !== value.size;

      const json = {};
      for (let entry of value.entries()) {
        if (entry[0] === null || entry[0] === undefined)
          throw new PersistentError('Map keys can\'t be null nor undefined.');

        let jsonKey = this.keyType.toJsonValue(state, entry[0], options);
        json[jsonKey] = this.elementType.toJsonValue(state, entry[1], options);

        persisting[jsonKey] = [entry[0], entry[1]];
        changed |= (persistedState[jsonKey] || [])[1] !== entry[1];
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
  setJsonValue (state, obj, json, options) {
    let value = null;
    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor();
      }

      const persisting = {}, persistedState = value.__persistedState__ || {};

      value.clear();
      for (let jsonKey in json) {
        let persistedEntry = persistedState[jsonKey] || [];
        // ensure that "false" keys will be converted to false
        let key = this.keyType.fromJsonValue(state, jsonKey, persistedEntry[0], options);
        let val = this.elementType.fromJsonValue(state, json[jsonKey], persistedEntry[1], options);

        persisting[jsonKey] = [key, val];
        value.set(key, val);
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
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']',
    });
  }
}

module.exports = MapAttribute;
