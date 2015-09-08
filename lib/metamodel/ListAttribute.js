"use strict";

var PluralAttribute = require('./PluralAttribute');

/**
 * @class baqend.metamodel.ListAttribute
 * @extends baqend.metamodel.PluralAttribute
 *
 * @param {String} name
 * @param {baqend.metamodel.Type} elementType
 */
class ListAttribute extends PluralAttribute {

  static get ref() {
    return '/db/collection.List'
  }

  get collectionType() {
    return PluralAttribute.CollectionType.LIST;
  }

  constructor(name, elementType) {
    super(name, elementType);
    this.typeConstructor = Array;
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

        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      for (var i = 0, len = json.length; i < len; ++i) {
        value[i] = this.elementType.fromJsonValue(state, json[i], value[i]);
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
      type: ListAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
}

module.exports = ListAttribute;