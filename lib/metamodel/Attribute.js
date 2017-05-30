"use strict";

var Accessor = require('../binding/Accessor');

/**
 * @alias metamodel.Attribute
 */
class Attribute {

  /**
   * Returns the persistent attribute type
   * @type Attribute.PersistentAttributeType
   */
  get persistentAttributeType() {
    return -1;
  }

  /**
   * @type boolean
   */
  get isAssociation() {
    return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
  }

  /**
   * @type boolean
   */
  get isCollection() {
    return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param {string} name The attribute name
   * @param {boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
   */
  constructor(name, isMetadata) {
    /** @type boolean */
    this.isMetadata = !!isMetadata;
    /** @type boolean */
    this.isId = false;
    /** @type boolean */
    this.isVersion = false;
    /** @type boolean */
    this.isAcl = false;

    /** @type string */
    this.name = name;
    /** @type number */
    this.order = null;
    /** @type binding.Accessor */
    this.accessor = null;
    /** @type metamodel.ManagedType */
    this.declaringType = null;
    /** @type Object<string,string>|null */
    this.metadata = null;
  }

  /**
   * @param {metamodel.ManagedType} declaringType The type that owns this attribute
   * @param {number} order Position of the attribute
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
   * Retrieves whether this type has specific metadata
   *
   * @param {string} key
   * @returns {boolean}
   */
  hasMetadata(key) {
    return this.metadata && !!this.metadata[key];
  }

  /**
   * Gets some metadata of this type
   *
   * @param {string} key
   * @returns {null|string}
   */
  getMetadata(key) {
    if (!this.hasMetadata(key))
      return null;

    return this.metadata[key];
  }

  /**
   * Gets this attribute value form the object as json
   * @param {util.Metadata} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @return {*} The converted json value
   * @abstract
   */
  getJsonValue (state, object) {}

  /**
   * Sets this attribute value from json to the object
   * @param {util.Metadata} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   * @abstract
   */
  setJsonValue (state, object, jsonValue) {}

  /**
   * Converts this attribute field to json
   * @returns {json} The attribute description as json
   */
  toJSON() {
    return {
      name: this.name,
      metadata: this.metadata || undefined,
      order: this.order
    };
  }
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
