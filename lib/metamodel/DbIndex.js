"use strict";
/**
 * Creates a new index instance which is needed to create an
 * database index.
 *
 * @alias baqend.metamodel.DbIndex
 */
class DbIndex {

  /**
   * @param {string|Object|Array} keys The name of the field which will be used for the index,
   * an object of an field and index type combination or
   * an array of objects to create an compound index
   * @param {boolean=} unique Indicates if the index will be unique
   */
  constructor(keys, unique) {
    if(Object(keys) instanceof String) {
      var key = {};
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

  hasKey(name) {
    for(var i = 0; i < this.keys.length; i++) {
      if(this.keys[i][name]) {
        return true;
      }
    }
    return false;
  }

  get isCompound() {
    return this.keys.length > 1;
  }

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

Object.assign(DbIndex, {
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
