var Type = require('./Type');
var GeoPoint = require('../GeoPoint');

/**
 * @class baqend.metamodel.BasicType
 * @extends baqend.metamodel.Type
 */
var BasicType = Type.inherit(/** @lends baqend.metamodel.BasicType.prototype */ {

  /**
   * The persistent type of this type
   * @type Number
   */
  persistenceType: Type.PersistenceType.BASIC,

  /**
   * Indicates if this type is not the main type of the constructor
   * @type {Boolean}
   */
  noResolving: false,

  /**
   * Creates a new instance of a native db type
   * @param {String} ref The db ref of this type
   * @param {Function} typeConstructor The javascript class of this type
   * @param {Boolean} noResolving Indicates if this type is not the main type of the constructor
   */
  constructor: function BasicType(ref, typeConstructor, noResolving) {
    if (ref.indexOf('/db/') != 0)
      ref = '/db/' + ref;

    Type.call(this, ref, typeConstructor);

    this.noResolving = noResolving;
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function (state, currentValue) {
    if (currentValue === null || currentValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(currentValue);
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function (state, jsonValue, currentValue) {
    if (jsonValue === null || jsonValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(jsonValue);
  },

  toString: function() {
    return "BasicType(" + this.ref + ")";
  }
});

BasicType.extend( /** @lends baqend.metamodel.BasicType */ {
  Boolean: new BasicType('Boolean', Boolean),
  Double: new BasicType('Double', Number),
  Integer: new BasicType('Integer', Number),
  String: new BasicType('String', String),
  DateTime: new (BasicType.inherit({
    constructor: function DateTimeType() {
      BasicType.call(this, 'DateTime', Date);
    },

    toJsonValue: function(state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
      }
      return value;
    }
  })),

  Date: new (BasicType.inherit({
    constructor: function DateType() {
      BasicType.call(this, 'Date', Date);
    },

    toJsonValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(0, value.indexOf('T'));
      }
      return value;
    },

    fromJsonValue: function (state, json) {
      return this.superCall(state, String.isInstance(json) ? json + 'T00:00Z' : json);
    }
  })),

  Time: new (BasicType.inherit({
    constructor: function TimeType() {
      BasicType.call(this, 'Time', Date);
    },

    toJsonValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(value.indexOf('T') + 1);
      }
      return value;
    },

    fromJsonValue: function (state, json) {
      return this.superCall(state, String.isInstance(json) ? '1970-01-01T' + json : json);
    }
  })),

  GeoPoint: new BasicType('GeoPoint', GeoPoint),

  JsonArray: new (BasicType.inherit({
    constructor: function JsonArrayType() {
      BasicType.call(this, 'JsonArray', Array);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toJsonValue: function (state, value) {
      if (value && value.constructor == Array) {
        return value;
      }

      return null;
    }
  })),

  JsonObject: new (BasicType.inherit({
    constructor: function JsonObjectType() {
      BasicType.call(this, 'JsonObject', Object);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toJsonValue: function (state, value) {
      if (value && value.constructor == Object) {
        return value;
      }

      return null;
    }
  }))
});

module.exports = BasicType;