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
        this.trackedConstructor = typeConstructor.inherit(jspa.collection.Map, {});
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

                Object.defineProperty(value, '__jspaEntity__', {
                    value: state.entity
                });

				this.setValue(obj, value);
			}

			var json = [];
			for (var iter = value.items(); iter.hasNext; ) {
				var item = iter.next();
				var key = this.keyType.toDatabaseValue(state, item[0]);
				if (item[0] === null || key !== null) {
					json.push({
						key: key,
						value: this.elementType.toDatabaseValue(state, item[1])
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
     * @param {*} obj
     * @param {Object} json
     */
	setDatabaseValue: function(state, obj, json) {
		var value = null;
		if (json) {			
			value = this.getValue(obj);
			
			if (!this.trackedConstructor.isInstance(value)) {
				value = new this.trackedConstructor();
                Object.defineProperty(value, '__jspaEntity__', {
                    value: state.entity
                });
			}

            var keys = value.seq;
            var vals = value.vals;

            if (keys.length > json.length) {
                keys.splice(json.length, keys.length - json.length);
                vals.splice(json.length, vals.length - json.length);
            }

			for (var i = 0, len = json.length; i < len; ++i) {
				var item = json[i];
				keys[i] = this.keyType.fromDatabaseValue(state, keys[i], item.key);
				vals[i] = this.elementType.fromDatabaseValue(state, vals[i], item.value);
			}

            value.size = json.length;
		}

		this.setValue(obj, value);
	}
});