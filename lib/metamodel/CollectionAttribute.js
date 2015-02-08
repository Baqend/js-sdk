var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');

/**
 * @class baqend.metamodel.CollectionAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var CollectionAttribute = module.exports = PluralAttribute.inherit(/** @lends baqend.metamodel.CollectionAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.COLLECTION,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (name, elementType) {
    this.superCall(name, elementType);
    this.typeConstructor = collection.Collection;
  }
});