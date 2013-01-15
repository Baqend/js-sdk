jspa.metamodel.ListAttribute = jspa.metamodel.PluralAttribute.inherit({
	/**
	 * @super jspa.metamodel.PluralAttribute
	 * @memberOf jspa.metamodel.ListAttribute
	 */
	collectionType: jspa.metamodel.PluralAttribute.CollectionType.LIST,
	
	track: function(state, value) {
		if (value && value.isInstanceOf(jspa.collection.List)) {
			return value;
		} else {
			var trackedCollection = this.typeConstructor.__jspaCollection__;
			if (!trackedCollection) {
				this.typeConstructor.__jspaCollection__ = trackedCollection = 
			}
		}
	}
});