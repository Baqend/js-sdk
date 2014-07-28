var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');
var tracked = require('../tracked');

/**
 * @class jspa.metamodel.ListAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
exports.ListAttribute = ListAttribute = PluralAttribute.inherit(/** @lends jspa.metamodel.ListAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.LIST,

  /**
   * @param {jspa.metamodel.EntityType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name, elementType);

    this.typeConstructor = collection.List.inherit(tracked.List, {});
  }
});