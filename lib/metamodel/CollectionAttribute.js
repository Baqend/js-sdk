"use strict";

const PluralAttribute = require('./PluralAttribute');

/**
 * @alias metamodel.CollectionAttribute
 * @extends metamodel.PluralAttribute
 */
class CollectionAttribute extends PluralAttribute {

  /**
   * @inheritDoc
   */
  get collectionType() {
    return PluralAttribute.CollectionType.COLLECTION;
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} elementType
   */
  constructor(name, elementType) {
    super(name, elementType);
    this.typeConstructor = null;
  }
}

module.exports = CollectionAttribute;