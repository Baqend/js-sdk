"use strict";

var Accessor = require('../binding/Accessor');

/**
 * @alias baqend.metamodel.Attribute
 */
class Attribute {
  /**
   * @type Number
   */
  get persistentAttributeType() {
    return -1;
  }

  /**
   * @type Boolean
   */
  get isAssociation() {
    return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
  }

  /**
   * @type Boolean
   */
  get isCollection() {
    return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param {String} name The attribute name
   * @param {Boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
   */
  constructor(name, isMetadata) {
    /** @type Boolean */
    this.isMetadata = !!isMetadata;
    /** @type Boolean */
    this.isId = false;
    /** @type Boolean */
    this.isVersion = false;
    /** @type Boolean */
    this.isAcl = false;

    /** @type String */
    this.name = name;
    /** @type Number */
    this.order = null;
    /** @type baqend.binding.Accessor */
    this.accessor = null;
    /** @type baqend.metamodel.ManagedType */
    this.declaringType = null;
  }

  /**
   * @param {baqend.metamodel.ManagedType} declaringType The type that owns this attribute
   * @param {Number} order Position of the attribute
   */
  init(declaringType, order) {
    if (this.declaringType)
      throw new Error('The attribute is already initialized.');

    this.order = order;
    this.accessor = new Accessor();
    this.declaringType = declaringType;
  }

  /**
   * @param {Object} entity
   * @returns {*}
   */
  getValue (entity) {
    return this.accessor.getValue(entity, this);
  }

  /**
   * @param {Object} entity
   * @param {*} value
   */
  setValue (entity, value) {
    this.accessor.setValue(entity, this, value);
  }

  /**
   * Gets this attribute value form the object as json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @return {*} The converted json value
   * @abstract
   */
  getJsonValue (state, object) {}

  /**
   * Sets this attribute value from json to the object
   * @param {baqend.util.Metadata} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   * @abstract
   */
  setJsonValue (state, object, jsonValue) {}

  /**
   * Converts this attribute field to json
   * @abstract
   * @returns {Object} The attribute description as json
   */
  toJSON() {}
}

/**
 * @enum {number}
 */
Attribute.PersistentAttributeType = {
  BASIC: 0,
  ELEMENT_COLLECTION: 1,
  EMBEDDED: 2,
  MANY_TO_MANY: 3,
  MANY_TO_ONE: 4,
  ONE_TO_MANY: 5,
  ONE_TO_ONE: 6
};

module.exports = Attribute;