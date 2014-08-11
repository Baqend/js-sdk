var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');
var MapAttribute;

/**
 * @class jspa.metamodel.MapAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
exports.MapAttribute = MapAttribute = PluralAttribute.inherit(/** @lends jspa.metamodel.MapAttribute.prototype */ {

  extend: {
    identifier: '/db/_native.collection.Map'
  },

  collectionType: PluralAttribute.CollectionType.MAP,

  /**
   * @type jspa.metamodel.Type
   */
  keyType: null,

  /**
   * @param {jspa.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} keyType
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, keyType, elementType) {
    this.superCall(declaringType, name, elementType);

    this.keyType = keyType;
    this.typeConstructor = collection.Map;
  },

  /**
   * @param {jspa.util.State} state
   * @param {*} obj
   * @return {Object}
   */
  getDatabaseValue: function (state, obj) {
    var value = this.getValue(obj);

    if (value) {
      if (!value.__jspaEntity__) {
        Object.defineProperty(value, '__jspaEntity__', {
          value: state.entity
        });
      }

      var json = [];
      for (var iter = value.items(), item = iter.next(); !item.done; item = iter.next()) {
        json.push({
          key: this.keyType.toDatabaseValue(state, item.index),
          value: this.elementType.toDatabaseValue(state, item.value)
        });
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @param {jspa.util.State} state
   * @param {*} obj
   * @param {Object} json
   */
  setDatabaseValue: function (state, obj, json) {
    var value = null;
    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();
        Object.defineProperty(value, '__jspaEntity__', {
          value: state.entity
        });
      }

      var keys = value.seq;
      var vals = value.vals;

      value.seq = [];
      value.vals = [];
      value.size = 0;

      for (var i = 0, len = json.length; i < len; ++i) {
        var item = json[i];
        var key = this.keyType.fromDatabaseValue(state, item.key);
        var index = keys.indexOf(key);
        var val = this.elementType.fromDatabaseValue(state, item.value, index != -1? vals[index]: null);

        value.set(key, val);
      }
    }

    this.setValue(obj, value);
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: MapAttribute.identifier + '[' + this.keyType.identifier + ',' + this.elementType.identifier + ']'
    };
  }
});