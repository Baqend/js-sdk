'use strict';

const error = require('../error');
const Acl = require('../Acl');
const Lockable = require('./Lockable');

/**
 * @alias util.Metadata
 * @extends util.Lockable
 */
class Metadata extends Lockable {

  static create(type, object) {
    let metadata;
    if (type.isEntity) {
      metadata = new Metadata(object, type);
    } else if (type.isEmbeddable) {
      metadata = {
        type: type,
        readAccess() {
          const metadata = this._root && this._root._metadata;
          if (metadata)
            metadata.readAccess();
        },
        writeAccess() {
          const metadata = this._root && this._root._metadata;
          if (metadata)
            metadata.writeAccess();
        }
      };
    } else {
      throw new Error('Illegal type ' + type);
    }

    return metadata;
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
    if(this._db)
      return this._db;

    return this._db = require('../baqend');
  }

  /**
   * @param db {EntityManager}
   */
  set db(db) {
    if(!this._db) {
      this._db = db;
    } else {
      throw new Error("DB has already been set.")
    }
  }

  /**
   * @type string
   */
  get bucket() {
    return this.type.name;
  }

  /**
   * @type string
   */
  get key() {
    if (!this._key && this.id) {
      const index = this.id.lastIndexOf('/');
      this._key = decodeURIComponent(this.id.substring(index + 1));
    }
    return this._key;
  }

  /**
   * @param {string} value
   */
  set key(value) {
    value += '';

    if (this.id)
      throw new Error('The id can\'t be set twice.');

    this.id = '/db/' + this.bucket + '/' + encodeURIComponent(value);
    this._key = value;
  }

  /**
   * Indicates if this object already belongs to an db
   * <code>true</code> if this object belongs already to an db otherwise <code>false</code>
   * @type boolean
   */
  get isAttached() {
    return !!this._db;
  }

  /**
   * Indicates if this object is represents a db object, but was not loaded up to now
   * @type boolean
   */
  get isAvailable() {
    return this._state > Metadata.Type.UNAVAILABLE;
  }

  /**
   * Indicates if this object represents the state of the db and was not modified in any manner
   * @type boolean
   */
  get isPersistent() {
    return this._state == Metadata.Type.PERSISTENT;
  }

  /**
   * Indicates that this object was modified and the object was not written back to the db
   * @type boolean
   */
  get isDirty() {
    return this._state == Metadata.Type.DIRTY;
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
    this._root = entity;
    this._state = Metadata.Type.DIRTY;
    this._enabled = true;
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
   */
  enable(newStateTrackingState) {
    this._enabled = newStateTrackingState;
  }

  /**
   * Signals that the object will be access by a read access
   * Ensures that the object was loaded already
   */
  readAccess() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new error.PersistentError('This object ' + this.id + ' is not available.');
      }
    }
  }

  /**
   * Signals that the object will be access by a write access
   * Ensures that the object was loaded already and marks the object as dirty
   */
  writeAccess() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new error.PersistentError('This object ' + this.id + ' is not available.');
      }

      this.setDirty();
    }
  }

  /**
   * Indicates that the associated object isn't available
   */
  setUnavailable() {
    this._state = Metadata.Type.UNAVAILABLE;
  }

  /**
   * Indicates that the associated object isn't stale, i.e.
   * the object correlate the database state and is not modified by the user
   */
  setPersistent() {
    this._state = Metadata.Type.PERSISTENT;
  }

  /**
   * Indicates the the object is modified by the user
   */
  setDirty() {
    this._state = Metadata.Type.DIRTY;
  }

  /**
   * Indicates the the object is removed
   */
  setRemoved() {
    //mark the object only as dirty if it was already available
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
   * @returns {json} JSON-Object
   * @deprecated
   */
  getJson(options) {
    return this.type.toJsonValue(this, this._root, options);
  }

  /**
   * Sets the object content from json
   * @param {json} json The updated json content
   * @param {Object=} options The options used to apply the json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
   * @param {boolean} [options.onlyMetadata=false} Indicates if only the metadata should be updated
   * @param {boolean} {options.updateMetadataOnly=false} Indicates if only the metadata should be updated
   * @deprecated
   */
  setJson(json, options) {
    this.type.fromJsonValue(this, json, this._root, options);
  }
}

/**
 * @enum {number}
 */
Metadata.Type = {
  UNAVAILABLE: -1,
  PERSISTENT: 0,
  DIRTY: 1
};

module.exports = Metadata;
