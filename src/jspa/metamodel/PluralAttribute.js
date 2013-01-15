jspa.metamodel.PluralAttribute = jspa.metamodel.Attribute.inherit({
	extend: {
		CollectionType: {
			COLLECTION: 0,
			LIST: 1,
			MAP: 2,
			SET: 3
		}
	},
	
	persistentAttributeType: jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION,
	
	/**
	 * @constructor
	 * @memberOf jspa.metamodel.PluralAttribute
	 * @super jspa.metamodel.Attribute
	 * @param {jspa.metamodel.EntityType} declaringType
	 * @param {String} name
	 * @param {Function} typeConstructor
	 * @param {jspa.metamodel.Type} elementType
	 */
	initialize: function(declaringType, name, typeConstructor, elementType) {
		this.superCall(declaringType, name);
		
		this.typeConstructor = typeConstructor;
		this.elementType = elementType;
	},
	
	track: function(state, collection) {
		return collection;
	},
	
	getJsonValue: function(state) {
		var value = this.getValue(state.entity);
		
		if (value) {
			var json = [];
			for (var iter = value.values(); iter.hasNext; ) {
				var el = iter.next();
				if (el === null) {
					json.push(el);
				} else {					
					el = this.elementType.toJsonValue(state, el);
					if (el !== null)
						json.push(el);
				}
			}
			
			trackedValue = this.track(state, value);
			if (trackedValue != value)
				this.setValue(state.entity, trackedValue);

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
				value.add(this.elementType.fromJson(state, json[i]));
			}
		}
		
		this.setValue(state.entity, value);
	}
});