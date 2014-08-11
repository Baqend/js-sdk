var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');

/**
 * @class jspa.metamodel.CollectionAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
exports.CollectionAttribute = CollectionAttribute = PluralAttribute.inherit(/** @lends jspa.metamodel.CollectionAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.COLLECTION,

  /**
   * @param {jspa.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name, elementType);

    this.typeConstructor = collection.Collection;
  }
});