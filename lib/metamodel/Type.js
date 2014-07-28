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
   * @param {String} identifier
   * @param {Function} typeConstructor
   */
  initialize: function (identifier, typeConstructor) {
    this.identifier = identifier;
    this.typeConstructor = typeConstructor;
  },

  /**
   * @param {jspa.binding.ClassUtil} classUtil
   */
  init: function (classUtil) {
    this.classUtil = classUtil;

    if (this.typeConstructor && !this.classUtil.getIdentifier(this.typeConstructor))
      this.classUtil.setIdentifier(this.typeConstructor, this.identifier);
  },

  /**
   * @returns {Object}
   */
  create: function () {
    return this.classUtil.create(this);
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