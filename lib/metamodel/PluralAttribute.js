var Attribute = require('./Attribute').Attribute;

/**
 * @class jspa.metamodel.PluralAttribute
 * @extends jspa.metamodel.Attribute
 */
exports.PluralAttribute = PluralAttribute = Attribute.inherit(/** @lends jspa.metamodel.PluralAttribute.prototype */{
  /**
   * @lends jspa.metamodel.PluralAttribute
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
   * @type {Function}
   */
  typeConstructor: null,

  persistentAttributeType: Attribute.PersistentAttributeType.ELEMENT_COLLECTION,

  /**
   * @type jspa.metamodel.Type
   */
  elementType: null,

  /**
   * @param {jspa.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name);

    this.elementType = elementType;
  },

  /**
   * @param {jspa.util.State} state The object root state
   * @param {*} obj
   * @return {Object}
   */
  getDatabaseValue: function (state, obj) {
    var value = this.getValue(obj);

    if (value) {
      // convert normal collections to tracked collections
      if (!value.__jspaEntity__) {
        Object.defineProperty(value, '__jspaEntity__', {
          value: state.entity
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

      var items = value.seq;
      value.seq = new Array(json.length);
      value.size = 0;

      for (var i = 0, len = json.length; i < len; ++i) {
        value.add(this.elementType.fromDatabaseValue(state, json[i], items[i]));
      }
    }

    this.setValue(obj, value);
  }
});