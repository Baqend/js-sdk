/**
 * @class jspa.metamodel.SetAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.SetAttribute = jspa.metamodel.PluralAttribute.inherit({

    collectionType: jspa.metamodel.PluralAttribute.CollectionType.SET,

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {jspa.metamodel.Type} elementType
     */
	initialize: function(declaringType, name, elementType) {
		this.superCall(declaringType, name, elementType);

		this.trackedConstructor = jspa.Set.inherit(jspa.collection.Set, {});
	}
});