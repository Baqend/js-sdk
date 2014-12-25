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
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (name, elementType) {
    this.superCall(name, elementType);
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