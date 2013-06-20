jspa.metamodel.ListAttribute = jspa.metamodel.PluralAttribute.inherit({
	/**
	 * @super jspa.metamodel.PluralAttribute
	 * @memberOf jspa.metamodel.ListAttribute
	 */
	collectionType: jspa.metamodel.PluralAttribute.CollectionType.LIST,
	
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);
		
		this.trackedConstructor = typeConstructor.inherit(jspa.collection.List, {});
	}
});