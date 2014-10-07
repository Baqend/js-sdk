var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');
var ListAttribute;

/**
 * @class baqend.metamodel.ListAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
exports.ListAttribute = ListAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.ListAttribute.prototype */ {

  extend: {
    ref: '/db/_native.collection.List'
  },

  collectionType: PluralAttribute.CollectionType.LIST,

  /**
   * @param {baqend.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name, elementType);

    this.typeConstructor = collection.List;
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: ListAttribute.ref + '[' + this.elementType.ref + ']'
    };
  }
});