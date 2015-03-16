var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');
var SetAttribute;

/**
 * @class baqend.metamodel.SetAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var SetAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.SetAttribute.prototype */ {

  extend: {
    ref: '/db/collection.Set'
  },

  collectionType: PluralAttribute.CollectionType.SET,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor: function SetAttribute(name, elementType) {
    PluralAttribute.call(this, name, elementType);

    this.typeConstructor = collection.Set;
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: SetAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
});

module.exports = SetAttribute;