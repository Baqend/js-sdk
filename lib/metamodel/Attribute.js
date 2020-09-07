'use strict';

const Accessor = require('../binding/Accessor');

const ATTACHED_STATE = Symbol('AttachedState');
const ATTACHED_SIZE = Symbol('AttachedSize');

/**
 * @alias metamodel.Attribute
 */
class Attribute {
  /**
   * Attach and returns the attached state of the given object or collection
   * @param {object|Array<*>|Set<*>|Map<*,*>} obj The object or collection on which the state is attached
   * @param {Array<*>|Object} [state=null] The state which should be attached, the previously attached state will be
   * returned if omitted
   * @param {boolean} [overwriteExistingValue=false] Attach the state also if a previously state is already attached
   * @return {Array<*>|Object|null} The actual or new attached state whenever a new state was provided or not
   */
  static attachState(obj, state, overwriteExistingValue) {
    if (state !== undefined && (overwriteExistingValue || obj[ATTACHED_STATE] === undefined)) {
      // ensure that this property is not visible on browsers which do not support Symbols
      Object.defineProperty(obj, ATTACHED_STATE, { value: state, configurable: true });
    }
    return obj[ATTACHED_STATE] || null;
  }

  /**
   * Attach and returns the the given size on the collection, in a meaner that it isn't enumerable
   * @param {Set<*>|Map<*,*>} collection The collection where the size is attached on
   * @param {number} size The size which should be attached, the previously attached size will be
   * returned if omitted
   * @return {number} The actual or new attached size whenever a new size was provided or not
   */
  static attachSize(collection, size) {
    if (size !== undefined) {
      // ensure that this property is not visible on browsers which do not support Symbols
      Object.defineProperty(collection, ATTACHED_SIZE, { value: size, configurable: true });
    }
    return collection[ATTACHED_SIZE] || -1;
  }

  /**
   * Returns the persistent attribute type
   * @type Attribute.PersistentAttributeType
   * @readonly
   */
  get persistentAttributeType() {
    return -1;
  }

  /**
   * @type boolean
   * @readonly
   */
  get isAssociation() {
    return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
  }

  /**
   * @type boolean
   * @readonly
   */
  get isCollection() {
    return this.persistentAttributeType === Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
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
   * @return {void}
   */
  init(declaringType, order) {
    if (this.declaringType) {
      throw new Error('The attribute is already initialized.');
    }

    this.order = order;
    this.accessor = new Accessor();
    this.declaringType = declaringType;
  }

  /**
   * @param {Object} entity
   * @return {*}
   */
  getValue(entity) {
    return this.accessor.getValue(entity, this);
  }

  /**
   * @param {Object} entity
   * @param {*} value
   * @return {void}
   */
  setValue(entity, value) {
    this.accessor.setValue(entity, this, value);
  }

  /**
   * Retrieves whether this type has specific metadata
   *
   * @param {string} key
   * @return {boolean}
   */
  hasMetadata(key) {
    return this.metadata && !!this.metadata[key];
  }

  /**
   * Gets some metadata of this type
   *
   * @param {string} key
   * @return {null|string}
   */
  getMetadata(key) {
    if (!this.hasMetadata(key)) {
      return null;
    }

    return this.metadata[key];
  }

  /**
   * Gets this attribute value form the object as json
   * @param {util.State} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @param {Object} options additional options which are applied through the conversion
   * @return {*} The converted json value
   * @abstract
   */
  getJsonValue(state, object, options) {} // eslint-disable-line no-unused-vars

  /**
   * Sets this attribute value from json to the object
   * @param {util.State} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   * @param {Object} options additional options which are applied through the conversion
   * @return {void}
   * @abstract
   */
  setJsonValue(state, object, jsonValue, options) {} // eslint-disable-line no-unused-vars

  /**
   * Converts this attribute field to json
   * @return {json} The attribute description as json
   */
  toJSON() {
    return {
      name: this.name,
      metadata: this.metadata || undefined,
      order: this.order,
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
  ONE_TO_ONE: 6,
};

module.exports = Attribute;
