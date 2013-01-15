jspa.PersistenceUnitUtil = Object.inherit({
	
	/**
	 * @constructor
	 * @memberOf jspa.PersistentUtil
	 * @param {jspa.Metamodel} metamodel
	 */
	initialize: function(metamodel) {
		this.metamodel = metamodel;
	},
	
	/**
	 * Return the id of the entity. A generated id is not guaranteed to be available until after the database 
	 * insert has occurred. Returns null if the entity does not yet have an id.
	 * 
	 * @param {Object} entity
	 * @param {jspa.util.State} state
	 */
	getIdentifier: function(entity) {
		var model = this.metamodel.entity(entity.constructor);
		var identifier = model.id.getValue(entity);
		if (identifier && identifier.indexOf('/temporary/') != 0) {
			return identifier.substring(identifier.lastIndexOf('/') + 1);
		}
		return null;
	},
	
	/**
	 * Determine the load state of an entity belonging to the persistence unit. This method can be used to 
	 * determine the load state of an entity passed as a reference.
	 * 
	 * @param {Object} entity - entity instance whose load state is to be determined
	 * @param {String} attributeName - optional name of attribute whose load state is to be determined
	 * @returns {Boolean} false if entity's state has not been loaded or if the attribute state has not been loaded, else true
	 */
	isLoaded: function(entity, attributeName) {
		var state = entity.__jspaState__;
		if (!state) {
			return true;
		} else if (!state.isLoaded) {
			return false;
		} else {
			if (!attributeName) {
				return true;
			} else {
				var attribute = model.getAttribute(attributeName);
				if (attribute.isAssociation) {
					var value = attribute.getValue(entity);
					return !value || this.isLoaded(value);
				} else {
					return true;
				}
			}
		}
	}
});