var PersistentError = require('../error').PersistentError;
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

    get: function(entity) {
      return entity && entity._metadata || null;
    },

    getRoot: function(object) {
      var metadata = object && object._metadata;

      if (metadata && metadata._root != object)
        metadata = metadata._root && metadata._root._metadata;

      return metadata;
    },

    readAccess: function(object) {
      var metadata = Metadata.getRoot(object);

      if (metadata && metadata._enabled) {
        if (!metadata.isAvailable) {
          throw new PersistentError('This object ' + this.db.getReference(this) + ' is not available.');
        }
      }
    },

    writeAccess: function(object) {
      var metadata = Metadata.getRoot(object);

      if (metadata && metadata._enabled) {
        if (!metadata.isAvailable) {
          throw new PersistentError('This object ' + this.db.getReference(this) + ' is not available.');
        }

        metadata._state = Metadata.Type.DIRTY;
      }
    }
  },

  db: {
    get: function() {
      var context = typeof window != "undefined" ? window : global;

      if (!context.db) {
        throw new PersistentError("No database context is set.");
      }

      return this.db = context.db;
    },
    set: function(db) {
      Object.defineProperty(this, 'db', {
        value: db
      });
    },
    configurable: true
  },

  /**
   * @type jspa.metamodel.EntityType
   */
  type: {
    get: function() {
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
    configurable: true
  },

  /**
   * @type String
   */
  bucket: {
    get: function() {
      return this.type && this.type.name
    }
  },

  ref: {
    get: function() {
      if (this.isAttached && this.id) {
        return '/db/' + this.bucket + '/' + this.id;
      } else {
        return null;
      }
    }
  },

  /**
   * @type {Boolean}
   */
  isAttached: {
    get: function() {
      return this.hasOwnProperty('db');
    }
  },

  /**
   * @type {Boolean}
   */
  isAvailable: {
    get: function() {
      return this._state > Metadata.Type.UNAVAILABLE;
    }
  },

  /**
   * @type {Boolean}
   */
  isPersistent: {
    get: function() {
      return this._state == Metadata.Type.PERSISTENT;
    }
  },

  /**
   * @type {Boolean}
   */
  isDirty: {
    get: function() {
      return this._state == Metadata.Type.DIRTY;
    }
  },

  /**
   * @type {jspa.binding.Enhanced}
   * @private
   */
  _root: null,

  /**
   * @type {String}
   */
  id: null,

  /**
   * @type {String}
   */
  version: null,

  /**
   * @param {jspa.binding.Enhanced} entity
   */
  initialize: function(entity) {
    this._root = entity;
    this._state = Metadata.Type.DIRTY;
    this._enabled = true;
  },

  setUnavailable: function() {
    this._state = Metadata.Type.UNAVAILABLE;
  },

  setPersistent: function() {
    this._state = Metadata.Type.PERSISTENT;
  },

  setRemoved: function() {
    this._state = Metadata.Type.DIRTY;
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

    return info;
  },

  /**
   * Sets the object metadata from the object
   * @param {Object} json
   */
  setDatabaseObjectInfo: function(json) {
    if (!this.id)
      this.id = json.id;

    this.version = json.version;
  },

  getDatabaseObject: function(excludeVersion) {
    this._enabled = false;
    var json = this.type.toDatabaseValue(this, this._root);
    this._enabled = true;

    if (this.isAttached) {
      json._objectInfo = this.getDatabaseObjectInfo(excludeVersion);
    }

    return json;
  },

  setDatabaseObject: function(json) {
    this.setDatabaseObjectInfo(json._objectInfo);

    this._enabled = false;
    this.type.fromDatabaseValue(this, json, this._root);
    this._enabled = true;
  }
});