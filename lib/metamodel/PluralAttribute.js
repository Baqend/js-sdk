"use strict";

var Attribute = require('./Attribute');

/**
 * @class baqend.metamodel.PluralAttribute
 * @extends baqend.metamodel.Attribute
 */
class PluralAttribute extends Attribute {

  get persistentAttributeType() {
    return Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor(name, elementType) {
    super(name);
    /** @type baqend.metamodel.Type */
    this.elementType = elementType;
    /** @type Function */
    this.typeConstructor = null;
  }

  /**
   * @inheritDoc
   */
  getJsonValue (state, object) {
    var value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      // convert normal collections to tracked collections
      if (state._root && !value._metadata)
        Object.defineProperty(value, '_metadata', {value: {_root: state._root}});

      var json = [];
      for (let el of value) {
        json.push(this.elementType.toJsonValue(state, el));
      }

      return json;
    } else {
      return null;
    }
  }

  /**
   * @inheritDoc
   */
  setJsonValue(state, obj, json) {
    var value = null;

    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();
      }

      if (state._root && !value._metadata)
        Object.defineProperty(value, '_metadata', {value: {_root: state._root}});

      var items = value.array;
      value.array = [];

      for (var i = 0, len = json.length; i < len; ++i) {
        value.add(this.elementType.fromJsonValue(state, json[i], items[i]));
      }
    }

    this.setValue(obj, value);
  }
}

/**
 * @enum {number}
 */
PluralAttribute.CollectionType = {
  COLLECTION: 0,
  LIST: 1,
  MAP: 2,
  SET: 3
};

module.exports = PluralAttribute;