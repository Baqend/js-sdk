'use strict';

import { Acl } from "../Acl";
import { Lockable } from "../util/Lockable";
import { EntityManager } from "../EntityManager";
import { Entity } from "../binding/Entity";
import { EntityType, ManagedType } from "../metamodel";
import { PersistentError } from "../error";
import { Json } from "../util/Json";
import { Managed } from "../binding";

/**
 * The Metadata instance tracks the state of an object and checks if the object state was changed since last
 * load/update. The metadata keeps therefore the state of:
 * - in which state the object currently is
 * - which db managed the instance
 * - the metadata of the object (id, version, bucket)
 * - which is the owning object (root object) of an embedded object
 *
 * {@link Metadata#get(object)} can be used on any managed object to retrieve the metadata of the root object
 */
export class Metadata extends Lockable {
  entityManager: EntityManager | null = null;
  type: EntityType<any>;
  decodedKey: string | null = null;
  id: string | null = null;
  state: MetadataState;
  version: number | null;
  enabled: boolean;
  acl: Acl;
  root: Entity;

  /**
   * Creates a metadata instance for the given type and object instance
   *
   * @param type The type of the object
   * @param object The object instance of the type
   * @return The created metadata for the object
   */
  static create<T extends Managed>(type: ManagedType<T>, object: T): Metadata {
    let meta;
    if (type.isEntity) {
      if (!(object instanceof Entity)) {
        throw new Error('Object is not an entity, metadata can\'t be created. ' + object);
      }

      meta = new Metadata(object as Entity, type as EntityType<any>);
    } else if (type.isEmbeddable) {
      meta = {
        type,
        readAccess() {
          const metadata = this.root && this.root._metadata;
          if (metadata) {
            metadata.readAccess();
          }
        },
        writeAccess() {
          const metadata = this.root && this.root._metadata;
          if (metadata) {
            metadata.writeAccess();
          }
        },
      };
    } else {
      throw new Error('Illegal type ' + type);
    }

    return meta;
  }

  /**
   * Returns the metadata of the managed object
   * @param managed
   * @return
   */
  static get(managed: Managed): Metadata {
    return managed._metadata;
  }

  /**
   * @type EntityManager
   */
  get db(): EntityManager {
    if (this.entityManager) {
      return this.entityManager;
    }

    this.entityManager = require('../baqend').db; // eslint-disable-line global-require

    return this.entityManager!;
  }

  /**
   * @param db
   */
  set db(db: EntityManager) {
    if (!this.entityManager) {
      this.entityManager = db;
    } else {
      throw new Error('DB has already been set.');
    }
  }

  /**
   * @type string
   * @readonly
   */
  get bucket() {
    return this.type.name;
  }

  /**
   * @type string
   * @readonly
   */
  get key() {
    if (!this.decodedKey && this.id) {
      const index = this.id.lastIndexOf('/');
      this.decodedKey = decodeURIComponent(this.id.substring(index + 1));
    }
    return this.decodedKey;
  }

  /**
   * @param value
   */
  set key(value: string | null) {
    const val = value + '';

    if (this.id) {
      throw new Error('The id can\'t be set twice.');
    }

    this.id = '/db/' + this.bucket + '/' + encodeURIComponent(val);
    this.decodedKey = val;
  }

  /**
   * Indicates if this object already belongs to an db
   * <code>true</code> if this object belongs already to an db otherwise <code>false</code>
   * @type boolean
   * @readonly
   */
  get isAttached() {
    return !!this.entityManager;
  }

  /**
   * Indicates if this object is represents a db object, but was not loaded up to now
   * @type boolean
   * @readonly
   */
  get isAvailable() {
    return this.state > MetadataState.UNAVAILABLE;
  }

  /**
   * Indicates if this object represents the state of the db and was not modified in any manner
   * @type boolean
   * @readonly
   */
  get isPersistent() {
    return this.state === MetadataState.PERSISTENT;
  }

  /**
   * Indicates that this object was modified and the object was not written back to the db
   * @type boolean
   * @readonly
   */
  get isDirty() {
    return this.state === MetadataState.DIRTY;
  }

  /**
   * @param entity
   * @param type
   */
  constructor(entity: Entity, type: EntityType<any>) {
    super();

    this.root = entity;
    this.state = MetadataState.DIRTY;
    this.enabled = true;
    this.id = null;
    this.version = null;
    this.type = type;
    this.acl = new Acl(this);
  }

  /**
   * Enable/Disable state change tracking of this object
   * @param newStateTrackingState The new change tracking state
   * @return
   */
  enable(newStateTrackingState: boolean): void {
    this.enabled = newStateTrackingState;
  }

  /**
   * Signals that the object will be accessed by a read
   *
   * Ensures that the object was loaded already.
   *
   * @return
   */
  readAccess(): void {
    if (this.enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.id + ' is not available.');
      }
    }
  }

  /**
   * Signals that the object will be accessed by a write
   *
   * Ensures that the object was loaded already and marks the object as dirty.
   *
   * @return
   */
  writeAccess(): void {
    if (this.enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.id + ' is not available.');
      }

      this.setDirty();
    }
  }

  /**
   * Indicates that the associated object isn't available
   * @return
   */
  setUnavailable(): void {
    this.state = MetadataState.UNAVAILABLE;
  }

  /**
   * Indicates that the associated object is not stale
   *
   * An object is stale if it correlates the database state and is not modified by the user.
   *
   * @return
   */
  setPersistent(): void {
    this.state = MetadataState.PERSISTENT;
  }

  /**
   * Indicates the the object is modified by the user
   * @return
   */
  setDirty(): void {
    this.state = MetadataState.DIRTY;
  }

  /**
   * Indicates the the object is removed
   * @return
   */
  setRemoved(): void {
    // mark the object only as dirty if it was already available
    if (this.isAvailable) {
      this.setDirty();
      this.version = null;
    }
  }

  /**
   * Converts the object to an JSON-Object
   * @param [options=false] to json options by default excludes the metadata
   * @param [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @param [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent if its true
   * @return JSON-Object
   * @deprecated
   */
  getJson(options?: boolean | { excludeMetadata?: boolean, depth?: boolean | number, persisting?: boolean }): Json {
    return this.type.toJsonValue(this, this.root, typeof options !== 'object' ? { excludeMetadata: options } : options);
  }

  /**
   * Sets the object content from json
   * @param json The updated json content
   * @param options The options used to apply the json
   * @param [options.persisting=false] indicates if the current state will be persisted.
   * Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
   * @param [options.onlyMetadata=false} Indicates if only the metadata should be updated
   * @return
   * @deprecated
   */
  setJson(json: Json, options?: { persisting?: boolean, onlyMetadata?: boolean }): void {
    this.type.fromJsonValue(this, json, this.root, options || {});
  }
}

export enum MetadataState {
  UNAVAILABLE = -1,
  PERSISTENT = 0,
  DIRTY = 1,
}
