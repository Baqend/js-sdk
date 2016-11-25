"use strict";

var PluralAttribute = require('./PluralAttribute');

/**
 * @alias metamodel.ListAttribute
 * @extends metamodel.PluralAttribute
 */
class ListAttribute extends PluralAttribute {

  static get ref() {
    return '/db/collection.List'
  }

  get collectionType() {
    return PluralAttribute.CollectionType.LIST;
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} elementType
   */
  constructor(name, elementType) {
    super(name, elementType);
    this.typeConstructor = Array;
  }

  /**
   * @inheritDoc
   */
  getJsonValue (state, object) {
    var value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      var len = value.length;
      var persisting = new Array(len), persistedState = value.__persistedState__ || [];
      var changed = !value.__persistedState__ || persistedState.length != len;

      var json = new Array(len);
      for (let i = 0; i < len; ++i) {
        let el = value[i];
        json[i] = this.elementType.toJsonValue(state, el);
        persisting[i] = el;

        changed |= persistedState[i] !== el;
      }

      if (state.persisting) {
        Object.defineProperty(value, '__persistedState__', {value: persisting, configurable: true});
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

      var len = json.length;
      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(len);
      }

      var persisting = new Array(len), persistedState = value.__persistedState__ || [];

      //clear additional items
      if (len < value.length)
        value.splice(len, value.length - len);

      for (let i = 0; i < len; ++i) {
        let el = this.elementType.fromJsonValue(state, json[i], persistedState[i]);
        persisting[i] = value[i] = el;
      }

      if (state.persisting) {
        Object.defineProperty(value, '__persistedState__', {value: persisting, configurable: true});
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
      type: ListAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
}

module.exports = ListAttribute;