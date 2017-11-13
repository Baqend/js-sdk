'use strict';

/**
 * @alias binding.Accessor
 */
class Accessor {
  /**
   * @param {Object} object
   * @param {metamodel.Attribute} attribute
   * @returns {*}
   */
  getValue(object, attribute) {
    return object[attribute.name];
  }

  /**
   * @param {Object} object
   * @param {metamodel.Attribute} attribute
   * @param {*} value
   */
  setValue(object, attribute, value) {
    object[attribute.name] = value;
  }
}

module.exports = Accessor;
