'use strict';

const Attribute = require('./Attribute');

const ATTACHED_STATE = Symbol('AttachedState');
const ATTACHED_SIZE = Symbol('AttachedSize');

/**
 * @alias metamodel.PluralAttribute
 * @extends metamodel.Attribute
 * @abstract
 */
class PluralAttribute extends Attribute {
  /**
   * Returns the previously attached state of the given collection
   * @param {Array<*>|Set<*>|Map<*,*>} collection The collection on which the state was attached
   * @return {Array<*>|Object|null} The actual attached state or null if no state was previously attached
   */
  static getAttachedState(collection) {
    return collection[ATTACHED_STATE] || null;
  }

  /**
   * Attach the the given state on the collection, in a meaner that it isn't enumerable
   * @param {Array<*>|Set<*>|Map<*,*>} collection The collection where the state should be attached on
   * @param {Array<*>|Object} state The state which should be attached
   * @return {void}
   */
  static attachState(collection, state) {
    // ensure that this property is not visible on browsers which do not support Symbols
    Object.defineProperty(collection, ATTACHED_STATE, { value: state, configurable: true });
  }

  /**
   * Returns the previously attached size of the given collection
   * @param {Set<*>|Map<*,*>} collection The collection on which the size was attached
   * @return {number} The actual attached state or -1 if no size was previously attached
   */
  static getAttachedSize(collection) {
    return collection[ATTACHED_SIZE];
  }

  /**
   * Attach the the given size on the collection, in a meaner that it isn't enumerable
   * @param {Set<*>|Map<*,*>} collection The collection where the size should be attached on
   * @param {Array<*>|Object} size The size which should be attached
   * @return {void}
   */
  static attachSize(collection, size) {
    // ensure that this property is not visible on browsers which do not support Symbols
    Object.defineProperty(collection, ATTACHED_SIZE, { value: size, configurable: true });
  }

  /**
   * Returns the collection attribute type
   * @type PluralAttribute.CollectionType
   * @name collectionType
   * @memberOf metamodel.PluralAttribute.prototype
   * @readonly
   */

  /**
   * @inheritDoc
   */
  get persistentAttributeType() {
    return Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param {string} name
   * @param {metamodel.Type} elementType
   */
  constructor(name, elementType) {
    super(name);
    /** @type metamodel.Type */
    this.elementType = elementType;
    /** @type Class<*> */
    this.typeConstructor = null;
  }
}

/**
 * @enum {number}
 */
PluralAttribute.CollectionType = {
  COLLECTION: 0,
  LIST: 1,
  MAP: 2,
  SET: 3,
};

module.exports = PluralAttribute;
