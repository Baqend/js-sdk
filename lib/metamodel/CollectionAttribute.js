var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');

/**
 * @class baqend.metamodel.CollectionAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var CollectionAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.CollectionAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.COLLECTION,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor: function CollectionAttribute(name, elementType) {
    PluralAttribute.call(this, name, elementType);
    this.typeConstructor = collection.Collection;
  }
});

module.exports = CollectionAttribute;