var SingularAttribute = require('./SingularAttribute').SingularAttribute;
var BasicType = require('./BasicType').BasicType;
var Type = require('./Type').Type;
var ManagedType = require('./ManagedType').ManagedType;
var State = require('../util/State').State;

/**
 * @class jspa.metamodel.EntityType
 * @extends jspa.metamodel.ManagedType
 */
exports.EntityType = EntityType = ManagedType.inherit( /** @lends jspa.metamodel.EntityType.prototype */ {
  persistenceType: Type.PersistenceType.ENTITY,

  declaredId: null,
  declaredVersion: null,

  /**
   * @type {jspa.metamodel.EntityType}
   */
  superType: null,

  /**
   * @type {String}
   */
  id: {
    get: function () {
      return this.declaredId || this.supertype.id;
    }
  },

  /**
   * @type {String}
   */
  version: {
    get: function () {
      return this.declaredVersion || this.supertype.version;
    }
  },

  /**
   * @param {String} identifier
   * @param {jspa.metamodel.EntityType} supertype
   * @param {Function} typeConstructor
   */
  initialize: function (identifier, supertype, typeConstructor) {
    this.superCall(identifier, typeConstructor);

    this.supertype = supertype;
  },

  /**
   * @param {jspa.util.State} state
   * @param {*} obj
   * @param {Object} value
   * @return {*}
   */
  fromDatabaseValue: function (state, obj, value) {
    if (state.entity == obj) {
      this.superCall(state, obj, value);
      return obj;
    } else if (value) {
      return state.entityManager.getReference(value);
    } else {
      return null;
    }
  },

  /**
   * @param {jspa.util.State} state
   * @param {*} obj
   * @return {Object}
   */
  toDatabaseValue: function (state, obj) {
    if (state.entity == obj) {
      var value = this.superCall(state, obj);
      var info = value._objectInfo;

      var oid = state.getReference();
      if (oid) {
        info['oid'] = oid;
      }

      var version = state.getVersion();
      if (version) {
        info['version'] = version;
      }

      var transaction = state.getTransactionIdentifier();
      if (transaction) {
        info['transaction'] = transaction;
      }

      return value;
    } else if (this.typeConstructor.isInstance(obj)) {
      var valueState = State.get(obj);
      if (valueState && !valueState.isDeleted) {
        var data = valueState.getReference();
        if (data) {
          return data;
        } else {
          state.isDirty = true;
        }
      }
    }

    return null;
  }
});

EntityType.extend(/** @lends jspa.metamodel.EntityType */ {
  Object: EntityType.inherit({
    declaredAttributes: [],

    initialize: function() {
      this.superCall('/db/_native.Object', null, Object);

      this.declaredId = new SingularAttribute(this, 'oid', BasicType.String);
      this.declaredId.isId = true;
      this.declaredVersion = new SingularAttribute(this, 'version', BasicType.String);
      this.declaredVersion.isVersion = true;
    }
  })
});