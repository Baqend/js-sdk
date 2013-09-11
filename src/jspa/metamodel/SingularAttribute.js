/**
 * @class jspa.metamodel.SingularAttribute
 * @extends jspa.metamodel.Attribute
 */
jspa.metamodel.SingularAttribute = jspa.metamodel.Attribute.inherit({
	
	typeConstructor: {
		get: function() {
			return this.type.typeConstructor;
		}
	},

    /**
     * @constructor
     * @param {jspa.metamodel.EntityType} declaringType
     * @param {String} name
     * @param {jspa.metamodel.Type} type
     */
	initialize: function(declaringType, name, type) {
		this.superCall(declaringType, name);
		
		this.type = type;

		switch (type.persistenceType) {
			case jspa.metamodel.Type.PersistenceType.BASIC:				
				this.persistentAttributeType = jspa.metamodel.Attribute.PersistentAttributeType.BASIC;
				break;
			case jspa.metamodel.Type.PersistenceType.EMBEDDABLE:
				this.persistentAttributeType = jspa.metamodel.Attribute.PersistentAttributeType.EMBEDDED;
				break;
			case jspa.metamodel.Type.PersistenceType.ENTITY:
				this.persistentAttributeType = jspa.metamodel.Attribute.PersistentAttributeType.ONE_TO_MANY;
				break;
		}
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {*}
     */
	getDatabaseValue: function(state, obj) {
		return this.type.toDatabaseValue(state, this.getValue(obj));
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {*} value
     */
	setDatabaseValue: function(state, obj, value) {
		this.setValue(obj, this.type.fromDatabaseValue(state, this.getValue(obj), value));
	}
});