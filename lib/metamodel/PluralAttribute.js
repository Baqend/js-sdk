"use strict";

var Attribute = require('./Attribute');

/**
 * @alias metamodel.PluralAttribute
 * @extends metamodel.Attribute
 */
class PluralAttribute extends Attribute {
  
  get persistentAttributeType() {
    return Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} elementType
   */
  constructor(name, elementType) {
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