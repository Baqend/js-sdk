jspa.metamodel.Attribute = Object.inherit({
	extend: {
		PersistentAttributeType: {
			BASIC: 0,
			ELEMENT_COLLECTION: 1,
			EMBEDDED: 2,
			MANY_TO_MANY: 3,
			MANY_TO_ONE: 4,
			ONE_TO_MANY: 5,
			ONE_TO_ONE: 6
		},

		Speacial: {		
			ID: '__jspaId__',
			VERSION: '__jspaVersion__'
		}
	},
	
	/**
	 * @type Boolean
	 */
	isAssociation: {
		get: function() {
			return this.persistentAttributeType > jspa.metamodel.Attribute.PersistentAttributeType.EMBEDDED;
		}
	},
	
	/**
	 * @type {Boolean}
	 */
	isCollection: {
		get: function() {
			return this.persistentAttributeType == jspa.metamodel.Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
		}
	},

	/**
	 * @type {Boolean}
	 */
	isId: {
		get: function() {
			return this.declaringType.id == this;
		}
	},

	/**
	 * @type {Boolean}
	 */
	isVersion: {
		get: function() {
			return this.declaringType.version == this;
		}
	},
	
	/**
	 * @constructor
	 * @memberOf jspa.metamodel.Attribute
	 * @param {jspa.metamodel.EntityType} declaringType
	 * @param {String} name
	 * @param {Function} typeConstructor
	 */
	initialize: function(declaringType, name) {
		this.accessor = new jspa.binding.Accessor();
		this.declaringType = declaringType;
		this.name = name;
	},
	
	/**
	 * 
	 * @param obj
	 * @returns 
	 */
	getValue: function(entity) {
		return this.declaringType.classUtil.conv(this.typeConstructor, this.accessor.getValue(entity, this));
	},
	
	setValue: function(entity, value) {
		this.accessor.setValue(entity, this, value);
	}
});