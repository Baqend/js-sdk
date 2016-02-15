"use strict";

var Type = require('./Type');
var GeoPoint = require('../GeoPoint');

/**
 * @class baqend.metamodel.BasicType
 * @extends baqend.metamodel.Type
 */
class BasicType extends Type {

  /**
   * The persistent type of this type
   * @type Number
   */
  get persistenceType() {
    return Type.PersistenceType.BASIC;
  }

  /**
   * Creates a new instance of a native db type
   * @param {String} ref The db ref of this type
   * @param {Function} typeConstructor The javascript class of this type
   * @param {Boolean=} noResolving Indicates if this type is not the main type of the constructor
   */
  constructor(ref, typeConstructor, noResolving) {
    if (ref.indexOf('/db/') != 0)
      ref = '/db/' + ref;

    super(ref, typeConstructor);

    /**
     * Indicates if this type is not the main type of the constructor
     * @type {Boolean}
     */
    this.noResolving = noResolving;
  }

  /**
   * @inheritDoc
   */
  toJsonValue (state, currentValue) {
    if (currentValue === null || currentValue === undefined) {
      return null;
    }

    return this.typeConstructor(currentValue);
  }

  /**
   * @inheritDoc
   */
  fromJsonValue (state, jsonValue, currentValue) {
    if (jsonValue === null || jsonValue === undefined) {
      return null;
    }

    return this.typeConstructor(jsonValue);
  }

  toString() {
    return "BasicType(" + this.ref + ")";
  }
}

Object.assign(BasicType, /** @lends baqend.metamodel.BasicType */ {
  Boolean: new BasicType('Boolean', Boolean),
  Double: new BasicType('Double', Number),
  Integer: new BasicType('Integer', Number),
  String: new BasicType('String', String),
  DateTime: new class DateTimeType extends BasicType {
    constructor() {
      super('DateTime', Date);
    }

    toJsonValue(state, value) {
      if (value instanceof Date) {
        value = value.toISOString();
      } else {
        value = null;
      }
      return value;
    }

    fromJsonValue (state, json) {
      return Object(json) instanceof String? new Date(json) : json;
    }
  },

  Date: new class DateType extends BasicType {
    constructor() {
      super('Date', Date);
    }

    toJsonValue (state, value) {
      if (value instanceof Date) {
        value = value.toISOString();
        value = value.substring(0, value.indexOf('T'));
      } else {
        value = null;
      }
      return value;
    }

    fromJsonValue (state, json) {
      return Object(json) instanceof String? new Date(json) : json;
    }
  },

  Time: new class TimeType extends BasicType {
    constructor() {
      super('Time', Date);
    }

    toJsonValue (state, value) {
      if (value instanceof Date) {
        value = value.toISOString();
        value = value.substring(value.indexOf('T') + 1);
      } else {
        value = null;
      }
      return value;
    }

    fromJsonValue (state, json) {
      return Object(json) instanceof String? new Date('1970-01-01T' + json) : json;
    }
  },

  GeoPoint: new class GeoPointType extends BasicType {
    constructor() {
      super('GeoPoint', GeoPoint);
    }

    toJsonValue (state, value) {
      return value instanceof GeoPoint? value: null;
    }

    fromJsonValue (state, json) {
      return json? new GeoPoint(json): null;
    }
  },

  JsonArray: new class JsonArrayType extends BasicType {
    constructor() {
      super('JsonArray', Array);
    }

    init(classFactory) {
      this._enhancer = classFactory;
    }

    toJsonValue (state, value) {
      return Array.isArray(value)? value: null;
    }

    fromJsonValue (state, json) {
      return Array.isArray(json)? json: null;
    }
  },

  JsonObject: new class JsonObjectType extends BasicType {
    constructor() {
      super('JsonObject', Object);
    }

    init(classFactory) {
      this._enhancer = classFactory;
    }

    toJsonValue (state, value) {
      if (value && value.constructor == Object) {
        return value;
      }

      return null;
    }
  }
});

module.exports = BasicType;