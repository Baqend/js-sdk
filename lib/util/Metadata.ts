'use strict';

import { Acl } from "../Acl";
import { Lockable } from "./Lockable";
import { deprecated } from "./deprecated";
import { EntityManager } from "../EntityManager";
import { Entity } from "../binding/Entity";
import { EntityType, ManagedType } from "../metamodel";
import { PersistentError } from "../error";
import { Json } from "./Json";

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
  state: Type;
  version: number | null;
  enabled: boolean;
  acl: Acl;
  root: Entity;

  /**
   * Creates a metadata instance for the given type and object instance
   *
   * @param {ManagedType} type The type of the object
   * @param {*} object The object instance of the type
   * @return {*} The created metadata for the object
   */
  static create(type, object) {
    let meta;
    if (type.isEntity) {
      meta = new Metadata(object, type);
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
   * @param {Managed} managed
   * @return {Metadata}
   */
  static get(managed) {
    return managed._metadata;
  }

  /**
   * @type EntityManager
   */
  get db(): EntityManager {
    if (this.entityManager) {
      return this.entityManager;
    }

    this.entityManager = require('../baqend'); // eslint-disable-line global-require
    return this.entityManager!;
  }

  /**
   * @param db {EntityManager}
   */
  set db(db) {
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
   * @param {string} value
   */
  set key(value) {
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
    return this.state > Type.UNAVAILABLE;
  }

  /**
   * Indicates if this object represents the state of the db and was not modified in any manner
   * @type boolean
   * @readonly
   */
  get isPersistent() {
    return this.state === Type.PERSISTENT;
  }

  /**
   * Indicates that this object was modified and the object was not written back to the db
   * @type boolean
   * @readonly
   */
  get isDirty() {
    return this.state === Type.DIRTY;
  }

  /**
   * @param {Entity} entity
   * @param {ManagedType} type
   */
  constructor(entity, type) {
    super();

    this.root = entity;
    this.state = Type.DIRTY;
    this.enabled = true;
    this.id = null;
    this.version = null;
    this.type = type;
    this.acl = new Acl(this);
  }

  /**
   * Enable/Disable state change tracking of this object
   * @param {boolean} newStateTrackingState The new change tracking state
   * @return {void}
   */
  enable(newStateTrackingState) {
    this.enabled = newStateTrackingState;
  }

  /**
   * Signals that the object will be accessed by a read
   *
   * Ensures that the object was loaded already.
   *
   * @return {void}
   */
  readAccess() {
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
   * @return {void}
   */
  writeAccess() {
    if (this.enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.id + ' is not available.');
      }

      this.setDirty();
    }
  }

  /**
   * Indicates that the associated object isn't available
   * @return {void}
   */
  setUnavailable() {
    this.state = Type.UNAVAILABLE;
  }

  /**
   * Indicates that the associated object is not stale
   *
   * An object is stale if it correlates the database state and is not modified by the user.
   *
   * @return {void}
   */
  setPersistent() {
    this.state = Type.PERSISTENT;
  }

  /**
   * Indicates the the object is modified by the user
   * @return {void}
   */
  setDirty() {
    this.state = Type.DIRTY;
  }

  /**
   * Indicates the the object is removed
   * @return {void}
   */
  setRemoved() {
    // mark the object only as dirty if it was already available
    if (this.isAvailable) {
      this.setDirty();
      this.version = null;
    }
  }

  /**
   * Converts the object to an JSON-Object
   * @param {Object|boolean} [options=false] to json options by default excludes the metadata
   * @param {boolean} [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param {number} [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent if its true
   * @return JSON-Object
   * @deprecated
   */
  getJson(options): Json {
    return this.type.toJsonValue(this, this.root, options);
  }

  /**
   * Sets the object content from json
   * @param {json} json The updated json content
   * @param {Object=} options The options used to apply the json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   * Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
   * @param {boolean} [options.onlyMetadata=false} Indicates if only the metadata should be updated
   * @param {boolean} {options.updateMetadataOnly=false} Indicates if only the metadata should be updated
   * @return {void}
   * @deprecated
   */
  setJson(json, options) {
    this.type.fromJsonValue(this, json, this.root, options);
  }
}

/**
 * @enum {number}
 */
export enum Type {
  UNAVAILABLE= -1,
  PERSISTENT= 0,
  DIRTY= 1,
}

deprecated(Metadata.prototype, '_root', 'root');
deprecated(Metadata.prototype, '_state', 'state');
deprecated(Metadata.prototype, '_enabled', 'enabled');
