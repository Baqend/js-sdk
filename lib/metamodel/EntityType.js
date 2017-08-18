"use strict";

const binding = require('../binding');

const SingularAttribute = require('./SingularAttribute');
const BasicType = require('./BasicType');
const Type = require('./Type');
const ManagedType = require('./ManagedType');
const Permission = require('../util/Permission');
const Metadata = require('../util/Metadata');

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
   * @param {Class<binding.Entity>=} typeConstructor
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
    this.loadPermission = new Permission();
    /** @type util.Permission */
    this.updatePermission = new Permission();
    /** @type util.Permission */
    this.deletePermission = new Permission();
    /** @type util.Permission */
    this.queryPermission = new Permission();
    /** @type util.Permission */
    this.schemaSubclassPermission = new Permission();
    /** @type util.Permission */
    this.insertPermission = new Permission();
  }

  /**
   * {@inheritDoc}
   */
  createProxyClass() {
    let Class = this.superType.typeConstructor;
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
   * Gets all on this class referencing attributes
   *
   * @param {EntityManager} db The instances will be found by this EntityManager
   * @params {Object} [options] Some options to pass
   * @params {Array.<string>|null} [options.classes=null] An array of class names to filter for, null for no filter
   * @return {Map.<metamodel.ManagedType, Set.<string>>} A map from every referencing class to a set of its referencing attribute names
   */
  getReferencing(db, options) {
    const opts = Object.assign({
      classes: null
    }, options);
    const entities = db.metamodel.entities;
    const referencing = new Map();

    for (const name of Object.keys(entities)) {
      // Skip class if not in class filter
      if (opts.classes && opts.classes.indexOf(name) < 0) {
        continue;
      }

      const entity = entities[name];
      for (const attr of entity.attributes()) {
        // Filter only referencing singular and collection attributes
        if (attr.type === this || attr.elementType === this) {
          const typeReferences = referencing.get(attr.declaringType) || new Set();
          typeReferences.add(attr.name);
          referencing.set(attr.declaringType, typeReferences);
        }
      }
    }

    return referencing;
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
   * @param {util.Metadata} state The root object state, can be <code>null</code> if a currentObject is provided
   * @param {json} jsonObject The json data to merge
   * @param {*} currentObject The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @param {Object=} options The options used to apply the json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
   * @param {boolean} [options.onlyMetadata=false] Indicates if only the metadata should be updated
   * @return {*} The merged entity instance
   */
  fromJsonValue(state, jsonObject, currentObject, options) {
    // handle references
    if (typeof jsonObject === 'string') {
      return state.db.getReference(jsonObject);
    }

    if (!jsonObject || typeof jsonObject !== 'object') {
      return null;
    }

    options = Object.assign({
      persisting: false,
      onlyMetadata: false
    }, options);

    let obj, objectState;
    if (currentObject) {
      const currentObjectState = Metadata.get(currentObject);
      // merge state into the current object if:
      // 1. The provided json does not contains an id and we have an already created object for it
      // 2. The object was created without an id and was later fetched from the server (e.g. User/Role)
      // 3. The provided json has the same id as the current object, they can differ on embedded json for a reference
      if (!jsonObject.id || !currentObjectState.id || jsonObject.id === currentObjectState.id) {
        obj = currentObject;
        objectState = currentObjectState;
      }
    }

    if (!obj) {
      obj = state.db.getReference(this.typeConstructor, jsonObject.id);
      objectState = Metadata.get(obj);
    }

    //deserialize our properties
    objectState.enable(false);
    super.fromJsonValue(objectState, jsonObject, obj, options);
    objectState.enable(true);

    if (options.persisting) {
      objectState.setPersistent();
    } else if (!options.onlyMetadata) {
      objectState.setDirty();
    }

    return obj;
  }

  /**
   * Converts the given object to json
   * @param {util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @param {Object} [options=false] to json options by default excludes the metadata
   * @param {boolean} [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param {number|boolean} [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent if its true
   * @returns {json} JSON-Object
   */
  toJsonValue(state, object, options) {
    options = Object.assign({
      excludeMetadata: false,
      depth: 0,
      persisting: false
    }, options);

    const isInDepth = options.depth === true || options.depth > -1;

    // check if object is already loaded in state
    const objectState = object && Metadata.get(object);
    if (isInDepth && objectState && objectState.isAvailable) {
      // serialize our properties
      objectState.enable(false);
      const json = super.toJsonValue(objectState, object, Object.assign({}, options, {depth: options.depth === true? true: options.depth - 1}));
      objectState.enable(true);

      return json;
    }

    if (object instanceof this.typeConstructor) {
      object.attach(state.db);
      return object.id;
    }

    return null;
  }

  toString() {
    return "EntityType(" + this.ref + ")";
  }

  toJSON() {
    const json = super.toJSON();

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

    this.declaredId = new class extends SingularAttribute {
      constructor() {
        super('id', BasicType.String, true);
      }

      getJsonValue(state, object, options) {
        return state.id || undefined;
      }

      setJsonValue(state, object, jsonValue) {
        if (!this.id)
          state.id = jsonValue;
      }
    };
    this.declaredId.init(this, 0);
    this.declaredId.isId = true;

    this.declaredVersion = new class extends SingularAttribute {
      constructor() {
        super('version', BasicType.Integer, true);
      }

      getJsonValue(state, object, options) {
        return state.version || undefined;
      }

      setJsonValue(state, object, jsonValue) {
        if (jsonValue)
          state.version = jsonValue;
      }
    };
    this.declaredVersion.init(this, 1);
    this.declaredVersion.isVersion = true;

    this.declaredAcl = new class extends SingularAttribute {
      constructor() {
        super('acl', BasicType.JsonObject, true);
      }

      getJsonValue(state, object, options) {
        return state.acl.toJSON();
      }

      setJsonValue(state, object, jsonValue) {
        state.acl.fromJSON(jsonValue || {});
      }
    };
    this.declaredAcl.init(this, 2);
    this.declaredAcl.isAcl = true;

    this.declaredAttributes = [this.declaredId, this.declaredVersion, this.declaredAcl];
  }
}

EntityType.Object = ObjectType;

module.exports = EntityType;
