/**
 * @class jspa.metamodel.ListAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.ListAttribute = jspa.metamodel.PluralAttribute.inherit({

	collectionType: jspa.metamodel.PluralAttribute.CollectionType.LIST,

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {jspa.metamodel.Type} elementType
     */
	initialize: function(declaringType, name, elementType) {
		this.superCall(declaringType, name, elementType);
		
		this.trackedConstructor = jspa.List.inherit(jspa.collection.List, {});
	}
});