var PersistentError = require('../error').PersistentError;
var Acl = require('./Acl').Acl;
var Metadata;

/**
 * @class jspa.util.Metadata
 */
exports.Metadata = Metadata = Object.inherit(/** @lends jspa.util.Metadata.prototype */ {
  /** @lends jspa.util.Metadata */
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
     * @param {jspa.binding.Entity} entity
     * @return {jspa.util.Metadata}
     */
    get: function(entity) {
      return entity && entity._metadata || null;
    },

    /**
     * @param {jspa.binding.Entity|jspa.Collection} object
     * @return {jspa.util.Metadata}
     */
    getRoot: function(object) {
      var metadata = object && object._metadata;

      if (metadata && metadata._root != object)
        metadata = metadata._root && metadata._root._metadata;

      return metadata;
    },

    /**
     * @param {jspa.binding.Entity|jspa.Collection} object
     */
    readAccess: function(object) {
      var metadata = Metadata.getRoot(object);
      if (metadata)
        metadata.readAccess();
    },

    /**
     * @param {jspa.binding.Entity|jspa.Collection} object
     */
    writeAccess: function(object) {
      var metadata = Metadata.getRoot(object);
      if (metadata)
        metadata.writeAccess();
    }
  },

  /**
   * @return {jspa.EntityManager}
   */
  get db() {
    var context = typeof window != "undefined" ? window : global;

    if (!context.DB || context.DB.connect) {
      throw new PersistentError("No database context is set.");
    }

    return this.db = context.DB;
  },

  set db(db) {
    Object.defineProperty(this, 'db', {
      value: db
    });
  },

  /**
   * @return {jspa.metamodel.EntityType}
   */
  get type() {
    if (!this.isAttached)
      return null;

    var type = this.db.metamodel.entity(this._root.constructor);
    if (type) {
      Object.defineProperty(this, 'type', {
        value: type
      });
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
      return '/db/' + this.bucket + '/' + this.id;
    } else {
      return null;
    }
  },

  /**
   * @return {Boolean}
   */
  get isAttached() {
    return this.hasOwnProperty('db');
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
   * @return {jspa.Acl}
   */
  get acl() {
    Object.defineProperty(this, 'acl', {
      value: new Acl(this)
    });

    return this.acl;
  },

  /**
   * @type jspa.binding.Entity
   * @private
   */
  _root: null,

  /**
   * @type String
   */
  id: null,

  /**
   * @type String
   */
  version: null,

  /**
   * @param {jspa.binding.Entity} entity
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
   * @param {Boolean} excludeVersion
   * @returns {Object} JSON-Object
   */
  getDatabaseObject: function(excludeVersion) {
    this._enabled = false;
    var json = this.toJSON();
    this._enabled = true;

    if (this.isAttached) {
      json._objectInfo = this.getDatabaseObjectInfo(excludeVersion);
    }

    return json;
  },

  setDatabaseObject: function(json) {
    this.setDatabaseObjectInfo(json._objectInfo);

    this._enabled = false;
    this.fromJSON(json);
    this._enabled = true;
  },

  toJSON: function() {
    return this.type.toDatabaseValue(this, this._root);
  },

  fromJSON: function(json) {
    this.type.fromDatabaseValue(this, json, this._root);
  }
});