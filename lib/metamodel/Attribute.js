var Accessor = require('../binding/Accessor');

/**
 * @class baqend.metamodel.Attribute
 */
var Attribute = Object.inherit(/** @lends baqend.metamodel.Attribute.prototype */ {
  /**
   * @lends baqend.metamodel.Attribute
   */
  extend: {
    /**
     * @enum {number}
     */
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
  get isAssociation() {
    return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
  },

  /**
   * @type Boolean
   */
  get isCollection() {
    return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  },

  /**
   * @type Boolean
   */
  isId: false,

  /**
   * @type Boolean
   */
  isVersion: false,

  /**
   * @type Boolean
   */
  isAcl: false,

  /**
   * @type Boolean
   */
  isMetadata: false,

  /**
   * @type baqend.binding.Accessor
   */
  accessor: null,

  /**
   * @type Number
   */
  persistentAttributeType: -1,

  /**
   * @type baqend.metamodel.ManagedType
   */
  declaringType: null,

  /**
   * @type String
   */
  name: null,

  /**
   * @type Number
   */
  order: null,

  /**
   * @param {String} name The attribute name
   * @param {Boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
   */
  constructor: function Attribute(name, isMetadata) {
    this.name = name;
    this.isMetadata = !!isMetadata;
  },

  /**
   * @param {baqend.metamodel.ManagedType} declaringType The type that owns this attribute
   * @param {Number} order Position of the attribute
   */
  init: function(declaringType, order) {
    if (this.declaringType)
      throw new Error('The attribute is already initialized.');

    this.order = order;
    this.accessor = new Accessor();
    this.declaringType = declaringType;
  },

  /**
   * @param {Object} entity
   * @returns {*}
   */
  getValue: function (entity) {
    return this.accessor.getValue(entity, this);
  },

  /**
   * @param {Object} entity
   * @param {*} value
   */
  setValue: function (entity, value) {
    this.accessor.setValue(entity, this, value);
  },

  /**
   * Gets this attribute value form the object as json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @return {*} The converted json value
   * @abstract
   */
  getJsonValue: function (state, object) {},

  /**
   * Sets this attribute value from json to the object
   * @param {baqend.util.Metadata} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   * @abstract
   */
  setJsonValue: function (state, object, jsonValue) {},

  /**
   * Converts this attribute field to json
   * @abstract
   * @returns {Object} The attribute description as json
   */
  toJSON: function() {}
});

module.exports = Attribute;