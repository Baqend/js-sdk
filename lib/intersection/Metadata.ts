import { Acl } from '../Acl';
import { Lockable } from '../util';
import type { EntityManager } from '../EntityManager';
import type { Entity, Managed } from '../binding';
import { PersistentError } from '../error';
import type { EntityType, ManagedType } from '../metamodel';

export interface ManagedState {

  db?: EntityManager;
  type: ManagedType<any>;

  /**
   * Indicates the the object is modified by the user
   */
  setDirty(): void;
}

export enum MetadataState {
  UNAVAILABLE = -1,
  PERSISTENT = 0,
  DIRTY = 1,
}

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
export class Metadata extends Lockable implements ManagedState {
  entityManager: EntityManager | null = null;

  type: EntityType<any>;

  decodedKey: string | null = null;

  id: string | null = null;

  state: MetadataState;

  version: number | null;

  enabled: boolean;

  acl: Acl;

  /**
   * Creates temporary metadata instance for the given embeddable type
   *
   * @param type The type of the object
   * @param db a EntityManager which will be attached to the state
   * @return The created metadata for the object
   */
  static create<T extends Managed>(type: ManagedType<T>, db?: EntityManager): ManagedState;

  /**
   * Creates a metadata instance for the given entity type
   *
   * @param type The type of the object
   * @param db a optional EntityManager which will be attached to the state
   * @return The created metadata for the object
   */
  static create<T extends Entity>(type: EntityType<T>, db?: EntityManager): ManagedState | Metadata;

  static create<T extends Entity>(type: ManagedType<T>, db?: EntityManager): ManagedState | Metadata {
    if (type.isEntity) {
      return new Metadata(type as EntityType<T>);
    } if (type.isEmbeddable) {
      return { type, db, setDirty() { /* ignored */ } };
    }

    throw new Error(`Illegal type ${type}`);
  }

  /**
   * Returns the metadata of the managed object
   * @param managed
   * @return
   */
  static get(managed: Entity): Metadata {
    // eslint-disable-next-line no-underscore-dangle
    return managed._metadata;
  }

  /**
   * @type EntityManager
   */
  get db(): EntityManager {
    if (this.entityManager) {
      return this.entityManager;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.entityManager = require('../baqend').db;

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
    const val = `${value}`;

    if (this.id) {
      throw new Error('The id can\'t be set twice.');
    }

    this.id = `/db/${this.bucket}/${encodeURIComponent(val)}`;
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
   * @param type
   */
  constructor(type: EntityType<any>) {
    super();

    this.state = MetadataState.DIRTY;
    this.enabled = true;
    this.id = null;
    this.version = null;
    this.type = type;
    this.acl = new Acl();
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
   * Throws the corresponding error if a property is accessed before the owning object is loaded
   * @throws an exception if the object properties aren't available and the object is enabled
   */
  throwUnloadedPropertyAccess(property: string) {
    if (this.enabled && !this.isAvailable) {
      throw new PersistentError(`Illegal property access on ${this.id}#${property} , ensure that this reference is loaded before it's properties are accessed.`);
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
}
