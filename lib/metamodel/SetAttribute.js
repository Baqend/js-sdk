var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');
var tracked = require('../tracked');
var SetAttribute;

/**
 * @class jspa.metamodel.SetAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
exports.SetAttribute = SetAttribute = PluralAttribute.inherit(/** @lends jspa.metamodel.SetAttribute.prototype */ {

  extend: {
    identifier: '/db/_native.collection.Set'
  },

  collectionType: PluralAttribute.CollectionType.SET,

  /**
   * @param {jspa.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name, elementType);

    this.typeConstructor = collection.Set.inherit(tracked.Set, {});
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: SetAttribute.identifier + '[' + this.elementType.identifier + ']'
    };
  }
});