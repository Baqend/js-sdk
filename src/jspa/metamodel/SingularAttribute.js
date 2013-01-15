jspa.metamodel.SingularAttribute = jspa.metamodel.Attribute.inherit({
	
	typeConstructor: {
		get: function() {
			return this.type.typeConstructor;
		}
	},
	
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
	
	getJsonValue: function(state) {
		return this.declaringType.toJsonValue(state, this.getValue(state.entity));
	},
	
	setJsonValue: function(state, json) {
		this.setValue(this.declaringType.fromJsonValue(state, json));
	}
});