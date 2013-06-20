jspa.metamodel.SetAttribute = jspa.metamodel.PluralAttribute.inherit({
    /**
     * @super jspa.metamodel.PluralAttribute
     * @memberOf jspa.metamodel.SetAttribute
     */
    collectionType: jspa.metamodel.PluralAttribute.CollectionType.SET,
	
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);
		
		this.trackedConstructor = typeConstructor.inherit(jspa.collection.Set, {});
	}
});