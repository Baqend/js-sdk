/**
 * @class jspa.metamodel.EntityType
 * @extends jspa.metamodel.ManagedType
 */
jspa.metamodel.EntityType = jspa.metamodel.ManagedType.inherit({
	persistenceType: jspa.metamodel.Type.PersistenceType.ENTITY,
	
	declaredId: null,
	declaredVersion: null,
	
	/**
	 * @type {String}
	 */
	id: {
		get: function() {
			return this.declaredId || this.supertype.id;
		}
	},
	
	/**
	 * @type {String}
	 */
	version: { 
		get: function() {
			return this.declaredVersion || this.supertype.version;
		}
	},

    /**
     * @constructor
     * @param {String} identifier
     * @param {jspa.metamodel.EntityType} supertype
     * @param {Function} typeConstructor
     */
    initialize: function(identifier, supertype, typeConstructor) {
        this.superCall(identifier, typeConstructor);

        this.supertype = supertype;
    },

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {Object} value
     * @return {*}
     */
	fromDatabaseValue: function(state, obj, value) {
        if (state.entity == obj) {
            this.superCall(state, obj, value);
            return obj;
        } else if (value) {
			return state.entityManager.getReference(value);
		} else {
			return null;
		}
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {Object}
     */
	toDatabaseValue: function(state, obj) {
        if (state.entity == obj) {
            var value = this.superCall(state, obj);
            var info = value._objectInfo;

            var oid = state.getReference();
            if (oid) {
                info['oid'] = oid;
            }

            var version = state.getVersion();
            if (version) {
                info['version'] = version;
            }

            var transaction = state.getTransactionIdentifier();
            if (transaction) {
                info['transaction'] = transaction;
            }

            return value;
        } else if (this.typeConstructor.isInstance(obj)) {
            var valueState = jspa.util.State.get(obj);
            if (valueState && !valueState.isDeleted) {
                var data = valueState.getReference();
                if (data) {
                    return data;
                } else {
                    state.isDirty = true;
                }
            }
        }
		
		return null;
	}
});