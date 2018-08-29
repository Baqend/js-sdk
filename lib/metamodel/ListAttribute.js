'use strict';

const PluralAttribute = require('./PluralAttribute');

/**
 * @alias metamodel.ListAttribute
 * @extends metamodel.PluralAttribute
 */
class ListAttribute extends PluralAttribute {
  /**
   * Get the type id for this list type
   * @return {string}
   */
  static get ref() {
    return '/db/collection.List';
  }

  /**
   * @inheritDoc
   * @type PluralAttribute.CollectionType
   */
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
  getJsonValue(state, object, options) {
    const value = this.getValue(object);

    if (!(value instanceof this.typeConstructor)) {
      return null;
    }

    const len = value.length;
    const persisting = new Array(len);
    const attachedState = PluralAttribute.getAttachedState(value);
    const persistedState = attachedState || [];

    let changed = !attachedState || attachedState.length !== len;

    const json = new Array(len);
    for (let i = 0; i < len; i += 1) {
      const el = value[i];
      json[i] = this.elementType.toJsonValue(state, el, options);
      persisting[i] = el;

      changed = changed || persistedState[i] !== el;
    }

    if (options.persisting) {
      PluralAttribute.attachState(value, persisting);
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
    let value = null;

    if (json) {
      value = this.getValue(obj);

      const len = json.length;
      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(len); // eslint-disable-line new-cap
      }

      const persisting = new Array(len);
      const persistedState = PluralAttribute.getAttachedState(value) || [];

      // clear additional items
      if (len < value.length) {
        value.splice(len, value.length - len);
      }

      for (let i = 0; i < len; i += 1) {
        const el = this.elementType.fromJsonValue(state, json[i], persistedState[i], options);
        value[i] = el;
        persisting[i] = el;
      }

      if (options.persisting) {
        PluralAttribute.attachState(value, persisting);
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
