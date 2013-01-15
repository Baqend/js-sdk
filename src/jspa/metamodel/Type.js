jspa.metamodel.Type = Object.inherit({
	extend: {
		PersistenceType: {
			BASIC: 0,
			EMBEDDABLE: 1,
			ENTITY: 2,
			MAPPED_SUPERCLASS: 3
		}
	},
	
	isBasic: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.BASIC;
		}
	},
	
	isEmbeddable: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.EMBEDDABLE;
		}
	},
	
	isEntity: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.ENTITY;
		}
	},
	
	isMappedSuperclass: {
		get: function() {
			return this.persistenceType == jspa.metamodel.Type.PersistenceType.MAPPED_SUPERCLASS;
		}
	},
	
	/**
	 * @constructor
	 * @memberOf jspa.metamodel.Type
	 * @param {String} identifier
	 * @param {Function} typeConstructor
	 */
	initialize: function(identifier, typeConstructor) {
		this.identifier = identifier;
		this.typeConstructor = typeConstructor;
	},
	
	init: function(classUtil) {
		this.classUtil = classUtil;
		
		if (!this.classUtil.getIdentifier(this.typeConstructor))
			this.classUtil.setIdentifier(this.typeConstructor, this.identifier);
	},
	
	/**
	 * @returns {Object}
	 */
	create: function() {
		return this.classUtil.create(this);
	},
	
	/**
	 * @param {jspa.util.State} state
	 * @param {Object} value
	 * @returns {Object}
	 */
	toJsonValue: function(state, value) {
		return value;
	},
	
	/**
	 * @param {jspa.util.State} state
	 * @param {Object} json
	 * @returns {Object}
	 */
	fromJsonValue: function(state, json) {
		return this.classUtil.conv(this, json);
	}
});