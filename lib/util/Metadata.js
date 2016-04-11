"use strict";

var error = require('../error');
var Acl = require('./Acl');
var Lockable = require('./Lockable');
var binding = require('../binding');

/**
 * @class baqend.util.Metadata
 */
class Metadata extends Lockable {

  static create(type, object) {
    var metadata;
    if (type.isEntity) {
      metadata = new Metadata(object, type);
    } else if (type.isEmbeddable) {
      metadata = {
        type: type,
        readAccess() {
          var metadata = this._root && this._root._metadata;
          if (metadata)
            metadata.readAccess();
        },
        writeAccess() {
          var metadata = this._root && this._root._metadata;
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
   * @param {baqend.binding.Entity} entity
   * @return {baqend.util.Metadata}
   */
  static get(entity) {
    //if (!(entity instanceof binding.Entity))
    //  throw new error.IllegalEntityError(entity);

    return entity._metadata;
  }

  /**
   * @type baqend.EntityManager
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
   * @type String
   */
  get bucket() {
    return this.type.name;
  }

  /**
   * @type String
   */
  get key() {
    if (!this._key && this.id) {
      var index = this.id.lastIndexOf('/');
      this._key = decodeURIComponent(this.id.substring(index + 1));
    }
    return this._key;
  }

  /**
   * @param {String} value
   */
  set key(value) {
    value += '';

    if (this.id)
      throw new Error('The id can\'t be set twice.');

    this.id = '/db/' + this.bucket + '/' + encodeURIComponent(value);
    this._key = value;
  }

  /**
   * @type Boolean
   */
  get isAttached() {
    return !!this._db;
  }

  /**
   * @type Boolean
   */
  get isAvailable() {
    return this._state > Metadata.Type.UNAVAILABLE;
  }

  /**
   * @type Boolean
   */
  get isPersistent() {
    return this._state == Metadata.Type.PERSISTENT;
  }

  /**
   * @type Boolean
   */
  get isDirty() {
    return this._state == Metadata.Type.DIRTY;
  }

  /**
   * @param {baqend.binding.Entity} entity
   * @param {baqend.binding.ManagedType} type
   */
  constructor(entity, type) {
    super();

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
        throw new error.PersistentError('This object ' + this.id + ' is not available.');
      }
    }
  }

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
    this.setDirty();
    this.version = null;
  }

  getJsonMetadata() {
    var info = {};

    if (this.id) {
      info.id = this.id;
    }

    if (this.version) {
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
   * @param {Boolean} [excludeMetadata=false]
   * @returns {Object} JSON-Object
   */
  getJson(excludeMetadata) {
    this._enabled = false;
    var json = this.type.toJsonValue(this, this._root, true);
    this._enabled = true;

    if (this.isAttached && !excludeMetadata) {
      Object.assign(json, this.getJsonMetadata());
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