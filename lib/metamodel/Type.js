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
  isBasic: {
    get: function () {
      return this.persistenceType == Type.PersistenceType.BASIC;
    }
  },

  /**
   * @type {Boolean}
   */
  isEmbeddable: {
    get: function () {
      return this.persistenceType == Type.PersistenceType.EMBEDDABLE;
    }
  },

  /**
   * @type {Boolean}
   */
  isEntity: {
    get: function () {
      return this.persistenceType == Type.PersistenceType.ENTITY;
    }
  },

  /**
   * @type {Boolean}
   */
  isMappedSuperclass: {
    get: function () {
      return this.persistenceType == Type.PersistenceType.MAPPED_SUPERCLASS;
    }
  },

  /**
   * @type Number
   */
  persistenceType: -1,

  /**
   * @type {Function}
   */
  typeConstructor: {
    get: function() {
      return this._typeConstructor;
    },
    set: function(typeConstructor) {
      if(this._typeConstructor) {
        throw new Error("typeConstructor has already been set.")
      }
      this._typeConstructor = typeConstructor;
    }
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

  init: function (classFactory) {
    this.classFactory = classFactory;

    if (this._typeConstructor && !this.classFactory.getIdentifier(this._typeConstructor))
      this.classFactory.setIdentifier(this._typeConstructor, this.identifier);
  },

  /**
   * @returns {Object}
   */
  create: function () {
    return this.classFactory.create(this);
  },

  /**
   * @param {jspa.util.State} state
   * @param {Object} value
   * @returns {*}
   */
  toDatabaseValue: function (state, value) {},

  /**
   * @param {jspa.util.State} state
   * @param {Object} currentValue
   * @param {*} value
   * @returns {*}
   */
  fromDatabaseValue: function (state, currentValue, value) {}
});