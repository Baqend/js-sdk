var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');
var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.MapAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var MapAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.MapAttribute.prototype */ {

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
  constructor: function MapAttribute(name, keyType, elementType) {
    PluralAttribute.call(this, name, elementType);

    this.keyType = keyType;
    this.typeConstructor = collection.Map;
  },

  /**
   * @inheritDoc
   */
  getJsonValue: function (state, object) {
    var value = this.getValue(object);

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

        json[this.keyType.toJsonValue(state, item.value[0])] =
          this.elementType.toJsonValue(state, item.value[1]);
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @inheritDoc
   */
  setJsonValue: function (state, obj, json) {
    var value = null;
    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var copy = new this.typeConstructor(value);
      value.clear();

      for (var jsonKey in json) {
        // ensure that "false" keys will be converted to false
        var key = this.keyType.name == "Boolean"? jsonKey != "false": this.keyType.fromJsonValue(state, jsonKey);
        var val = this.elementType.fromJsonValue(state, json[jsonKey], copy.get(key));

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
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']',
      order: this.order
    };
  }
});

module.exports = MapAttribute;