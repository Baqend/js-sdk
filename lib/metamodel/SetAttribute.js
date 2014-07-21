var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collections = require('../collection');
var tracked = require('../tracked');

/**
 * @class jspa.metamodel.SetAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
exports.SetAttribute = SetAttribute = PluralAttribute.inherit(/** @lends jspa.metamodel.SetAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.SET,

  /**
   * @param {jspa.metamodel.EntityType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name, elementType);

    this.trackedConstructor = collection.Set.inherit(tracked.Set, {});
  }
});