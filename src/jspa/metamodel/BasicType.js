/**
 * @class jspa.metamodel.BasicType
 * @extends jspa.metamodel.Type
 */
jspa.metamodel.BasicType = jspa.metamodel.Type.inherit({
	persistenceType: jspa.metamodel.Type.PersistenceType.BASIC,
	
	isCollection: false,
	
	/**
	 * @constructor
	 * @param {String} identifier
	 * @param {Function} typeConstructor
	 */
	initialize: function(identifier, typeConstructor) {
		if (identifier.indexOf('/') == -1)
			identifier = '/db/_native.' + identifier;

		this.superCall(identifier, typeConstructor);
	},

    /**
     * @param {jspa.util.State} state
     * @param {Object} currentValue
     * @returns {Object}
     */
    toDatabaseValue: function(state, currentValue) {
        return currentValue;
    },

    /**
     * @param {jspa.util.State} state
     * @param {*} currentValue
     * @param {*} value
     * @returns {*}
     */
    fromDatabaseValue: function(state, currentValue, value) {
        if (value === null || value === undefined) {
            return null;
        }

        return this.typeConstructor.asInstance(value);
    }
});