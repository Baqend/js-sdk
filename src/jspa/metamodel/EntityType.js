jspa.metamodel.EntityType = jspa.metamodel.Type.inherit({
	AttributeIterator: util.Iterator.inherit({
		initialize: function(model) {
			this.model = model;
			
			this.index = 0;
			this.next();
		},
		
		next: function() {
			var attribute = this.model.declaredAttributes[this.index];
			
			this.index++;
			while (this.model && this.model.declaredAttributes.length == this.index) {
				this.model = this.supertype;
				this.index = 0;
			}
			
			this.hasNext = this.model != null;
			
			return attribute;
		}
	}),
	
	persistenceType: jspa.metamodel.Type.PersistenceType.ENTITY,
	
	declaredAttributes: null,
	declaredId: null,
	declaredVersion: null,
	
	/**
	 * @returns {String}
	 */
	id: {
		get: function() {
			return this.declaredId || this.supertype.id;
		}
	},
	
	/**
	 * @returns {String}
	 */
	version: { 
		get: function() {
			return this.declaredVersion || this.supertype.version;
		}
	},
	
	/** 
	 * @constructor
	 * @super jspa.metamodel.Type
	 * @memberOf jspa.metamodel.EntityType
	 * @param {String} identifier
	 * @param {jspa.metamodel.EntityType} supertype
	 * @param {Function} typeConstructor
	 */
	initialize: function(identifier, supertype, typeConstructor) {
		this.superCall(identifier, typeConstructor);

		this.supertype = supertype;
	},
	
	/**
	 * 
	 */
	init: function(classUtil) {
		this.superCall(classUtil);
		
		if (!this.typeConstructor) {
			this.typeConstructor = this.classUtil.loadClass(this);			
			this.classUtil.enhance(this, this.typeConstructor);
		}
	},
	
	attributes: function() {
		return new this.AttributeIterator(this);
	},
	
	/**
	 * @type jspa.metamodel.Attribute
	 * @param {String} name
	 * @returns {jspa.metamodel.Attribute}
	 */
	getAttribute: function(name) {
		if (name in this.declaredAttributes) {			
			return this.declaredAttributes[name];
		} else if (this.supertype) {
			return this.supertype.getAttribute(name);
		} else {
			return null;
		}
	},
	
	/**
	 * @type jspa.metamodel.Attribute
	 * @param {String} name
	 * @returns {jspa.metamodel.Attribute}
	 */
	getDeclaredAttribute: function(name) {
		return this.declaredAttributes[name] || null;
	},
	
	fromValue: function(state, value) {
		if (value) {			
			return state.entityManager.getReference(value);
		} else {
			return null;
		}
	},
	
	toValue: function(state, data) {
		value = this.superCall(state, data);
		
		if (value) {
			var valueState = value.__jspaState__;
			if (valueState && !valueState.isDeleted) {					
				var data = valueState.getIdentifier();
				if (!data)
					state.isDirty = true;
				
				return data;
			}
		}
		
		return null;
	}
});