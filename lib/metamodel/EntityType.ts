'use strict';

import { Entity, EntityFactory, Role, User } from "../binding";

import { Class, Json, JsonMap, Metadata, Permission } from "../util";
import { ManagedType } from "./ManagedType";
import { PersistenceType } from "./Type";
import { BasicType } from "./BasicType";
import { SingularAttribute } from "./SingularAttribute";
import { Acl } from "../Acl";
import { EntityManager } from "../EntityManager";

export class EntityType<T extends Entity> extends ManagedType<T> {
  public static Object;

  public declaredId: SingularAttribute<string> | null = null;
  public declaredVersion: SingularAttribute<number> | null = null;
  public declaredAcl: SingularAttribute<Acl> | null = null;

  public loadPermission: Permission = new Permission();
  public updatePermission: Permission = new Permission();
  public deletePermission: Permission = new Permission();
  public queryPermission: Permission = new Permission();
  public schemaSubclassPermission: Permission = new Permission();
  public insertPermission: Permission = new Permission();

  /**
   * @inheritDoc
   */
  get persistenceType() {
    return PersistenceType.ENTITY;
  }

  /**
   * @type metamodel.SingularAttribute
   */
  get id() {
    return this.declaredId || this.superType!!.id;
  }

  /**
   * @type metamodel.SingularAttribute
   */
  get version() {
    return this.declaredVersion || this.superType!!.version;
  }

  /**
   * @type metamodel.SingularAttribute
   */
  get acl() {
    return this.declaredAcl || this.superType!!.acl;
  }

  /**
   * @param ref
   * @param superType
   * @param typeConstructor
   */
  constructor(ref: string, superType: EntityType<any>, typeConstructor?: Class<T>) {
    super(ref, typeConstructor);
    this.superType = superType;
  }

  /**
   * @inheritDoc
   */
  createProxyClass(): Class<T> {
    let Class = this.superType!!.typeConstructor;
    if (Class === Object) {
      switch (this.name) {
        case 'User':
          Class = User;
          break;
        case 'Role':
          Class = Role;
          break;
        default:
          Class = Entity;
          break;
      }
    }

    return this.enhancer!!.createProxy(Class);
  }

  /**
   * Gets all on this class referencing attributes
   *
   * @param {EntityManager} db The instances will be found by this EntityManager
   * @param {Object} [options] Some options to pass
   * @param {Array.<string>} [options.classes] An array of class names to filter for, null for no filter
   * @return A map from every referencing class to a set of its referencing attribute names
   */
  getReferencing(db, options): Map<ManagedType<any>, Set<string>> {
    const opts = Object.assign({}, options);
    const entities = db.metamodel.entities;
    const referencing = new Map();

    const names = Object.keys(entities);
    for (let i = 0, len = names.length; i < len; i += 1) {
      const name = names[i];
      // Skip class if not in class filter
      if (!opts.classes || opts.classes.indexOf(name) !== -1) {
        const entity = entities[name];
        const iter = entity.attributes();
        for (let el = iter.next(); !el.done; el = iter.next()) {
          const attr = el.value;
          // Filter only referencing singular and collection attributes
          if (attr.type === this || attr.elementType === this) {
            const typeReferences = referencing.get(attr.declaringType) || new Set();
            typeReferences.add(attr.name);
            referencing.set(attr.declaringType, typeReferences);
          }
        }
      }
    }

    return referencing;
  }

  /**
   * @inheritDoc
   */
  createObjectFactory(db: EntityManager): EntityFactory<T> {
    return EntityFactory.create(this, db);
  }

  /**
   * @param {Metadata} state The root object state, can be <code>null</code> if a currentObject is provided
   * @param {json} jsonObject The json data to merge
   * @param {*} currentObject The object where the jsonObject will be merged into, if the current object is null,
   * a new instance will be created
   * @param {Object=} options The options used to apply the json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   * Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
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

    const opt = Object.assign({
      persisting: false,
      onlyMetadata: false,
    }, options);

    let obj;
    let objectState;
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

    // deserialize our properties
    objectState.enable(false);
    super.fromJsonValue(objectState, jsonObject, obj, opt);
    objectState.enable(true);

    if (opt.persisting) {
      objectState.setPersistent();
    } else if (!opt.onlyMetadata) {
      objectState.setDirty();
    }

    return obj;
  }

  /**
   * Converts the given object to json
   * @param {Metadata} state The root object state
   * @param {*} object The object to convert
   * @param {Object} [options=false] to json options by default excludes the metadata
   * @param {boolean} [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param {number|boolean} [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent if its true
   * @return JSON-Object
   */
  toJsonValue(state: Metadata, object: T | null, options: { excludeMetadata?: boolean, depth?: number | boolean }): Json {
    const { depth = 0 } = options;

    const isInDepth = depth === true || depth > -1;

    // check if object is already loaded in state
    const objectState = object && Metadata.get(object);
    if (isInDepth && objectState && objectState.isAvailable) {
      // serialize our properties
      objectState.enable(false);
      const json = super.toJsonValue(objectState, object, { ...options,
        depth: typeof depth === "boolean" ? depth : depth - 1,
      });
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
    return 'EntityType(' + this.ref + ')';
  }

  toJSON(): JsonMap {
    const { acl, ...json } = super.toJSON();

    return {
      ...json,
      acl: {
        ...acl as object,
        schemaSubclass: this.schemaSubclassPermission.toJSON(),
        load: this.loadPermission.toJSON(),
        insert: this.insertPermission.toJSON(),
        update: this.updatePermission.toJSON(),
        delete: this.deletePermission.toJSON(),
        query: this.queryPermission.toJSON(),
      }
    }
  }
}

export class ObjectType extends EntityType<any> {
  static get ref() {
    return '/db/Object';
  }

  constructor() {
    super(EntityType.Object.ref, null as any, Object);

    this.declaredId = new class extends SingularAttribute<string> {
      constructor() {
        super('id', BasicType.String, true);
      }

      getJsonValue(state) {
        return state.id || undefined;
      }

      setJsonValue(state, object, jsonValue) {
        if (!state.id) {
          state.id = jsonValue;
        }
      }
    }();
    this.declaredId.init(this, 0);
    this.declaredId.isId = true;

    this.declaredVersion = new class extends SingularAttribute<number> {
      constructor() {
        super('version', BasicType.Integer, true);
      }

      getJsonValue(state) {
        return state.version || undefined;
      }

      setJsonValue(state, object, jsonValue) {
        if (jsonValue) {
          state.version = jsonValue;
        }
      }
    }();
    this.declaredVersion.init(this, 1);
    this.declaredVersion.isVersion = true;

    this.declaredAcl = new class extends SingularAttribute<Acl> {
      constructor() {
        super('acl', BasicType.JsonObject, true);
      }

      getJsonValue(state) {
        return state.acl.toJSON();
      }

      setJsonValue(state, object, jsonValue) {
        state.acl.fromJSON(jsonValue || {});
      }
    }();

    this.declaredAcl.init(this, 2);
    this.declaredAcl.isAcl = true;

    this.declaredAttributes = [this.declaredId, this.declaredVersion, this.declaredAcl];
  }

  createObjectFactory(db: EntityManager): EntityFactory<any> {
    throw new Error("Objects can't be directly created and persisted");
  }
}

EntityType.Object = ObjectType;
