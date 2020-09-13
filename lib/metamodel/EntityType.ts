// eslint-disable-next-line max-classes-per-file
import {
  DeviceFactory, Entity, EntityFactory, Managed, Role, User, UserFactory,
} from '../binding';

import { Class, Json, JsonMap } from '../util';
import { ManagedType } from './ManagedType';
import { PersistenceType } from './Type';
import { BasicType } from './BasicType';
import { SingularAttribute } from './SingularAttribute';
import type { Acl } from '../Acl';
import type { EntityManager } from '../EntityManager';
import { PluralAttribute } from './PluralAttribute';
import { Attribute } from './Attribute';
import { Metadata, Permission, ManagedState } from '../intersection';

export class EntityType<T extends Entity> extends ManagedType<T> {
  public static Object = class ObjectType extends EntityType<any> {
    static get ref() {
      return '/db/Object';
    }

    constructor() {
      super(EntityType.Object.ref, null as any, Object);

      this.declaredId = new class extends SingularAttribute<String> {
        constructor() {
          super('id', BasicType.String, true);
        }

        getJsonValue(state: ManagedState): Json {
          return (state as Metadata).id || undefined as any;
        }

        setJsonValue(state: ManagedState, object: Managed, jsonValue: Json) {
          if (!(state as Metadata).id) {
            // eslint-disable-next-line no-param-reassign
            (state as Metadata).id = jsonValue as string;
          }
        }
      }();
      this.declaredId.init(this, 0);
      this.declaredId.isId = true;

      this.declaredVersion = new class extends SingularAttribute<Number> {
        constructor() {
          super('version', BasicType.Integer, true);
        }

        getJsonValue(state: ManagedState) {
          return (state as Metadata).version || undefined as any;
        }

        setJsonValue(state: ManagedState, object: Managed, jsonValue: Json) {
          if (jsonValue) {
            // eslint-disable-next-line no-param-reassign
            (state as Metadata).version = jsonValue as number;
          }
        }
      }();
      this.declaredVersion.init(this, 1);
      this.declaredVersion.isVersion = true;

      this.declaredAcl = new class extends SingularAttribute<Acl> {
        constructor() {
          super('acl', BasicType.JsonObject as BasicType<any>, true);
        }

        getJsonValue(state: ManagedState, object: Managed,
          options: { excludeMetadata?: boolean; depth?: number | boolean; persisting: boolean }) {
          const persisted: { acl?: JsonMap } = Attribute.attachState(object, {});
          const persistedAcl = persisted.acl || {};
          const acl = (state as Metadata).acl.toJSON();

          const unchanged = Object.keys(acl).every((permission) => {
            const oldPermission = (persistedAcl[permission] || {}) as JsonMap;
            const newPermission = acl[permission] as JsonMap;
            const newKeys = Object.keys(newPermission);
            const oldKeys = Object.keys(oldPermission);

            return newKeys.length === oldKeys.length
              && newKeys.every((ref) => oldPermission[ref] === newPermission[ref]);
          });

          if (!unchanged) {
            state.setDirty();
          }

          if (options.persisting) {
            persisted.acl = acl;
          }

          return acl;
        }

        setJsonValue(state: ManagedState, object: Managed, jsonValue: Json,
          options: { onlyMetadata?: boolean; persisting: boolean }): void {
          const acl = (jsonValue || {}) as JsonMap;

          if (options.persisting) {
            const persistedState: { acl?: JsonMap } = Attribute.attachState(object, {});
            persistedState.acl = acl;
          }

          (state as Metadata).acl.fromJSON(acl);
        }
      }();

      this.declaredAcl.init(this, 2);
      this.declaredAcl.isAcl = true;

      this.declaredAttributes = [this.declaredId, this.declaredVersion, this.declaredAcl];
    }

    createObjectFactory(): EntityFactory<any> {
      throw new Error("Objects can't be directly created and persisted");
    }
  };

  public declaredId: SingularAttribute<String> | null = null;

  public declaredVersion: SingularAttribute<Number> | null = null;

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

  get id(): SingularAttribute<String> {
    return this.declaredId || this.superType!!.id;
  }

  get version(): SingularAttribute<Number> {
    return this.declaredVersion || this.superType!!.version;
  }

