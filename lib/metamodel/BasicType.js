var Type = require('./Type').Type;

/**
 * @class jspa.metamodel.BasicType
 * @extends jspa.metamodel.Type
 */
exports.BasicType = BasicType = Type.inherit(/** @lends jspa.metamodel.BasicType.prototype */ {

  persistenceType: Type.PersistenceType.BASIC,

  isCollection: false,

  /**
   * @param {String} identifier
   * @param {Function} typeConstructor
   */
  initialize: function (identifier, typeConstructor) {
    if (identifier.indexOf('/db/') != 0)
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
  },

  toString: function() {
    return "BasicType(" + this.identifier + ")";
  }
});

BasicType.extend( /** @lends jspa.metamodel.BasicType */ {
  Boolean: new BasicType('Boolean', Boolean),
  Float: new BasicType('Float', Number),
  Integer: new BasicType('Integer', Number),
  String: new BasicType('String', String),

  Date: new (BasicType.inherit({
    initialize: function() {
      this.superCall('Date', Date);
    },

    toDatabaseValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(0, value.indexOf('T'));
      }
      return value;
    }
  })),

  Time: new (BasicType.inherit({
    initialize: function() {
      this.superCall('Time', Date);
    },

    toDatabaseValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(value.indexOf('T') + 1);
      }
      return value;
    },

    fromDatabaseValue: function (state, currentValue, json) {
      return this.superCall(state, currentValue, json ? '1970-01-01T' + json : json);
    }
  })),

  DateTime: new BasicType('DateTime', Date)
});