'use strict';

const error = require('../error');
const Acl = require('../Acl');
const Lockable = require('./Lockable');
const deprecated = require('./deprecated');

/**
 * The Metadata instance tracks the state of an object and checks if the object state was changed since last
 * load/update. The metadata keeps therefore the state of:
 * - in which state the object currently is
 * - which db managed the instance
 * - the metadata of the object (id, version, bucket)
 * - which is the owning object (root object) of an embedded object
 *
 * {@link util.Metadata#get(object)} can be used on any managed object to retrieve the metadata of the root object
 *
 * @alias util.Metadata
 * @extends util.Lockable
 */
class Metadata extends Lockable {
  /**
   * Creates a metadata instance for the given type and object instance
   *
   * @param {metamodel.ManagedType} type The type of the object
   * @param {*} object The object instance of the type
   * @return {*} The created metadata for the object
   */
  static create(type, object) {
    return new Metadata(object, type);
  }

  /**
   * Returns the metadata of the managed object
   * @param {binding.Managed} managed
   * @return {util.Metadata}
   */
  static get(managed) {
    return managed._metadata;
  }

  /**
   * @type EntityManager
   */
  get db() {
    if (this.entityManager) {
      return this.entityManager;
    }

    this.entityManager = require('../baqend'); // eslint-disable-line global-require
    return this.entityManager;
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
    return this.state > Metadata.Type.UNAVAILABLE;
  }

  /**
   * Indicates if this object represents the state of the db and was not modified in any manner
   * @type boolean
   * @readonly
   */
  get isPersistent() {
    return this.state === Metadata.Type.PERSISTENT;
  }

  /**
   * Indicates that this object was modified and the object was not written back to the db
   * @type boolean
   * @readonly
   */
  get isDirty() {
    return this.state === Metadata.Type.DIRTY;
  }

  /**
   * @param {binding.Entity} entity
   * @param {metamodel.ManagedType} type
   */
  constructor(entity, type) {
    super();

    /**
     * @type binding.Entity
     * @private
     */
    this.root = entity;
    this.state = Metadata.Type.DIRTY;
    this.enabled = true;
    /** @type string */
    this.id = null;
    /** @type number */
    this.version = null;
    /** @type metamodel.ManagedType */
    this.type = type;
    /** @type Acl */
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
   * Throws the corresponding error if a property is accessed before the owning object is loaded
   */
  throwUnloadedPropertyAccess(property) {
    if (this.enabled && !this.isAvailable) {
      throw new error.PersistentError('Illegal property access on ' + this.id + '#' + property + ' , ensure that this reference is loaded before it\'s properties are accessed.');
    }
  }

  /**
   * Indicates that the associated object isn't available
   * @return {void}
   */
  setUnavailable() {
    this.state = Metadata.Type.UNAVAILABLE;
  }

  /**
   * Indicates that the associated object is not stale
   *
   * An object is stale if it correlates the database state and is not modified by the user.
   *
   * @return {void}
   */
  setPersistent() {
    this.state = Metadata.Type.PERSISTENT;
  }

  /**
   * Indicates the the object is modified by the user
   * @return {void}
   */
  setDirty() {
    this.state = Metadata.Type.DIRTY;
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
   * @return {json} JSON-Object
   * @deprecated
   */
  getJson(options) {
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
Metadata.Type = {
  UNAVAILABLE: -1,
  PERSISTENT: 0,
  DIRTY: 1,
};

deprecated(Metadata.prototype, '_root', 'root');
deprecated(Metadata.prototype, '_state', 'state');
deprecated(Metadata.prototype, '_enabled', 'enabled');

module.exports = Metadata;