  get acl(): SingularAttribute<Acl> {
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
    let { typeConstructor } = this.superType!!;
    if (typeConstructor === Object) {
      switch (this.name) {
        case 'User':
          typeConstructor = User;
          break;
        case 'Role':
          typeConstructor = Role;
          break;
        default:
          typeConstructor = Entity;
          break;
      }
    }

    return this.enhancer!!.createProxy(typeConstructor);
  }

  /**
   * Gets all on this class referencing attributes
   *
   * @param db The instances will be found by this EntityManager
   * @param [options] Some options to pass
   * @param [options.classes] An array of class names to filter for, null for no filter
   * @return A map from every referencing class to a set of its referencing attribute names
   */
  getReferencing(db: EntityManager, options?: {classes?: string[]}): Map<ManagedType<any>, Set<string>> {
    const opts = { ...options };
    const { entities } = db.metamodel;
    const referencing = new Map();

    const names = Object.keys(entities!);
    for (let i = 0, len = names.length; i < len; i += 1) {
      const name = names[i];
      // Skip class if not in class filter
      if (!opts.classes || opts.classes.indexOf(name) !== -1) {
        const entity = entities[name];
        const iter = entity.attributes();
        for (let el = iter.next(); !el.done; el = iter.next()) {
          const attr = el.value;
          // Filter only referencing singular and collection attributes
          if ((attr instanceof SingularAttribute && attr.type === this)
            || (attr instanceof PluralAttribute && attr.elementType === this)) {
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
    switch (this.name) {
      case 'User':
        return UserFactory.create(this, db) as EntityFactory<T>;
      case 'Device':
        return DeviceFactory.create(this, db) as EntityFactory<T>;
      default:
        return EntityFactory.create(this, db) as EntityFactory<T>;
    }
  }

  /**
   * @param state The root object state, can be <code>null</code> if a currentObject is provided
   * @param jsonObject The json data to merge
   * @param currentObject The object where the jsonObject will be merged into, if the current object is null,
   * a new instance will be created
   * @param options The options used to apply the json
   * @param [options.persisting=false] indicates if the current state will be persisted.
   * Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
   * @param [options.onlyMetadata=false] Indicates if only the metadata should be updated
   * @return The merged entity instance
   */
  fromJsonValue(state: ManagedState, jsonObject: Json, currentObject: T | null,
    options: { persisting?: boolean, onlyMetadata?: boolean }): T | null {
    // handle references
    if (typeof jsonObject === 'string') {
      return state.db?.getReference(jsonObject) as T || null;
    }

    if (!jsonObject || typeof jsonObject !== 'object') {
      return null;
    }

    const json = jsonObject as JsonMap;

    const opt = {
      persisting: false,
      onlyMetadata: false,
      ...options,
    };

    let obj;
    if (currentObject) {
      const currentObjectState = Metadata.get(currentObject);
      // merge state into the current object if:
      // 1. The provided json does not contains an id and we have an already created object for it
      // 2. The object was created without an id and was later fetched from the server (e.g. User/Role)
      // 3. The provided json has the same id as the current object, they can differ on embedded json for a reference
      if (!json.id || !currentObjectState.id || json.id === currentObjectState.id) {
        obj = currentObject;
      }
    }

    if (!obj) {
      obj = state.db?.getReference(this.typeConstructor, json.id as string);
    }

    if (!obj) {
      return null;
    }

    const objectState = Metadata.get(obj);
    // deserialize our properties
    objectState.enable(false);
    super.fromJsonValue(objectState, json, obj, opt);
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
   * @param state The root object state
   * @param object The object to convert
   * @param [options=false] to json options by default excludes the metadata
   * @param [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @param [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent if its true
   * @return JSON-Object
   */
  toJsonValue(state: ManagedState, object: T | null,
    options?: { excludeMetadata?: boolean, depth?: number | boolean, persisting?: boolean }): Json {
    const { depth = 0, persisting = false } = options || {};
    const isInDepth = depth === true || depth > -1;

    // check if object is already loaded in state
    const objectState = object && Metadata.get(object);
    if (isInDepth && objectState && objectState.isAvailable) {
      // serialize our properties
      objectState.enable(false);
      const json = super.toJsonValue(objectState, object, {
        ...options,
        persisting,
        depth: typeof depth === 'boolean' ? depth : depth - 1,
      });
      objectState.enable(true);

      return json;
    }

    if (state.db && object instanceof this.typeConstructor) {
      object.attach(state.db);
      return object.id;
    }

    return null;
  }

  toString() {
    return `EntityType(${this.ref})`;
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
      },
    };
  }
}
