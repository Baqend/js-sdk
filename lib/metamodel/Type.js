var Type;

/**
 * @class jspa.metamodel.Type
 */
exports.Type = Type = Object.inherit(/** @lends jspa.metamodel.Type.prototype */ {
  /**
   * @lends jspa.metamodel.Type
   */
  extend: {
    /**
     * @enum {number}
     */
    PersistenceType: {
      BASIC: 0,
      EMBEDDABLE: 1,
      ENTITY: 2,
      MAPPED_SUPERCLASS: 3
    }
  },

  /**
   * @type {Boolean}
   */
  get isBasic() {
    return this.persistenceType == Type.PersistenceType.BASIC;
  },

  /**
   * @type {Boolean}
   */
  get isEmbeddable() {
    return this.persistenceType == Type.PersistenceType.EMBEDDABLE;
  },

  /**
   * @type {Boolean}
   */
  get isEntity() {
    return this.persistenceType == Type.PersistenceType.ENTITY;
  },

  /**
   * @type {Boolean}
   */
  get isMappedSuperclass() {
    return this.persistenceType == Type.PersistenceType.MAPPED_SUPERCLASS;
  },

  /**
   * @type Number
   */
  persistenceType: -1,

  /**
   * @type {Function}
   */
  get typeConstructor() {
    return this._typeConstructor;
  },

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if(this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
  },

  /**
   * @param {String} identifier
   * @param {Function} typeConstructor
   */
  initialize: function (identifier, typeConstructor) {
    if (identifier.indexOf("/db/") != 0) {
      throw new SyntaxError("Type identifier " + identifier + " is invalid.");
    }

    this.identifier = identifier;
    this.name = identifier.substring(4);
    this._typeConstructor = typeConstructor;
  },

  /**
   * Converts the given json value to an instance of this type
   * @param {jspa.util.Metadata} state The root object state
   * @param {*} jsonValue The json value
   * @param {*=} currentValue The actual object value
   * @returns {*} The converted value
   */
  fromDatabaseValue: function(state, jsonValue, currentValue) {},

  /**
   * Converts the given object to json
   * @param {jspa.util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @return {Object} The converted object as json
   */
  toDatabaseValue: function(state, object) {}
});