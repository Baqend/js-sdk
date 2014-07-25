var PersistentError = require('../error').PersistentError;
var State;

/**
 * @class jspa.util.State
 */
exports.State = State = Object.inherit(/** @lends jspa.util.State.prototype */ {
  /**
   * @lends jspa.util.State
   */
  extend: {
    /**
     * @enum {number}
     */
    Type: {
      TEMPORARY: 0,
      PERSISTENT: 1,
      DIRTY: 2,
      DELETED: 3
    },

    /**
     * @param {*} entity
     */
    get: function (entity) {
      return entity._objectInfo && entity._objectInfo.state;
    },

    readAccess: function (obj) {
      if (obj.__jspaEntity__)
        obj = obj.__jspaEntity__;

      var info = obj._objectInfo;
      if (!info)
        return;

      if (info.state) {
        info.state.makeAvailable();
      }

      if (info.notAvailable) {
        throw new PersistentError('Object state can not be initialized.');
      }
    },

    writeAccess: function (obj) {
      if (obj.__jspaEntity__)
        obj = obj.__jspaEntity__;

      var info = obj._objectInfo;
      if (!info)
        return;

      if (info.state) {
        info.state.makeDirty();
      }

      if (info.notAvailable) {
        throw new PersistentError('Object state can not be initialized.');
      }
    }
  },

  /**
   * @returns {Boolean}
   */
  isTemporary: {
    get: function () {
      return this.state == State.Type.TEMPORARY;
    }
  },

  /**
   * @returns {Boolean}
   */
  isPersistent: {
    get: function () {
      return this.state == State.Type.PERSISTENT;
    }
  },

  /**
   * @returns {Boolean}
   */
  isDeleted: {
    get: function () {
      return this.state == State.Type.DELETED;
    }
  },

  /**
   * @param entityManager
   * @param {jspa.metamodel.EntityType} type
   * @param {*} entity
   */
  initialize: function (entityManager, type, entity) {
    this.entityManager = entityManager;
    this.type = type;
    this.entity = entity;

    Object.defineProperty(this.entity, '_objectInfo', {
      value: {
        'class': this.type.identifier,
        'notAvailable': true,
        'state': this
      }
    });

    this.isDirty = false;
    this.state = State.Type.PERSISTENT;

    this.enabled = true;
  },

  setTemporary: function () {
    if (this.entity._objectInfo.notAvailable) {
      this.entity._objectInfo.notAvailable = false;
      this.state = State.Type.TEMPORARY;
      this.isDirty = true;
    }
  },

  setPersistent: function () {
    if (this.isDeleted)
      this.isDirty = true;

    this.state = State.Type.PERSISTENT;
  },

  setDeleted: function () {
    this.state = State.Type.DELETED;
    this.isDirty = true;
  },

  enable: function () {
    this.enabled = true;
  },

  disable: function () {
    this.enabled = false;
  },

  makeDirty: function () {
    if (this.enabled) {
      if (this.entity._objectInfo.notAvailable) {
        this.makeAvailable();
      }

      if (!this.isDeleted) {
        this.isDirty = true;
      }
    }
  },

  makeAvailable: function () {
    if (this.enabled && this.entity._objectInfo.notAvailable) {
      try {
        this.entityManager.findBlocked(this);
      } catch (e) {
      }
    }
  },

  remove: function () {
    this.entity._objectInfo.state = null;
  },

  getIdentifier: function () {
    return this.type.id.getDatabaseValue(this, this.entity);
  },

  getVersion: function () {
    return this.type.version.getDatabaseValue(this, this.entity);
  },

  getReference: function () {
    var value = this.getIdentifier();

    if (this.isTemporary) {
      var transaction = this.entityManager.transaction;
      if (transaction.isActive) {
        value = '/transaction/' + transaction.tid + value;
      } else {
        value = null;
      }
    }

    return value;
  },

  getTransactionIdentifier: function () {
    var transaction = this.entityManager.transaction;

    if (transaction.isActive) {
      return '/transaction/' + transaction.tid;
    }

    return null;
  },

  getDatabaseObjectInfo: function () {
    var info = {
      'class': this.type.identifier
    };

    var oid = this.getReference();
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

  setDatabaseObjectInfo: function (json) {
    if (this.isTemporary)
      this.type.id.setDatabaseValue(this, this.entity, json['oid']);

    this.type.version.setDatabaseValue(this, this.entity, json['version']);
  },

  getDatabaseObject: function () {
    this.disable();

    this.isDirty = false;
    var json = this.type.toDatabaseValue(this, this.entity);

    this.enable();
    return json;
  },

  setDatabaseObject: function (json) {
    this.setDatabaseObjectInfo(json['_objectInfo']);

    this.entity._objectInfo.notAvailable = false;

    //refresh values only if the object was not changed
    if (!this.isDirty) {
      this.disable();

      this.type.fromDatabaseValue(this, this.entity, json);

      this.enable();
    }
  }
});