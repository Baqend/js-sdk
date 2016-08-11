"use strict";

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
    return this.persistenceType == Type.PersistenceType.BASIC;
  }

  /**
   * @type boolean
   */
  get isEmbeddable() {
    return this.persistenceType == Type.PersistenceType.EMBEDDABLE;
  }

  /**
   * @type boolean
   */
  get isEntity() {
    return this.persistenceType == Type.PersistenceType.ENTITY;
  }

  /**
   * @type boolean
   */
  get isMappedSuperclass() {
    return this.persistenceType == Type.PersistenceType.MAPPED_SUPERCLASS;
  }

  /**
   * @return {Class<*>}
   */
  get typeConstructor() {
    return this._typeConstructor;
  }

  /**
   * @param {Class<*>} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if(this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
  }

  /**
   * @param {string} ref
   * @param {Class<*>} typeConstructor
   */
  constructor(ref, typeConstructor) {
    if (ref.indexOf("/db/") != 0) {
      throw new SyntaxError("Type ref " + ref + " is invalid.");
    }

    /** @type string */
    this.ref = ref;
    /** @type string */
    this.name = ref.substring(4);
    this._typeConstructor = typeConstructor;
  }

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param {util.Metadata} state The root object state
   * @param {json} jsonValue The json data to merge
   * @param {*=} currentValue The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @return {*} The merged object instance
   * @abstract
   */
  fromJsonValue(state, jsonValue, currentValue) {}

  /**
   * Converts the given object to json
   * @param {util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @return {json} The converted object as json
   * @abstract
   */
  toJsonValue(state, object) {}
}

/**
 * @enum {number}
 */
Type.PersistenceType = {
  BASIC: 0,
  EMBEDDABLE: 1,
  ENTITY: 2,
  MAPPED_SUPERCLASS: 3
};

module.exports = Type;