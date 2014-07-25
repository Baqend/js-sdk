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
  trackedConstructor: null,

  persistentAttributeType: Attribute.PersistentAttributeType.ELEMENT_COLLECTION,

  /**
   * @param {jspa.metamodel.EntityType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} elementType
   */
  initialize: function (declaringType, name, elementType) {
    this.superCall(declaringType, name);

    this.elementType = elementType;
  },

  /**
   * @param {jspa.util.State} state
   * @param {*} obj
   * @return {Object}
   */
  getDatabaseValue: function (state, obj) {
    var value = this.getValue(obj);

    if (value) {
      // convert normal collections to tracked collections
      if (!this.trackedConstructor.isInstance(value)) {
        value = new this.trackedConstructor(value);

        Object.defineProperty(value, '__jspaEntity__', {
          value: state.entity
        });

        this.setValue(obj, value);
      }

      var json = [];
      for (var iter = value.iterator(); iter.hasNext;) {
        var el = iter.next();
        if (el === null) {
          json.push(el);
        } else {
          el = this.elementType.toDatabaseValue(state, el);
          if (el !== null)
            json.push(el);
        }
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

      if (!this.trackedConstructor.isInstance(value)) {
        value = new this.trackedConstructor();

        Object.defineProperty(value, '__jspaEntity__', {
          value: state.entity
        });
      }

      var items = value.seq;
      if (items.length > json.length)
        items.splice(json.length, items.length - json.length);

      for (var i = 0, len = json.length; i < len; ++i) {
        items[i] = this.elementType.fromDatabaseValue(state, items[i], json[i]);
      }

      value.size = json.length;
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
      type: this.type.identifier + '<' + this.elementType.identifier + '>'
    };
  }
});