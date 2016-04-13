"use strict";

/**
 * @alias baqend.binding.Accessor
 */
class Accessor {
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @returns {*}
	 */
	getValue(object, attribute) {
		return object[attribute.name];
	}
	 
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @param {*} value
	 */
	setValue(object, attribute, value) {
		object[attribute.name] = value;
	}
}

module.exports = Accessor;