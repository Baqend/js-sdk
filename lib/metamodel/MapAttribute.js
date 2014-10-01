var PluralAttribute = require('./PluralAttribute').PluralAttribute;
var collection = require('../collection');
var MapAttribute;

/**
 * @class jspa.metamodel.MapAttribute
 * @extends jspa.metamodel.PluralAttribute
 */
exports.MapAttribute = MapAttribute = PluralAttribute.inherit(/** @lends jspa.metamodel.MapAttribute.prototype */ {

  extend: {
    ref: '/db/_native.collection.Map'
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
   * @param {jspa.util.Metadata} state
   * @param {*} obj
   * @return {Object}
   */
  getDatabaseValue: function (state, obj) {
    var value = this.getValue(obj);

    if (value) {
      if (!value._metadata) {
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var json = {};
      for (var iter = value.items(), item = iter.next(); !item.done; item = iter.next()) {
        if (item.index === null || item.index === undefined)
          throw new jspa.error.PersistentError('Map keys can\'t be null nor undefined.');

        json[this.keyType.toDatabaseValue(state, item.index)] =
          this.elementType.toDatabaseValue(state, item.value);
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @param {jspa.util.Metadata} state
   * @param {*} obj
   * @param {Object} json
   */
  setDatabaseValue: function (state, obj, json) {
    var value = null;
    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var keys = value.seq;
      var vals = value.vals;

      value.seq = [];
      value.vals = [];
      value.size = 0;

      for (var key in json) {
        key = this.keyType.fromDatabaseValue(state, key);
        var index = keys.indexOf(key);
        var val = this.elementType.fromDatabaseValue(state, json[key], index != -1? vals[index]: null);

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
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']'
    };
  }
});