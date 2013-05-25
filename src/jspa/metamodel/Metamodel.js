jspa.metamodel.Metamodel = Object.inherit({
	/**
	 * @constructor
	 * @memberOf jspa.metamodel.Metamodel
	 */
	initialize: function() {
		this.baseTypes = {};
		this.entities = {};
		
		this.classUtil = new jspa.binding.ClassUtil();

		this.addBaseType(new jspa.metamodel.BasicType('Boolean', Boolean));
		this.addBaseType(new jspa.metamodel.BasicType('Double', Number));
		this.addBaseType(new jspa.metamodel.BasicType('Float', Number));
		this.addBaseType(new jspa.metamodel.BasicType('Integer', Number));
		this.addBaseType(new jspa.metamodel.BasicType('Long', Number));
		this.addBaseType(new jspa.metamodel.BasicType('String', String));
		this.addBaseType(new jspa.metamodel.BasicType('Byte', Number));
		this.addBaseType(new jspa.metamodel.BasicType('Short', Number));
		this.addBaseType(new jspa.metamodel.BasicType('Date', Date));
		
		var objectModel = new jspa.metamodel.EntityType('/db/_native.Object', null, Object);
		objectModel.declaredAttributes = {};
		objectModel.declaredId = new jspa.metamodel.SingularAttribute(objectModel, jspa.metamodel.Attribute.Speacial.ID, this.baseType(String));
		objectModel.declaredVersion = new jspa.metamodel.SingularAttribute(objectModel, jspa.metamodel.Attribute.Speacial.VERSION, this.baseType(String));
		this.addEntityType(objectModel);
	},
	
	/**
	 * @param {Function} typeConstructor
	 * @returns {jspa.metamodel.EntityType}
	 */
	entity: function(typeConstructor) {
		var identifier;
		
		if (typeConstructor.isInstanceOf(String)) {			
			identifier = typeConstructor;
		} else {
			identifier = this.classUtil.getIdentifier(typeConstructor);
		}
		
		return identifier? this.entities[identifier]: null;
	},
	
	/**
	 * 
	 * @param {Function} typeConstructor
	 * @returns {jspa.metamodel.BasicType}
	 */
	baseType: function(typeConstructor) {
		var identifier;
		
		if (typeConstructor.isInstanceOf(String)) {			
			identifier = typeConstructor;
		} else {
			identifier = this.classUtil.getIdentifier(typeConstructor);
		}
		
		return identifier? this.baseTypes[identifier]: null;
	},
	
	addBaseType: function(baseType) {
		if (!this.baseTypes[baseType.identifier]) {
			baseType.init(this.classUtil);
			this.baseTypes[baseType.identifier] = baseType;
		}
	},
	
	addEntityType: function(entityType) {
		if (!this.entities[entityType.identifier]) {			
			entityType.init(this.classUtil);
			this.entities[entityType.identifier] = entityType;
		}
	}
});