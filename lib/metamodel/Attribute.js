var Accessor = require('../binding').Accessor;
var Attribute;

/**
 * @class jspa.metamodel.Attribute
 */
exports.Attribute = Attribute = Object.inherit(/** @lends jspa.metamodel.Attribute.prototype */ {
  /**
   * @lends jspa.metamodel.Attribute
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
  isAssociation: {
    get: function () {
      return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
    }
  },

  /**
   * @type {Boolean}
   */
  isCollection: {
    get: function () {
      return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
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
   * @type {jspa.binding.Accessor}
   */
  accessor: null,

  /**
   * @type {number}
   */
  persistentAttributeType: -1,

  /**
   * @param {jspa.metamodel.EntityType} declaringType
   * @param {String} name
   */
  initialize: function (declaringType, name) {
    this.accessor = new Accessor();

    this.declaringType = declaringType;
    this.name = name;
  },

  /**
   * @param {Object} entity
   * @returns {*}
   */
  getValue: function (entity) {
    if (this.isId || this.isVersion)
      return entity._objectInfo[this.name];

    return this.accessor.getValue(entity, this);
  },

  /**
   * @param {Object} entity
   * @param {*} value
   */
  setValue: function (entity, value) {
    if (this.isId || this.isVersion) {
      entity._objectInfo[this.name] = value;
    } else {
      this.accessor.setValue(entity, this, value);
    }
  },

  /**
   * Converts this attribute field to json
   * @abstract
   * @returns {Object}
   */
  toJSON: function() {}
});