"use strict";

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
class EntityType extends ManagedType {

  get persistenceType() {
    return Type.PersistenceType.ENTITY;
  }

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get id() {
    return this.declaredId || this.superType.id;
  }

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get version() {
    return this.declaredVersion || this.superType.version;
  }

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get acl() {
    return this.declaredAcl || this.superType.acl;
  }

  constructor(ref, superType, typeConstructor) {
    super(ref, typeConstructor);

    /** @type baqend.metamodel.SingularAttribute */
    this.declaredId = null;
    /** @type baqend.metamodel.SingularAttribute */
    this.declaredVersion = null;
    /** @type baqend.metamodel.SingularAttribute */
    this.declaredAcl = null;
    /** @type baqend.metamodel.EntityType */
    this.superType = superType;

    /** @type baqend.util.Permission */
    this.updatePermission = new Permission();
    /** @type baqend.util.Permission */
    this.deletePermission = new Permission();
    /** @type baqend.util.Permission */
    this.queryPermission = new Permission();
    /** @type baqend.util.Permission */
    this.schemaSubclassPermission = new Permission();
    /** @type baqend.util.Permission */
    this.insertPermission = new Permission();
  }

  /**
   * {@inheritDoc}
   * Creates an ObjectFactory for this type and the given EntityManager
   * @return {baqend.binding.EntityFactory} A factory which creates entity objects
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
      return Metadata.get(object).ref;
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
 * @class baqend.metamodel.EntityType.Object
 * @extends baqend.metamodel.EntityType
 */
EntityType.Object = class ObjectType extends EntityType {
  static get ref() {
    return '/db/Object';
  }

  constructor() {
    super(EntityType.Object.ref, null, Object);

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
};

module.exports = EntityType;