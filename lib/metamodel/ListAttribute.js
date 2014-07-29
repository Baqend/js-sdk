var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');
var tracked = require('../tracked');
var ListAttribute;

/**
 * @class jspa.metamodel.ListAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
exports.ListAttribute = ListAttribute = PluralAttribute.inherit(/** @lends jspa.metamodel.ListAttribute.prototype */ {

  extend: {
    identifier: '/db/_native.collection.List'
  },

  collectionType: PluralAttribute.CollectionType.LIST,

  /**
   * @param {jspa.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name, elementType);

    this.typeConstructor = collection.List.inherit(tracked.List, {});
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: ListAttribute.identifier + '[' + this.elementType.identifier + ']'
    };
  }
});