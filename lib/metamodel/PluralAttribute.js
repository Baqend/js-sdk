var Attribute = require('./Attribute').Attribute;

/**
 * @class baqend.metamodel.PluralAttribute
 * @extends baqend.metamodel.Attribute
 */
exports.PluralAttribute = PluralAttribute = Attribute.inherit(/** @lends baqend.metamodel.PluralAttribute.prototype */{
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
  initialize: function (name, elementType) {
    this.superCall(name);
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
      for (var iter = value.iterator(), item = iter.next(); !item.done; item = iter.next()) {
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

      var items = value.seq;
      value.seq = [];
      value.size = 0;

      for (var i = 0, len = json.length; i < len; ++i) {
        value.add(this.elementType.fromDatabaseValue(state, json[i], items[i]));
      }
    }

    this.setValue(obj, value);
  }
});