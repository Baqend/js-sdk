var Type = require('./Type').Type;

/**
 * @class jspa.metamodel.BasicType
 * @extends jspa.metamodel.Type
 */
exports.BasicType = BasicType = Type.inherit(
    /**
     * @lends jspa.metamodel.BasicType.prototype
     */
    {
  persistenceType: Type.PersistenceType.BASIC,

  isCollection: false,

  /**
   * @param {String} identifier
   * @param {Function} typeConstructor
   */
  initialize: function (identifier, typeConstructor) {
    if (identifier.indexOf('/') == -1)
      identifier = '/db/_native.' + identifier;

    this.superCall(identifier, typeConstructor);
  },

  /**
   * @param {jspa.util.State} state
   * @param {Object} currentValue
   * @returns {Object}
   */
  toDatabaseValue: function (state, currentValue) {
    if (currentValue === null || currentValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(currentValue);
  },

  /**
   * @param {jspa.util.State} state
   * @param {*} currentValue
   * @param {*} value
   * @returns {*}
   */
  fromDatabaseValue: function (state, currentValue, value) {
    if (value === null || value === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(value);
  }
});