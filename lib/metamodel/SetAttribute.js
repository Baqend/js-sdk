var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');
var SetAttribute;

/**
 * @class baqend.metamodel.SetAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
exports.SetAttribute = SetAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.SetAttribute.prototype */ {

  extend: {
    ref: '/db/collection.Set'
  },

  collectionType: PluralAttribute.CollectionType.SET,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function(name, elementType) {
    this.superCall(name, elementType);

    this.typeConstructor = collection.Set;
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: SetAttribute.ref + '[' + this.elementType.ref + ']'
    };
  }
});