var Attribute = require('./Attribute');
var Type = require('./Type');

/**
 * @class baqend.metamodel.SingularAttribute
 * @extends baqend.metamodel.Attribute
 */
var SingularAttribute = Attribute.inherit(/** @lends baqend.metamodel.SingularAttribute.prototype */ {

  get typeConstructor() {
    return this.type.typeConstructor;
  },

  /**
   * @type baqend.metamodel.Type
   */
  type: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} type
   */
  constructor: function SingularAttribute(name, type) {
    Attribute.call(this, name);

    this.type = type;

    switch (type.persistenceType) {
      case Type.PersistenceType.BASIC:
        this.persistentAttributeType = Attribute.PersistentAttributeType.BASIC;
        break;
      case Type.PersistenceType.EMBEDDABLE:
        this.persistentAttributeType = Attribute.PersistentAttributeType.EMBEDDED;
        break;
      case Type.PersistenceType.ENTITY:
        this.persistentAttributeType = Attribute.PersistentAttributeType.ONE_TO_MANY;
        break;
    }
  },

  /**
   * @inheritDoc
   */
  getJsonValue: function (state, object) {
    return this.type.toJsonValue(state, this.getValue(object));
  },

  /**
   * @inheritDoc
   */
  setJsonValue: function (state, object, jsonValue) {
    this.setValue(object, this.type.fromJsonValue(state, jsonValue, this.getValue(object)));
  },

  /**
   * @inheritDoc
   */
  toJSON: function() {
    return {
      name: this.name,
      type: this.type.ref,
      order: this.order
    }
  }
});

module.exports = SingularAttribute;