"use strict";

var PluralAttribute = require('./PluralAttribute');

/**
 * @class baqend.metamodel.SetAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
class SetAttribute extends PluralAttribute {

  static get ref() {
    return '/db/collection.Set'
  }

  get collectionType() {
    return PluralAttribute.CollectionType.SET;
  }

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor(name, elementType) {
    super(name, elementType);

    this.typeConstructor = Set;
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

      var set = Array.from(value);
      value.clear();
      for (let i = 0, len = json.length; i < len; ++i) {
        value.add(this.elementType.fromJsonValue(state, json[i], set[i]));
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
      type: SetAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
}

module.exports = SetAttribute;