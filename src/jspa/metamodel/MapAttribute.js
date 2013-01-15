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
	
	getDatabaseValue: function(state) {
		var value = this.getValue(state);
		
		if (value) {
			if (!value.isInstanceOf(this.trackedConstructor)) {
				value = new this.trackedConstructor(value);
				value.__jspaEntity__ = state.entity;
				this.setValue(state, value);
			}
			
			var json = [];
			for (var iter = value.items(); iter.hasNext; ) {
				var item = iter.next();
				var key = this.keyType.toValue(state, item[0]);
				if (item[0] === null || key !== null) {
					json.push({
						key: key,
						value: this.elementType.toValue(state, item[1])
					});
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
				var item = json[i];
				var key = this.keyType.fromValue(state, item.key);
				value.set(key, this.elementType.fromValue(state, item.value));
			}
		}

		this.setValue(state.entity, value);
	}
});