var binding = require('../binding');

var SingularAttribute = require('./SingularAttribute');
var BasicType = require('./BasicType');
var Type = require('./Type');
var ManagedType = require('./ManagedType');
var Metadata = require('../util/Metadata');
var Permission = require('../util/Permission');

/**
 * @class baqend.metamodel.EntityType
 * @extends baqend.metamodel.ManagedType
 *
 * @param {String} ref
 * @param {baqend.metamodel.EntityType} superType
 * @param {Function} typeConstructor
 */
var EntityType = ManagedType.inherit( /** @lends baqend.metamodel.EntityType.prototype */ {
  persistenceType: Type.PersistenceType.ENTITY,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredId: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredVersion: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredAcl: null,

  /**
   * @type baqend.metamodel.EntityType
   */
  superType: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get id() {
    return this.declaredId || this.superType.id;
  },

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get version() {
    return this.declaredVersion || this.superType.version;
  },

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get acl() {
    return this.declaredAcl || this.superType.acl;
  },

  /**
   * @type baqend.util.Permission
   */
  loadPermission: null,

  /**
   * @type baqend.util.Permission
   */
  updatePermission: null,

  /**
   * @type baqend.util.Permission
   */
  insertPermission: null,

  /**
   * @type baqend.util.Permission
   */
  deletePermission: null,

  /**
   * @type baqend.util.Permission
   */
  queryPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaSubclassPermission: null,

  constructor: function EntityType(ref, superType, typeConstructor) {
    ManagedType.call(this, ref, typeConstructor);

    this.superType = superType;
    this.loadPermission = new Permission();
    this.insertPermission = new Permission();
    this.updatePermission = new Permission();
    this.deletePermission = new Permission();
    this.queryPermission = new Permission();
    this.schemaSubclassPermission = new Permission();
  },

  /**
   * {@inheritDoc}
   */
  createProxyClass: function() {
    var Class = this.superType.typeConstructor;
    if (Class === Object) {
      switch (this.name) {
        case 'User':
          Class = binding.User;
          break;
        case 'Role':
          Class = binding.Role;
          break;
        default:
          Class = binding.Entity;
          break;
      }
    }

    return this._enhancer.createProxy(Class);
  },

  /**
   * {@inheritDoc}
   * Creates an ObjectFactory for this type and the given EntityManager
   * @return {baqend.binding.EntityFactory} A factory which creates entity objects
   */
  createObjectFactory: function(db) {
    switch (this.name) {
      case 'User':
        return binding.UserFactory.create(this, db);
      case 'Device':
        return binding.DeviceFactory.create(this, db);
      case 'Object':
        return undefined;
    }

    return binding.EntityFactory.create(this, db);
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function (state, jsonObject, currentObject, isRoot) {
    if (isRoot) {
      return this.superCall(state, jsonObject, currentObject);
    } else if (jsonObject) {
      return state.db.getReference(jsonObject);
    } else {
      return null;
    }
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function(state, object, isRoot) {
    if (isRoot) {
      return this.superCall(state, object);
    } else if (this.typeConstructor.isInstance(object)) {
      object.attach(state.db);
      return object.id;
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
    json.acl.insert = this.insertPermission;
    json.acl.update = this.updatePermission;
    json.acl.delete = this.deletePermission;
    json.acl.query = this.queryPermission;

    return json;
  }
});

EntityType.extend(/** @lends baqend.metamodel.EntityType */ {

  /**
   * @class baqend.metamodel.EntityType.Object
   * @extends baqend.metamodel.EntityType
   */
  Object: EntityType.inherit(/** @lends baqend.metamodel.EntityType.Object.prototype */{
    /** @lends baqend.metamodel.EntityType.Object */
    extend: {
      ref: '/db/Object'
    },

    constructor: function ObjectType() {
      EntityType.call(this, EntityType.Object.ref, null, Object);

      this.declaredId = new SingularAttribute('id', BasicType.String, true);
      this.declaredId.init(this, 0);
      this.declaredId.isId = true;
      this.declaredVersion = new SingularAttribute('version', BasicType.Double, true);
      this.declaredVersion.init(this, 1);
      this.declaredVersion.isVersion = true;
      this.declaredAcl = new SingularAttribute('acl', BasicType.JsonObject, true);
      this.declaredAcl.init(this, 2);
      this.declaredAcl.isAcl = true;

      this.declaredAttributes = [this.declaredId, this.declaredVersion, this.declaredAcl];
    }
  })
});

module.exports = EntityType;