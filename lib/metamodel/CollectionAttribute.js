"use strict";

var PluralAttribute = require('./PluralAttribute');

/**
 * @alias baqend.metamodel.CollectionAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
class CollectionAttribute extends PluralAttribute {

  get collectionType() {
    PluralAttribute.CollectionType.COLLECTION;
  }

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor(name, elementType) {
    super(name, elementType);
    this.typeConstructor = null;
  }
}

module.exports = CollectionAttribute;