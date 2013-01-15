jspa.metamodel.MapAttribute = jspa.metamodel.PluralAttribute.inherit({
	/**
	 * @super jspa.metamodel.PluralAttribute
	 * @memberOf jspa.metamodel.MapAttribute
	 */
	collectionType: jspa.metamodel.PluralAttribute.CollectionType.MAP,
	
	/**
	 * @constructor
	 * @memberOf jspa.metamodel.Attribute
	 * @param {jspa.metamodel.EntityType} declaringType
	 * @param {String} name
	 * @param {Function} typeConstructor
	 * @param {jspa.metamodel.Type} keyType
	 * @param {jspa.metamodel.Type} elementType
	 */
	initialize: function(declaringType, name, typeConstructor, keyType, elementType) {
		this.superCall(declaringType, name, typeConstructor, elementType);
		
		this.keyType = keyType;
	},
	
	getJsonValue: function(state) {
		var value = this.getValue(state.entity);
		
		if (value) {
			var json = [];
			for (var iter = value.items(); iter.hasNext; ) {
				var item = iter.next();
				var key = this.keyType.toJsonValue(state, item[0]);
				if (item[0] === null || key !== null) {
					json.push({
						key: key,
						value: this.elementType.toJsonValue(state, item[1])
					});
				}
			}
			
			var trackedValue = this.track(value);
			if (trackedValue != value)
				this.setValue(state, trackedValue);
			
			return json;
		} else {
			return null;
		}
	},
	
	setJsonValue: function(state, json) {
		var value = null;
		if (json) {			
			value = this.getValue(state.entity);
			
			if (value) {
				value.clear();
			}
			
			value = this.track(state, value);
			
			for (var i = 0, len = json.length; i < len; ++i) {
				var item = json[i];
				var key = this.keyType.fromJsonValue(state, item.key);
				value.set(key, this.elementType.fromJsonValue(state, item.value));
			}
		}

		this.setValue(state.entity, value);
	}
});