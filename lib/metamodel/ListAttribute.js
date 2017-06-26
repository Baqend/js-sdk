"use strict";

const PluralAttribute = require('./PluralAttribute');

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
  getJsonValue (state, object, options) {
    const value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      const len = value.length;
      const persisting = new Array(len), persistedState = value.__persistedState__ || [];
      let changed = !value.__persistedState__ || persistedState.length != len;

      const json = new Array(len);
      for (let i = 0; i < len; ++i) {
        let el = value[i];
        json[i] = this.elementType.toJsonValue(state, el, options);
        persisting[i] = el;

        changed |= persistedState[i] !== el;
      }

      if (options.persisting) {
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
  setJsonValue(state, obj, json, options) {
    let value = null;

    if (json) {
      value = this.getValue(obj);

      const len = json.length;
      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(len);
      }

      const persisting = new Array(len), persistedState = value.__persistedState__ || [];

      //clear additional items
      if (len < value.length)
        value.splice(len, value.length - len);

      for (let i = 0; i < len; ++i) {
        let el = this.elementType.fromJsonValue(state, json[i], persistedState[i], options);
        persisting[i] = value[i] = el;
      }

      if (options.persisting) {
        Object.defineProperty(value, '__persistedState__', {value: persisting, configurable: true});
      }
    }

    this.setValue(obj, value);
  }

  /**
   * @inheritDoc
   */
  toJSON() {
    return Object.assign({}, super.toJSON(), {
      type: ListAttribute.ref + '[' + this.elementType.ref + ']',
    });
  }
}

module.exports = ListAttribute;
