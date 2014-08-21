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
      var metadata = entity._metadata;
      var root = metadata && metadata._root;
      return root && root._metadata;
    },

    readAccess: function(entity) {
      var metadata = Metadata.get(entity);

      if (metadata && metadata._enabled) {
        if (!metadata.isAvailable) {
          throw new PersistentError('This object ' + metadata.getIdentifier() + ' is not available.');
        }
      }
    },

    writeAccess: function(entity) {
      var metadata = Metadata.get(entity);

      if (metadata && metadata._enabled) {
        if (!metadata.isAvailable) {
          throw new PersistentError('This object ' + metadata.getIdentifier() + ' is not available.');
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
        throw new ReferenceError('No db is attached to this entity.');

      var type = this.db.metamodel.entity(this._root.constructor);

      if (!type)
        throw new PersistentError('The entity is not valid, type not found.');

      Object.defineProperty(this, 'type', {
        value: type
      });

      return type;
    },
    configurable: true
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
  isDirty: false,

  /**
   * @type {jspa.binding.Enhanced}
   * @private
   */
  _root: null,

  /**
   * @param {jspa.binding.Enhanced} entity
   */
  initialize: function(entity) {
    this._root = entity;
    this._state = Metadata.Type.NEW;
    this._enabled = true;
  },

  setNew: function() {
    if (!this.isAvailable) {
      this._state = Metadata.Type.NEW;
      this.isDirty = true;
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

  getIdentifier: function() {
    return this._id;
  },

  getVersion: function() {
    return this._version;
  },

  getTransactionIdentifier: function() {
    var transaction = this.db.transaction;

    if (transaction.isActive) {
      return '/transaction/' + transaction.tid;
    }

    return null;
  },

  getDatabaseObjectInfo: function() {
    var info = {
      'class': this.type.identifier
    };

    var oid = this.getIdentifier();
    if (oid) {
      info['oid'] = oid;
    }

    var version = this.getVersion();
    if (version) {
      info['version'] = version;
    }

    var transaction = this.getTransactionIdentifier();
    if (transaction) {
      info['transaction'] = transaction;
    }

    return info;
  },

  setDatabaseObjectInfo: function(json) {
    if (this.isNew)
      this.type.id.setDatabaseValue(this, this._root, json['oid']);

    this.type.version.setDatabaseValue(this, this._root, json['version']);
  },

  getDatabaseObject: function() {
    this._enabled = false;
    var json = this.type.toDatabaseValue(this, this._root);
    this._enabled = true;

    this.isDirty = false;

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