var Attribute = require('./Attribute').Attribute;
var Type = require('./Type').Type;

/**
 * @class jspa.metamodel.SingularAttribute
 * @extends jspa.metamodel.Attribute
 */
exports.SingularAttribute = SingularAttribute = Attribute.inherit(/** @lends jspa.metamodel.SingularAttribute.prototype */ {

  typeConstructor: {
    get: function () {
      return this.type.typeConstructor;
    }
  },

  /**
   * @type jspa.metamodel.Type
   */
  type: null,

  /**
   * @param {jspa.metamodel.ManagedType} declaringType
   * @param {String} name
   * @param {jspa.metamodel.Type} type
   */
  initialize: function (declaringType, name, type) {
    this.superCall(declaringType, name);

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
   * Gets this attribute value form the object as json
   * @param {jspa.util.Metadata} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @return {*} The converted json value
   */
  getDatabaseValue: function (state, object) {
    return this.type.toDatabaseValue(state, this.getValue(object));
  },

  /**
   * Sets this attribute value from json to the object
   * @param {jspa.util.Metadata} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   */
  setDatabaseValue: function (state, object, jsonValue) {
    this.setValue(object, this.type.fromDatabaseValue(state, jsonValue, this.getValue(object)));
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: this.type.identifier
    }
  }
});