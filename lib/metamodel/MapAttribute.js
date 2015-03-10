var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');
var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.MapAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var MapAttribute = module.exports = PluralAttribute.inherit(/** @lends baqend.metamodel.MapAttribute.prototype */ {

  extend: {
    ref: '/db/collection.Map'
  },

  collectionType: PluralAttribute.CollectionType.MAP,

  /**
   * @type baqend.metamodel.Type
   */
  keyType: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} keyType
   * @param {baqend.metamodel.Type} elementType
   */
  initialize: function (name, keyType, elementType) {
    this.superCall(name, elementType);

    this.keyType = keyType;
    this.typeConstructor = collection.Map;
  },

  /**
   * @param {baqend.util.Metadata} state
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
      for (var iter = value.entries(), item; !(item = iter.next()).done; ) {
        if (item.value[0] === null || item.value[1] === undefined)
          throw new PersistentError('Map keys can\'t be null nor undefined.');

        json[this.keyType.toDatabaseValue(state, item.value[0])] =
          this.elementType.toDatabaseValue(state, item.value[1]);
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @param {baqend.util.Metadata} state
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

      var keys = value.array;
      var vals = value.vals;

      value.array = [];
      value.vals = [];

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