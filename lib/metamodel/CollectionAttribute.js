"use strict";

var PluralAttribute = require('./PluralAttribute');

/**
 * @alias baqend.metamodel.CollectionAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
class CollectionAttribute extends PluralAttribute {

  /**
   * @inheritDoc
   */
  get collectionType() {
    PluralAttribute.CollectionType.COLLECTION;
  }

  /**
   * @param {string} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor(name, elementType) {
    super(name, elementType);
    this.typeConstructor = null;
  }
}

module.exports = CollectionAttribute;