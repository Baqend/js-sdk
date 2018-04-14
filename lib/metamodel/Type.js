'use strict';

const TYPE_CONSTRUCTOR = Symbol('TypeConstructor');

/**
 * @alias metamodel.Type
 */
class Type {
  /**
   * The persistent type of this type
   * @type number
   * @abstract
   */
  get persistenceType() {
    return -1;
  }

  /**
   * @type boolean
   */
  get isBasic() {
    return this.persistenceType === Type.PersistenceType.BASIC;
  }

  /**
   * @type boolean
   */
  get isEmbeddable() {
    return this.persistenceType === Type.PersistenceType.EMBEDDABLE;
  }

  /**
   * @type boolean
   */
  get isEntity() {
    return this.persistenceType === Type.PersistenceType.ENTITY;
  }

  /**
   * @type boolean
   */
  get isMappedSuperclass() {
    return this.persistenceType === Type.PersistenceType.MAPPED_SUPERCLASS;
  }

  /**
   * @return {Class<*>}
   */
  get typeConstructor() {
    return this[TYPE_CONSTRUCTOR];
  }

  /**
   * @param {Class<*>} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if (this[TYPE_CONSTRUCTOR]) {
      throw new Error('typeConstructor has already been set.');
    }
    this[TYPE_CONSTRUCTOR] = typeConstructor;
  }

  /**
   * @param {string} ref
   * @param {Class<*>=} typeConstructor
   */
  constructor(ref, typeConstructor) {
    if (ref.indexOf('/db/') !== 0) {
      throw new SyntaxError('Type ref ' + ref + ' is invalid.');
    }

    /** @type string */
    this.ref = ref;
    /** @type string */
    this.name = ref.substring(4);
    this[TYPE_CONSTRUCTOR] = typeConstructor;
  }

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param {util.Metadata} state The root object state
   * @param {json} jsonValue The json data to merge
   * @param {*} currentValue The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @param {Object} options additional options which are applied through the conversion
   * @param {boolean} [options.onlyMetadata=false] Indicates that only the metadata should be updated of the object
   * @return {*} The merged object instance
   * @abstract
   */
  fromJsonValue(state, jsonValue, currentValue, options) {} // eslint-disable-line no-unused-vars

  /**
   * Converts the given object to json
   * @param {util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @param {Object} options additional options which are applied through the conversion
   * @param {boolean} [options.excludeMetadata=false] Indicates that no metadata should be exposed on the generated json
   * @param {number|boolean} [options.depth=0] The object depth to serialize
   * @return {json} The converted object as json
   * @abstract
   */
  toJsonValue(state, object, options) {} // eslint-disable-line no-unused-vars
}

/**
 * @enum {number}
 */
Type.PersistenceType = {
  BASIC: 0,
  EMBEDDABLE: 1,
  ENTITY: 2,
  MAPPED_SUPERCLASS: 3,
};

Type.TYPE_CONSTRUCTOR = TYPE_CONSTRUCTOR;

module.exports = Type;
