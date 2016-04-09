"use strict";

var PluralAttribute = require('./PluralAttribute');
var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.MapAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
class MapAttribute extends PluralAttribute {

  static get ref() {
    return '/db/collection.Map';
  }

  get collectionType() {
    return PluralAttribute.CollectionType.MAP;
  }

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} keyType
   * @param {baqend.metamodel.Type} elementType
   */
  constructor(name, keyType, elementType) {
    super(name, elementType);
    /** @type baqend.metamodel.Type */
    this.keyType = keyType;
    this.typeConstructor = Map;
  }

  /**
   * @inheritDoc
   */
  getJsonValue (state, object) {
    var value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      var persisting = {}, persistedState = value.__persistedState__ || {};

      var json = {};
      for (let entry of value.entries()) {
        if (entry[0] === null || entry[0] === undefined)
          throw new PersistentError('Map keys can\'t be null nor undefined.');

        let jsonKey = this.keyType.toJsonValue(state, entry[0]);
        json[jsonKey] = this.elementType.toJsonValue(state, entry[1]);

        persisting[jsonKey] = [entry[0], entry[1]];

        if (!state.isReady && state.isPersistent && (persistedState[jsonKey] || [])[1] !== entry[1])
          state.setDirty();
      }

      if (!state.isReady) {
        Object.defineProperty(value, '__persistedState__', {value: persisting, configurable: true});
      }

      return json;
    } else {
      return null;
    }
  }

  /**
   * @inheritDoc
   */
  setJsonValue (state, obj, json) {
    var value = null;
    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor();
      }

      var persisting = {}, persistedState = value.__persistedState__ || {};

      value.clear();
      for (let jsonKey in json) {
        let persistedEntry = persistedState[jsonKey] || [];
        // ensure that "false" keys will be converted to false
        let key = this.keyType.name == "Boolean"? jsonKey != "false": this.keyType.fromJsonValue(state, jsonKey, persistedEntry[0]);
        let val = this.elementType.fromJsonValue(state, json[jsonKey], persistedEntry[1]);

        persisting[jsonKey] = [key, value];
        value.set(key, val);
      }

      if (!state.isReady) {
        Object.defineProperty(value, '__persistedState__', {value: persisting, configurable: true});
      }
    }

    this.setValue(obj, value);
  }

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON() {
    return {
      name: this.name,
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']',
      order: this.order
    };
  }
}

module.exports = MapAttribute;