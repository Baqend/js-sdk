var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');

/**
 * @class baqend.metamodel.ListAttribute
 * @extends baqend.metamodel.PluralAttribute
 *
 * @param {String} name
 * @param {baqend.metamodel.Type} elementType
 */
var ListAttribute = module.exports = PluralAttribute.inherit(/** @lends baqend.metamodel.ListAttribute.prototype */ {

  extend: {
    ref: '/db/collection.List'
  },

  collectionType: PluralAttribute.CollectionType.LIST,

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
      type: ListAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
});