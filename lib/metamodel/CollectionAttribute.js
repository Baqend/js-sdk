var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');

/**
 * @class baqend.metamodel.CollectionAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
exports.CollectionAttribute = CollectionAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.CollectionAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.COLLECTION,

  /**
   * @param {baqend.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name, elementType);

    this.typeConstructor = collection.Collection;
  }
});