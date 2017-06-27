"use strict";

const Attribute = require('./Attribute');

/**
 * @alias metamodel.PluralAttribute
 * @extends metamodel.Attribute
 * @abstract
 */
class PluralAttribute extends Attribute {

  /**
   * Returns the collection attribute type
   * @type PluralAttribute.CollectionType
   * @name collectionType
   * @memberOf metamodel.PluralAttribute.prototype
   */

  get persistentAttributeType() {
    return Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} elementType
   * @param {Object=} flags
   */
  constructor(name, elementType, flags) {
    super(name);
    /** @type metamodel.Type */
    this.elementType = elementType;
    /** @type Class<*> */
    this.typeConstructor = null;
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