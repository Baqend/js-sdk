/**
 * @class jspa.metamodel.MapAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
jspa.metamodel.MapAttribute = jspa.metamodel.PluralAttribute.inherit({

	collectionType: jspa.metamodel.PluralAttribute.CollectionType.MAP,
	
	/**
	 * @constructor
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

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {Object}
     */
	getDatabaseValue: function(state, obj) {
		var value = this.getValue(obj);

		if (value) {
			if (!this.trackedConstructor.isInstance(value)) {
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

    /**
     * @param {jspa.util.State} state
     * @param {Object} json
     */
	setDatabaseValue: function(state, json) {
		var value = null;
		if (json) {			
			value = this.getValue(state);
			
			if (this.trackedConstructor.isInstance(value)) {
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