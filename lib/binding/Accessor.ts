'use strict';

export class Accessor {
  /**
   * @param {Object} object
   * @param {Attribute} attribute
   * @return {*}
   */
  getValue(object, attribute) {
    return object[attribute.name];
  }

  /**
   * @param {Object} object
   * @param {Attribute} attribute
   * @param {*} value
   * @return {void}
   */
  setValue(object, attribute, value) {
    object[attribute.name] = value;
  }
}
