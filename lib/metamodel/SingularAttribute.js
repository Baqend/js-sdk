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
   * @type {number}
   */
  persistentAttributeType: -1,

  /**
   * @param {jspa.metamodel.EntityType} declaringType
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
   * @param {jspa.util.State} state
   * @param {*} obj
   * @return {*}
   */
  getDatabaseValue: function (state, obj) {
    return this.type.toDatabaseValue(state, this.getValue(obj));
  },

  /**
   * @param {jspa.util.State} state
   * @param {*} obj
   * @param {*} value
   */
  setDatabaseValue: function (state, obj, value) {
    this.setValue(obj, this.type.fromDatabaseValue(state, this.getValue(obj), value));
  }
});