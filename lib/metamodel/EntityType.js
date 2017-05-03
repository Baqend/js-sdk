"use strict";

var binding = require('../binding');

var SingularAttribute = require('./SingularAttribute');
var BasicType = require('./BasicType');
var Type = require('./Type');
var ManagedType = require('./ManagedType');
var util = require('../util');

/**
 * @alias metamodel.EntityType
 * @extends metamodel.ManagedType
 */
class EntityType extends ManagedType {

  get persistenceType() {
    return Type.PersistenceType.ENTITY;
  }

  /**
   * @type metamodel.SingularAttribute
   */
  get id() {
    return this.declaredId || this.superType.id;
  }

  /**
   * @type metamodel.SingularAttribute
   */
  get version() {
    return this.declaredVersion || this.superType.version;
  }

  /**
   * @type metamodel.SingularAttribute
   */
  get acl() {
    return this.declaredAcl || this.superType.acl;
  }

  /**
   * @param {string} ref
   * @param {metamodel.EntityType} superType
   * @param {Class<binding.Entity>} typeConstructor
   */
  constructor(ref, superType, typeConstructor) {
    super(ref, typeConstructor);

    /** @type metamodel.SingularAttribute */
    this.declaredId = null;
    /** @type metamodel.SingularAttribute */
    this.declaredVersion = null;
    /** @type metamodel.SingularAttribute */
    this.declaredAcl = null;
    /** @type metamodel.EntityType */
    this.superType = superType;

    /** @type util.Permission */
    this.loadPermission = new util.Permission();
    /** @type util.Permission */
    this.updatePermission = new util.Permission();
    /** @type util.Permission */
    this.deletePermission = new util.Permission();
    /** @type util.Permission */
    this.queryPermission = new util.Permission();
    /** @type util.Permission */
    this.schemaSubclassPermission = new util.Permission();
    /** @type util.Permission */
    this.insertPermission = new util.Permission();
  }

  /**
   * {@inheritDoc}
   */
  createProxyClass() {
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
  }

  /**
   * {@inheritDoc}
   * Creates an ObjectFactory for this type and the given EntityManager
   * @return {binding.EntityFactory<binding.Entity>} A factory which creates entity objects
   */
  createObjectFactory(db) {
    switch (this.name) {
      case 'User':
        return binding.UserFactory.create(this, db);
      case 'Device':
        return binding.DeviceFactory.create(this, db);
      case 'Object':
        return undefined;
    }

    return binding.EntityFactory.create(this, db);
  }

  /**
   * @inheritDoc
   */
  fromJsonValue (state, jsonObject, currentObject, isRoot) {
    if (isRoot) {
      return super.fromJsonValue(state, jsonObject, currentObject);
    } else if (jsonObject) {
      return state.db.getReference(jsonObject);
    } else {
      return null;
    }
  }

  /**
   * @inheritDoc
   */
  toJsonValue(state, object, isRoot) {
    if (isRoot) {
      return super.toJsonValue(state, object);
    } else if (object instanceof this.typeConstructor) {
      object.attach(state.db);
      return object.id;
    } else {
      return null;
    }
  }

  toString() {
    return "EntityType(" + this.ref + ")";
  }

  toJSON() {
    var json = super.toJSON();

    json.acl.schemaSubclass = this.schemaSubclassPermission;
    json.acl.insert = this.insertPermission;
    json.acl.update = this.updatePermission;
    json.acl.delete = this.deletePermission;
    json.acl.query = this.queryPermission;

    return json;
  }
}

/**
 * @alias metamodel.EntityType.Object
 * @extends metamodel.EntityType
 */
class ObjectType extends EntityType {
  static get ref() {
    return '/db/Object';
  }

  constructor() {
    super(EntityType.Object.ref, null, Object);

    this.declaredId = new SingularAttribute('id', BasicType.String, true);
    this.declaredId.init(this, 0);
    this.declaredId.isId = true;
    this.declaredVersion = new SingularAttribute('version', BasicType.Integer, true);
    this.declaredVersion.init(this, 1);
    this.declaredVersion.isVersion = true;
    this.declaredAcl = new SingularAttribute('acl', BasicType.JsonObject, true);
    this.declaredAcl.init(this, 2);
    this.declaredAcl.isAcl = true;

    this.declaredAttributes = [this.declaredId, this.declaredVersion, this.declaredAcl];
  }
}

EntityType.Object = ObjectType;

module.exports = EntityType;