"use strict";

/**
 * @alias baqend.metamodel.Type
 */
class Type {
  /**
   * The persistent type of this type
   * @type Number
   * @abstract
   */
  get persistenceType() {
    return -1;
  }

  /**
   * @type Boolean
   */
  get isBasic() {
    return this.persistenceType == Type.PersistenceType.BASIC;
  }

  /**
   * @type Boolean
   */
  get isEmbeddable() {
    return this.persistenceType == Type.PersistenceType.EMBEDDABLE;
  }

  /**
   * @type Boolean
   */
  get isEntity() {
    return this.persistenceType == Type.PersistenceType.ENTITY;
  }

  /**
   * @type Boolean
   */
  get isMappedSuperclass() {
    return this.persistenceType == Type.PersistenceType.MAPPED_SUPERCLASS;
  }

  /**
   * @return {Function}
   */
  get typeConstructor() {
    return this._typeConstructor;
  }

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if(this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
  }

  /**
   * @param {String} ref
   * @param {Function} typeConstructor
   */
  constructor(ref, typeConstructor) {
    if (ref.indexOf("/db/") != 0) {
      throw new SyntaxError("Type ref " + ref + " is invalid.");
    }

    /** @type String */
    this.ref = ref;
    /** @type String */
    this.name = ref.substring(4);
    this._typeConstructor = typeConstructor;
  }

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param {baqend.util.Metadata} state The root object state
   * @param {Object} jsonValue The json data to merge
   * @param {*=} currentValue The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @return {*} The merged object instance
   * @abstract
   */
  fromJsonValue(state, jsonValue, currentValue) {}

  /**
   * Converts the given object to json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @return {Object} The converted object as json
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