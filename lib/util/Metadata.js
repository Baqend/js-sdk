"use strict";

var error = require('../error');
var Acl = require('./Acl');
var Lockable = require('./Lockable');
var binding = require('../binding');

/**
 * @class baqend.util.Metadata
 */
class Metadata extends Lockable {

    /**
     * @param {baqend.binding.Entity} entity
     * @return {baqend.util.Metadata}
     */
    get(entity) {
      //if (!(entity instanceof binding.Entity))
      //  throw new error.IllegalEntityError(entity);

      return entity._metadata;
    },

  /**
   * @param {baqend.binding.Entity|baqend.Collection} object
   * @return {baqend.util.Metadata}
   */
  static getRoot(object) {
    var metadata = object && object._metadata;

    if (metadata && metadata._root != object)
      metadata = metadata._root && metadata._root._metadata;

    return metadata;
  }

  /**
   * @param {baqend.binding.Entity|baqend.Collection} object
   */
  static readAccess(object) {
    var metadata = Metadata.getRoot(object);
    if (metadata)
      metadata.readAccess();
  }

  /**
   * @param {baqend.binding.Entity|baqend.Collection} object
   */
  static writeAccess(object) {
    var metadata = Metadata.getRoot(object);
    if (metadata)
      metadata.writeAccess();
  }

  /**
   * @return {baqend.EntityManager}
   */
  get db() {
    if(this._db)
      return this._db;

    return this._db = require('../');
  }

  /**
   * @param db {baqend.EntityManager}
   */
  set db(db) {
    if(!this._db) {
      this._db = db;
    } else {
      throw new Error("DB has already been set.")
    }
  }

  /**
   * @return {String}
   */
  get bucket() {
    return this.type && this.type.name
  }

  /**
   * @return {String}
   */
  get key() {
    if (!this._key && this.id) {
      var index = this.id.lastIndexOf('/');
      this._key = decodeURIComponent(this.id.substring(index + 1));
    }
    return this._key;
  }

  /**
   * @return {Boolean}
   */
  get isAttached() {
    return !!this._db;
  }

  /**
   * @return {Boolean}
   */
  get isAvailable() {
    return this._state > Metadata.Type.UNAVAILABLE;
  }

  /**
   * @return {Boolean}
   */
  get isPersistent() {
    return this._state == Metadata.Type.PERSISTENT;
  }

  /**
   * @return {Boolean}
   */
  get isDirty() {
    return this._state == Metadata.Type.DIRTY;
  }

  /**
   * @param {baqend.binding.Entity} entity
   * @param {baqend.binding.ManagedType} type
   */
  constructor(entity, type) {
    /**
     * @type baqend.binding.Entity
     * @private
     */
    this._root = entity;
    this._state = Metadata.Type.DIRTY;
    this._enabled = true;
    /** @type String */
    this.id = null;
    /** @type Number */
    this.version = null;
    /** @type baqend.metamodel.ManagedType */
    this.type = type;
    /** @type baqend.util.Acl */
    this.acl = new Acl(this);
  }

  readAccess() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new error.PersistentError('This object ' + this.bucket + '/' + this.id + ' is not available.');
      }
    }
  }

  writeAccess() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new error.PersistentError('This object ' + this.bucket + '/' + this.id + ' is not available.');
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
    this.setDirty();
    this.version = null;
  }

  getJsonMetadata(excludeVersion) {
    var info = {};

    if (this.id) {
      info.id = this.id;
    }

    if (!excludeVersion && this.version) {
      info.version = this.version;
    }

    info.acl = this.acl;

    return info;
  }

  /**
   * Sets the object metadata from the object
   * @param {Object} json
   */
  setJsonMetadata(json) {
    if (!this.id) {
      this.id = json.id;
    }

    if(json.version)
      this.version = json.version;

    this.acl.fromJSON(json.acl || {});
  }

  /**
   * Converts the object to an JSON-Object
   * @param {Boolean} [excludeVersion=false]
   * @param {Boolean} [excludeMetadata=false]
   * @returns {Object} JSON-Object
   */
  getJson(excludeVersion, excludeMetadata) {
    this._enabled = false;
    var json = this.type.toJsonValue(this, this._root, true);
    this._enabled = true;

    if (this.isAttached && !excludeMetadata) {
      Object.assign(json, this.getJsonMetadata(excludeVersion));
    }

    return json;
  }

  setJson(json) {
    if (json.id || json.version || json.acl) {
      this.setJsonMetadata(json);
    }

    this._enabled = false;
    this.type.fromJsonValue(this, json, this._root, true);
    this._enabled = true;
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