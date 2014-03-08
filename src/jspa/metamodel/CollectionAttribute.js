/**
 * @class jspa.metamodel.CollectionAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.CollectionAttribute = jspa.metamodel.PluralAttribute.inherit({

    collectionType: jspa.metamodel.PluralAttribute.CollectionType.COLLECTION,

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {jspa.metamodel.Type} elementType
     */
	initialize: function(declaringType, name, elementType) {
		this.superCall(declaringType, name, elementType);

		this.trackedConstructor = jspa.Collection.inherit(jspa.collection.Collection, {});
	}
});