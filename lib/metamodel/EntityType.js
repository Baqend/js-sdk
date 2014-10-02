var binding = require('../binding');

var SingularAttribute = require('./SingularAttribute').SingularAttribute;
var BasicType = require('./BasicType').BasicType;
var Type = require('./Type').Type;
var ManagedType = require('./ManagedType').ManagedType;
var Metadata = require('../util/Metadata').Metadata;
var Permission = require('../util/Permission').Permission;

/**
 * @class jspa.metamodel.EntityType
 * @extends jspa.metamodel.ManagedType
 */
exports.EntityType = EntityType = ManagedType.inherit( /** @lends jspa.metamodel.EntityType.prototype */ {
  persistenceType: Type.PersistenceType.ENTITY,

  /**
   * @type jspa.metamodel.SingularAttribute
   */
  declaredId: null,

  /**
   * @type jspa.metamodel.SingularAttribute
   */
  declaredVersion: null,

  /**
   * @type jspa.metamodel.EntityType
   */
  superType: null,

  /**
   * @type jspa.metamodel.SingularAttribute
   */
  get id() {
    return this.declaredId || this.superType.id;
  },

  /**
   * @type jspa.metamodel.SingularAttribute
   */
  get version() {
    return this.declaredVersion || this.superType.version;
  },

  /**
   * @type jspa.util.Permission
   */
  updatePermission: null,

  /**
   * @type jspa.util.Permission
   */
  createPermission: null,

  /**
   * @type jspa.util.Permission
   */
  deletePermission: null,

  /**
   * @type jspa.util.Permission
   */
  queryPermission: null,

  /**
   * @type jspa.util.Permission
   */
  schemaSubclassPermission: null,

  /**
   * @param {String} ref
   * @param {jspa.metamodel.EntityType} superType
   * @param {Function} typeConstructor
   */
  initialize: function (ref, superType, typeConstructor) {
    this.superCall(ref, typeConstructor);

    this.superType = superType;
    this.createPermission = new Permission();
    this.updatePermission = new Permission();
    this.deletePermission = new Permission();
    this.queryPermission = new Permission();
    this.schemaSubclassPermission = new Permission();
  },

  /**
   * {@inheritDoc}
   * @param {jspa.EntityManager} db {@inheritDoc}
   * @return {jspa.binding.EntityFactory} A factory which creates entity objects
   */
  createObjectFactory: function(db) {
    if (this.isNative) {
      switch (this.name) {
        case '_native.User':
          return binding.UserFactory.create(this, db);
        case '_native.Object':
          return undefined;
      }
    }

    return binding.EntityFactory.create(this, db);
  },

  /**
   * @param {jspa.util.Metadata} state
   * @param {*} currentObject
   * @param {Object} jsonObject
   * @return {*}
   */
  fromDatabaseValue: function (state, jsonObject, currentObject) {
    if (state._root == currentObject) {
      return this.superCall(state, jsonObject, currentObject);
    } else if (jsonObject) {
      return state.db.getReference(jsonObject);
    } else {
      return null;
    }
  },

  /**
   * {@inheritDoc}
   *
   * @param {jspa.util.Metadata} state
   * @param {*} object {@inheritDoc}
   * @return {Object} {@inheritDoc}
   */
  toDatabaseValue: function (state, object) {
    if (state._root == object) {
      // root object
      return this.superCall(state, object);
    } else if (this.typeConstructor.isInstance(object)) {
      object.attach(state.db);
      return Metadata.get(object).ref;
    } else {
      return null;
    }
  },

  toString: function() {
    return "EntityType(" + this.ref + ")";
  },

  toJSON: function() {
    var json = this.superCall();

    json.acl.schemaSubclass = this.schemaSubclassPermission;
    json.acl.create = this.createPermission;
    json.acl.update = this.updatePermission;
    json.acl.delete = this.deletePermission;
    json.acl.query = this.queryPermission;

    return json;
  }
});

EntityType.extend(/** @lends jspa.metamodel.EntityType */ {

  /**
   * @class jspa.metamodel.EntityType.Object
   * @extends jspa.metamodel.EntityType
   */
  Object: EntityType.inherit(/** @lends jspa.metamodel.EntityType.Object.prototype */{
    /** @lends jspa.metamodel.EntityType.Object */
    extend: {
      ref: '/db/_native.Object'
    },

    declaredAttributes: [],

    initialize: function() {
      this.superCall(EntityType.Object.ref, null, Object);

      this.declaredId = new SingularAttribute(this, 'id', BasicType.String);
      this.declaredId.isId = true;
      this.declaredVersion = new SingularAttribute(this, 'version', BasicType.String);
      this.declaredVersion.isVersion = true;
    }
  })
});