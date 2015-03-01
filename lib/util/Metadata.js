var PersistentError = require('../error/PersistentError');
var Acl = require('./Acl');
var Lockable = require('./Lockable');

/**
 * @class baqend.util.Metadata
 */
var Metadata = module.exports = Object.inherit(Lockable, /** @lends baqend.util.Metadata.prototype */ {
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
      return entity && entity._metadata || null;
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
   * @return {baqend.metamodel.EntityType}
   */
  get type() {
    if(this._type)
      return this._type;

    if (!this.isAttached)
      return null;

    var type = this.db.metamodel.entity(this._root.constructor);
    if (type) {
      this._type = type;
    }

    return type;
  },

  /**
   * @return {String}
   */
  get bucket() {
    return this.type && this.type.name
  },

  /**
   * @return {String}
   */
  get ref() {
    if (this.isAttached && this.id) {
      return '/db/' + this.bucket + '/' + encodeURIComponent(this.id);
    } else {
      return null;
    }
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
   * @return {baqend.Acl}
   */
  get acl() {
    var acl = new Acl(this);

    Object.defineProperty(this, 'acl', {
      value: acl
    });

    return acl;
  },

  /**
   * @type baqend.binding.Entity
   * @private
   */
  _root: null,

  _db: null,
  _type: null,

  /**
   * @type String
   */
  id: null,

  /**
   * @type String
   */
  version: null,

  /**
   * @param {baqend.binding.Entity} entity
   */
  initialize: function(entity) {
    this._root = entity;
    this._state = Metadata.Type.DIRTY;
    this._enabled = true;
  },

  readAccess: function() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.bucket + '/' + this.id + ' is not available.');
      }
    }
  },

  writeAccess: function() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new PersistentError('This object ' + this.bucket + '/' + this.id + ' is not available.');
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

  getDatabaseObjectInfo: function(excludeVersion) {
    var info = {
      bucket: this.type.name
    };

    if (this.id) {
      info.id = this.id;
    }

    if (!excludeVersion && this.version) {
      info.version = this.version;
    }

    if (this.db.transaction.isActive) {
      info.transaction = '/transaction/' + this.db.transaction.tid;
    }

    info.acl = this.acl;

    return info;
  },

  /**
   * Sets the object metadata from the object
   * @param {Object} json
   */
  setDatabaseObjectInfo: function(json) {
    if (!this.id)
      this.id = json.id;

    if(json.version)
      this.version = json.version;

    this.acl.fromJSON(json.acl || {});
  },

  /**
   * Converts the object to an JSON-Object
   * @param {Boolean} [excludeVersion]
   * @param {Boolean} [excludeObjectInfo]
   * @returns {Object} JSON-Object
   */
  getDatabaseObject: function(excludeVersion, excludeObjectInfo) {
    this._enabled = false;
    var json = this.type.toDatabaseValue(this, this._root);
    this._enabled = true;

    if (this.isAttached && !excludeObjectInfo) {
      json._objectInfo = this.getDatabaseObjectInfo(excludeVersion);
    }

    return json;
  },

  setDatabaseObject: function(json) {
    if(json._objectInfo) {
      this.setDatabaseObjectInfo(json._objectInfo);
    }

    this._enabled = false;
    this.type.fromDatabaseValue(this, json, this._root);
    this._enabled = true;
  }
});