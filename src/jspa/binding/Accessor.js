jspa.binding.Accessor = Object.inherit({
	/**
	 * @memberOf jspa.binding.Accessor
	 * @param {Object} object
	 * @param {jspa.metamodel.Attribute} attribute
	 * @returns {any}
	 */
	getValue: function(object, attribute) {
		return object[attribute.name];
	},
	 
	/**
	 * @param {Object} object
	 * @param {jspa.metamodel.Attribute} attribute
	 * @param {any} value
	 */
	setValue: function(object, attribute, value) {
		object[attribute.name] = value;
	}
});