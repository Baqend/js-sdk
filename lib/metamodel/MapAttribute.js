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

    if (value) {
      if (!value._metadata) {
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var json = {};
      for (var entry of value.entries()) {
        if (entry[0] === null || entry[0] === undefined)
          throw new PersistentError('Map keys can\'t be null nor undefined.');

        json[this.keyType.toJsonValue(state, entry[0])] = this.elementType.toJsonValue(state, entry[1]);
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
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var copy = new Map(value);
      value.clear();

      for (var key in json) {
        key = this.keyType.fromJsonValue(state, key);
        var val = this.elementType.fromJsonValue(state, json[key], copy.get(key));

        value.set(key, val);
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