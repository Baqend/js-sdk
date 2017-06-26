"use strict";
/**
 * Creates a new index instance which is needed to create an
 * database index.
 *
 * @alias metamodel.DbIndex
 */
class DbIndex {

  /**
   * An array of mappings from field to index type which are parts of this index/compound index
   * @name keys
   * @type Array<Object<string,string>>
   * @memberOf metamodel.DbIndex.prototype
   */

  /**
   * @param {string|Object|Array<string>} keys The name of the field which will be used for the index,
   * an object of an field and index type combination or
   * an array of objects to create an compound index
   * @param {boolean=} unique Indicates if the index will be unique
   */
  constructor(keys, unique) {
    if(Object(keys) instanceof String) {
      const key = {};
      key[keys] = DbIndex.ASC;
      this.keys = [key];
    } else if(Object(keys) instanceof Array) {
      this.keys = keys;
    } else if(keys) {
      this.keys = [keys];
    } else {
      throw new Error("The keys parameter must be an String, Object or Array.");
    }

    /** @type boolean */
    this.drop = false;
    this.unique = unique === true;
  }

  /**
   * Indicates if this index is for the given field or includes it in a compound index
   * @param {string} name The name of the field to check for
   * @return {boolean} <code>true</code> if the index contains this field
   */
  hasKey(name) {
    for(let i = 0; i < this.keys.length; i++) {
      if(this.keys[i][name]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Indicates if this index is a compound index of multiple attributes
   * @type boolean
   */
  get isCompound() {
    return this.keys.length > 1;
  }

  /**
   * Indicates if this index is an unique index
   * @type boolean
   */
  get isUnique() {
    return this.unique;
  }

  /**
   * Returns a JSON representation of the Index object
   *
   * @return {json} A Json of this Index object
   */
  toJSON() {
    return {
      unique: this.unique,
      keys: this.keys,
      drop: this.drop
    };
  }
}

Object.assign(DbIndex, /** @lends metamodel.DbIndex */ {
  /**
   * @type string
   */
  ASC: 'asc',

  /**
   * @type string
   */
  DESC: 'desc',

  /**
   * @type string
   */
  GEO: 'geo',

  /**
   * Returns DbIndex Object created from the given JSON
   * @param {json} json
   */
  fromJSON(json) {
    return new DbIndex(json.keys, json.unique);
  }
});

module.exports = DbIndex;
