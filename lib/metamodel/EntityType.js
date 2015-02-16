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
var EntityType = module.exports = ManagedType.inherit( /** @lends baqend.metamodel.EntityType.prototype */ {
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
   * @type baqend.util.Permission
   */
  updatePermission: null,

  /**
   * @type baqend.util.Permission
   */
  createPermission: null,

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
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.EntityFactory} A factory which creates entity objects
   */
  createObjectFactory: function(db) {
    switch (this.name) {
      case 'User':
        return binding.UserFactory.create(this, db);
      case 'Object':
        return undefined;
    }

    return binding.EntityFactory.create(this, db);
  },

  /**
   * @param {baqend.util.Metadata} state
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
   * @param {baqend.util.Metadata} state
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

    initialize: function() {
      this.superCall(EntityType.Object.ref, null, Object);

      this.declaredId = new SingularAttribute('id', BasicType.String);
      this.declaredId.init(this);
      this.declaredId.isId = true;
      this.declaredVersion = new SingularAttribute('version', BasicType.Double);
      this.declaredVersion.init(this);
      this.declaredVersion.isVersion = true;
    }
  })
});