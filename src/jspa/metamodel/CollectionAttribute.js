jspa.metamodel.CollectionAttribute = jspa.metamodel.PluralAttribute.inherit({
	/**
	 * @super jspa.metamodel.PluralAttribute
	 * @memberOf jspa.metamodel.CollectionAttribute
	 */
	collectionType: jspa.metamodel.PluralAttribute.CollectionType.COLLECTION,
	
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);
		
		this.trackedConstructor = typeConstructor.inherit(jspa.collection.Collection, {});
	}
});