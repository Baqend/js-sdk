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
      NEW: 0,
      PERSISTENT: 1,
      DIRTY: 2,
      DELETED: 3
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
          throw new PersistentError('This object ' + metadata.getReference() + ' is not available.');
        }
      }
    },

    writeAccess: function(object) {
      var metadata = Metadata.getRoot(object);

      if (metadata && metadata._enabled) {
        if (!metadata.isAvailable) {
          throw new PersistentError('This object ' + metadata.getReference() + ' is not available.');
        }

        if (!metadata.isDeleted) {
          metadata.isDirty = true;
        }
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
  isNew: {
    get: function() {
      return this._state == Metadata.Type.NEW;
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
  isDeleted: {
    get: function() {
      return this._state == Metadata.Type.DELETED;
    }
  },

  /**
   * @type {Boolean}
   */
  isDirty: true,

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
    this._state = Metadata.Type.NEW;
    this._enabled = true;
  },

  setUnavailable: function() {
    if (this.isNew) {
      this._state = Metadata.Type.UNAVAILABLE;
      this.isDirty = false;
    }
  },

  setPersistent: function() {
    if (this.isDeleted)
      this.isDirty = true;

    this._state = Metadata.Type.PERSISTENT;
  },

  setDeleted: function() {
    this._state = Metadata.Type.DELETED;
    this.isDirty = true;
  },

  getDatabaseObjectInfo: function() {
    var info = {
      bucket: this.type.name
    };

    if (this.id) {
      info['id'] = this.id;
    }

    if (this.version) {
      info['version'] = this.version;
    }

    if (this.db.transaction.isActive) {
      info['transaction'] = '/transaction/' + this.db.transaction.tid;
    }

    return info;
  },

  setDatabaseObjectInfo: function(json) {
    this.version = json['version'];
  },

  getDatabaseObject: function() {
    this._enabled = false;
    var json = this.type.toDatabaseValue(this, this._root);
    this._enabled = true;

    this.isDirty = false;

    if (this.isAttached) {
      json['_objectInfo'] = this.getDatabaseObjectInfo();
    }

    return json;
  },

  setDatabaseObject: function(json) {
    this.setDatabaseObjectInfo(json['_objectInfo']);

    this._enabled = false;
    this.type.fromDatabaseValue(this, json, this._root);
    this._enabled = true;

    this.isDirty = false;
  }
});