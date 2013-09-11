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
     * @param {Function} typeConstructor
     * @param {jspa.metamodel.Type} elementType
     */
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);

		this.trackedConstructor = typeConstructor.inherit(jspa.collection.Collection, {});
	}
});