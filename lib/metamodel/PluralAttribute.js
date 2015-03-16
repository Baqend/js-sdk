var Attribute = require('./Attribute');

/**
 * @class baqend.metamodel.PluralAttribute
 * @extends baqend.metamodel.Attribute
 */
var PluralAttribute = Attribute.inherit(/** @lends baqend.metamodel.PluralAttribute.prototype */{
  /**
   * @lends baqend.metamodel.PluralAttribute
   */
  extend: {
    /**
     * @enum {number}
     */
    CollectionType: {
      COLLECTION: 0,
      LIST: 1,
      MAP: 2,
      SET: 3
    }
  },

  /**
   * @type Function
   */
  typeConstructor: null,

  persistentAttributeType: Attribute.PersistentAttributeType.ELEMENT_COLLECTION,

  /**
   * @type baqend.metamodel.Type
   */
  elementType: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor: function PluralAttribute(name, elementType) {
    Attribute.call(this, name);
    this.elementType = elementType;
  },

  /**
   * @param {baqend.util.Metadata} state The object root state
   * @param {*} obj
   * @return {Object}
   */
  getDatabaseValue: function (state, obj) {
    var value = this.getValue(obj);

    if (this.typeConstructor.isInstance(value)) {
      // convert normal collections to tracked collections
      if (!value._metadata) {
        Object.defineProperty(value, '_metadata', {
          value: {_root: state._root}
        });
      }

      var json = [];
      for (var iter = value.values(), item; !(item = iter.next()).done; ) {
        json.push(this.elementType.toDatabaseValue(state, item.value));
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

      var items = value.array;
      value.array = [];

      for (var i = 0, len = json.length; i < len; ++i) {
        value.add(this.elementType.fromDatabaseValue(state, json[i], items[i]));
      }
    }

    this.setValue(obj, value);
  }
});

module.exports = PluralAttribute;