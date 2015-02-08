/**
 * @class baqend.binding.Accessor
 */
var Accessor = module.exports = Object.inherit(/** @lends baqend.binding.Accessor.prototype */ {
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @returns {*}
	 */
	getValue: function(object, attribute) {
		return object[attribute.name];
	},
	 
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @param {*} value
	 */
	setValue: function(object, attribute, value) {
		object[attribute.name] = value;
	}
});