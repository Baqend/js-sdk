var Accessor = require('../binding/Accessor');

/**
 * @class baqend.metamodel.Attribute
 */
var Attribute = module.exports = Object.inherit(/** @lends baqend.metamodel.Attribute.prototype */ {
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
   * @type {Boolean}
   */
  get isAssociation() {
    return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
  },

  /**
   * @type {Boolean}
   */
  get isCollection() {
    return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
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
   * @type {baqend.binding.Accessor}
   */
  accessor: null,

  /**
   * @type {number}
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
   * @param {String} name The attribute name
   */
  initialize: function (name) {
    this.name = name;
  },

  /**
   * @param {baqend.metamodel.ManagedType} declaringType The type that owns this attribute
   */
  init: function(declaringType) {
    if (this.declaringType)
      throw new Error('The attribute is already initialized.');

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
   * Converts this attribute field to json
   * @abstract
   * @returns {Object}
   */
  toJSON: function() {}
});