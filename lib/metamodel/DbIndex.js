var DbIndex;

/**
 * Creates a new index instance which is needed to create an
 * database index.
 *
 * @class baqend.metamodel.DbIndex
 *
 * @param {String|Object|Array} keys The name of the field which will be used for the index,
 * an object of an field and index type combination or
 * an array of objects to create an compound index
 * @param {Boolean=} unique Indicates if the index will be unique
 */
exports.DbIndex = DbIndex = Object.inherit(/** @lends baqend.metamodel.DbIndex.prototype */ {

  /** @lends baqend.metamodel.DbIndex */
  extend: {
    /**
     * @type {String} Type to create an ascending index
     */
    ASC: 'asc',
    /**
     * @type {String} Type to create an descending index
     */
    DESC: 'desc',
    /**
     * @type {String} Type to create an geospatial index
     */
    GEO: 'geo',

    /**
     * Returns DbIndex Object created from the given JSON
     */
    fromJSON: function(json) {
      return new DbIndex(json.keys, json.unique);
    }
  },

  /**
   * @type {Boolean} Indicates if the index will be dropped or created
   */
  drop: false,

  initialize: function(keys, unique) {

    if(String.isInstance(keys)) {
      var key = {};
      key[keys] = DbIndex.ASC;
      this.keys = [key];
    } else if(Array.isInstance(keys)) {
      this.keys = keys;
    } else if(Object.isInstance(keys)) {
      this.keys = [keys];
    } else {
      throw new Error("The keys parameter must be an String, Object or Array.");
    }

    this.unique = unique === true;
  },

  isCompound: function() {
    return this.keys.length > 1
  },

  /**
   * Returns a JSON representation of the Index object
   *
   * @return {Object} A Json of this Index object
   */
  toJSON: function() {
    return {
      unique: this.unique,
      keys: this.keys,
      drop: this.drop
    };
  }
});
