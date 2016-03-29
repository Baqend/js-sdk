//var binding = require('../binding');
var PersistentError = require('../error/PersistentError');
var Acl = require('./Acl');
var Lockable = require('./Lockable');

/**
 * @class baqend.util.Metadata
 */
var Metadata = Object.inherit(Lockable, /** @lends baqend.util.Metadata.prototype */ {
  /** @lends baqend.util.Metadata */
  extend: {
    /**
     * @enum {number}
     */
    Type: {
      UNAVAILABLE: -1,
      PERSISTENT: 0,
      DIRTY: 1
    },

    /**
     * @param {baqend.binding.Entity} entity
     * @return {baqend.util.Metadata}
     */
    get: function(entity) {
      //if (!(entity instanceof binding.Entity))
      //  throw new error.IllegalEntityError(entity);

      return entity._metadata;
    },

    /**
     * @param {baqend.binding.Entity|baqend.Collection} object
     * @return {baqend.util.Metadata}
     */
    getRoot: function(object) {
      var metadata = object && object._metadata;

      if (metadata && metadata._root != object)
        metadata = metadata._root && metadata._root._metadata;

      return metadata;
    },

    /**
     * @param {baqend.binding.Entity|baqend.Collection} object
     */
    readAccess: function(object) {
      var metadata = Metadata.getRoot(object);
      if (metadata)
        metadata.readAccess();
    },

    /**
     * @param {baqend.binding.Entity|baqend.Collection} object
     */
    writeAccess: function(object) {
      var metadata = Metadata.getRoot(object);
      if (metadata)
        metadata.writeAccess();
    }
  },

  /**
   * @return {baqend.EntityManager}
   */
  get db() {
    if(this._db)
      return this._db;

    return this._db = require('../');
  },

  set db(db) {
    if(!this._db) {
      this._db = db;
    } else {
      throw new Error("DB has already been set.")
    }
  },

  /**
   * @return {String}
   */
  get bucket() {
    return this.type.name;
  },

  /**
   * @return {String}
   */
  get key() {
    if (!this._key && this.id) {
      var index = this.id.lastIndexOf('/');
      this._key = decodeURIComponent(this.id.substring(index + 1));
    }
    return this._key;
  },

  set key(key) {
    if (this.id)
      throw new Error('The id can\'t be set twice.');

    this.id = '/db/' + this.bucket + '/' + encodeURIComponent(key);
    this._key = key;
  },

  /**
   * @return {Boolean}
   */
  get isAttached() {
    return !!this._db;
  },

  /**
   * @return {Boolean}
   */
  get isAvailable() {
    return this._state > Metadata.Type.UNAVAILABLE;
  },

  /**
   * @return {Boolean}
   */
  get isPersistent() {
    return this._state == Metadata.Type.PERSISTENT;
  },

  /**
   * @return {Boolean}
   */
  get isDirty() {
    return this._state == Metadata.Type.DIRTY;
  },

  /**
   * @type baqend.binding.Entity
   * @private
   */
  _root: null,

  _db: null,

  /**
   * @type String
   */
  id: null,

  /**
   * @type Number
   */
  version: null,

  /**
   * @type baqend.util.Acl
   */
  acl: null,

  /**
   * @return {baqend.metamodel.ManagedType}
   */
  type: null,

  /**
   * @param {baqend.binding.Entity} entity
   * @param {baqend.binding.ManagedType} type
   */
  constructor: function Metadata(entity, type) {
    this._root = entity;
    this.type = type;
    this._state = Metadata.Type.DIRTY;
    this._enabled = true;
    this.acl = new Acl(this);
  },

  readAccess: function() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.id + ' is not available.');
      }
    }
  },

  writeAccess: function() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.id + ' is not available.');
      }

      this.setDirty();
    }
  },

  /**
   * Indicates that the associated object isn't available
   */
  setUnavailable: function() {
    this._state = Metadata.Type.UNAVAILABLE;
  },

  /**
   * Indicates that the associated object isn't stale, i.e.
   * the object correlate the database state and is not modified by the user
   */
  setPersistent: function() {
    this._state = Metadata.Type.PERSISTENT;
  },

  /**
   * Indicates the the object is modified by the user
   */
  setDirty: function() {
    this._state = Metadata.Type.DIRTY;
  },

  /**
   * Indicates the the object is removed
   */
  setRemoved: function() {
    this.setDirty();
    this.version = null;
  },

  getJsonMetadata: function(excludeVersion) {
    var info = {};

    if (this.id) {
      info.id = this.id;
    }

    if (!excludeVersion && this.version) {
      info.version = this.version;
    }

    info.acl = this.acl;

    return info;
  },

  /**
   * Sets the object metadata from the object
   * @param {Object} json
   */
  setJsonMetadata: function(json) {
    if (!this.id) {
      this.id = json.id;
    }

    if(json.version)
      this.version = json.version;

    this.acl.fromJSON(json.acl || {});
  },

  /**
   * Converts the object to an JSON-Object
   * @param {Boolean} [excludeVersion=false]
   * @param {Boolean} [excludeMetadata=false]
   * @returns {Object} JSON-Object
   */
  getJson: function(excludeVersion, excludeMetadata) {
    this._enabled = false;
    var json = this.type.toJsonValue(this, this._root, true);
    this._enabled = true;

    if (this.isAttached && !excludeMetadata) {
      Object.extend(json, this.getJsonMetadata(excludeVersion));
    }

    return json;
  },

  setJson: function(json) {
    if (json.id || json.version || json.acl) {
      this.setJsonMetadata(json);
    }

    this._enabled = false;
    this.type.fromJsonValue(this, json, this._root, true);
    this._enabled = true;
  }
});

module.exports = Metadata;