jspa.metamodel.BasicType = jspa.metamodel.Type.inherit({
	persistenceType: jspa.metamodel.Type.PersistenceType.BASIC,
	
	isCollection: false,
	
	/**
	 * @constructor
	 * @super jspa.metamodel.Type
	 * @memberOf jspa.metamodel.BasicType
	 * @param {String} identifier
	 * @param {Function} typeConstructor
	 */
	initialize: function(identifier, typeConstructor) {
		if (identifier.indexOf('/') == -1)
			identifier = '/db/_native.' + identifier;
		
		this.superCall(identifier, typeConstructor);
	}
});