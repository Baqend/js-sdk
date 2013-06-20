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
	
	getDatabaseValue: function(state) {
		var value = this.getValue(state);
		
		if (value) {
			if (!value.isInstanceOf(this.trackedConstructor)) {
				value = new this.trackedConstructor(value);
				value.__jspaEntity__ = state.entity;
				this.setValue(state, value);
			}
			
			var json = [];
			for (var iter = value.values(); iter.hasNext; ) {
				var el = iter.next();
				if (el === null) {
					json.push(el);
				} else {					
					el = this.elementType.toValue(state, el);
					if (el !== null)
						json.push(el);
				}
			}

			return json;
		} else {
			return null;
		}
	},
	
	setDatabaseValue: function(state, json) {
		var value = null;
		if (json) {
			value = this.getValue(state);
			
			if (value && value.isInstanceOf(this.trackedConstructor)) {
				value.clear();
			} else {
				value = new this.trackedConstructor();
				value.__jspaEntity__ = state.entity;
			}
			
			for (var i = 0, len = json.length; i < len; ++i) {
				value.add(this.elementType.fromValue(state, json[i]));
			}
		}
		
		this.setValue(state, value);
	}
});