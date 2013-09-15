/**
 * @class jspa.metamodel.Attribute
 */
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
	isId: false,

	/**
	 * @type {Boolean}
	 */
	isVersion: false,
	
	/**
	 * @constructor
	 * @param {jspa.metamodel.EntityType} declaringType
	 * @param {String} name
	 */
	initialize: function(declaringType, name) {
		this.accessor = new jspa.binding.Accessor();
		this.declaringType = declaringType;
		this.name = name;
	},
	
	/**
	 * @param {Object} entity
	 * @returns {*}
	 */
	getValue: function(entity) {
        if (this.isId || this.isVersion)
            return entity._objectInfo[this.name];

        return this.accessor.getValue(entity, this);
	},
	
	/**
	 * @param {Object} entity
	 * @param {*} value
	 */
	setValue: function(entity, value) {
        if (this.isId || this.isVersion) {
            entity._objectInfo[this.name] = value;
        } else {
            this.accessor.setValue(entity, this, value);
        }
	}
});