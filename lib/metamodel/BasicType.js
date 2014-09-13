var Type = require('./Type').Type;
var GeoPoint = require('../types').GeoPoint;

/**
 * @class jspa.metamodel.BasicType
 * @extends jspa.metamodel.Type
 */
exports.BasicType = BasicType = Type.inherit(/** @lends jspa.metamodel.BasicType.prototype */ {

  /**
   * The persistent type of this type
   * @type Number
   */
  persistenceType: Type.PersistenceType.BASIC,

  /**
   * Indicates if this type is not the main type of the constructor
   * @type {Boolean}
   * @private
   */
  _noResolving: false,

  /**
   * Creates a new instance of a native db type
   * @param {String} identifier The db identifier of this type
   * @param {Function} typeConstructor The javascript class of this type
   * @param {Boolean} noResolving Indicates if this type is not the main type of the constructor
   */
  initialize: function (identifier, typeConstructor, noResolving) {
    if (identifier.indexOf('/db/') != 0)
      identifier = '/db/_native.' + identifier;

    this.superCall(identifier, typeConstructor);

    this._noResolving = noResolving;
  },

  /**
   * @param {jspa.util.Metadata} state
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
   * @param {jspa.util.Metadata} state
   * @param {*} jsonValue
   * @returns {*}
   */
  fromDatabaseValue: function (state, jsonValue) {
    if (jsonValue === null || jsonValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(jsonValue);
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
  DateTime: new (BasicType.inherit({
    initialize: function() {
      this.superCall('DateTime', Date);
    },

    toDatabaseValue: function(state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
      }
      return value;
    }
  })),

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

    fromDatabaseValue: function (state, json) {
      return this.superCall(state, json ? '1970-01-01T' + json : json);
    }
  })),

  GeoPoint: new BasicType('GeoPoint', GeoPoint),

  JsonArray: new (BasicType.inherit({
    initialize: function() {
      this.superCall('JsonArray', Array);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toDatabaseValue: function (state, value) {
      if (value && value.constructor == Array) {
        return value;
      }

      return null;
    }
  })),

  JsonObject: new (BasicType.inherit({
    initialize: function() {
      this.superCall('JsonObject', Object);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toDatabaseValue: function (state, value) {
      if (value && value.constructor == Object) {
        return value;
      }

      return null;
    }
  }))
});