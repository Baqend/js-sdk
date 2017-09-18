/*!
* Baqend JavaScript SDK 2.8.6
* http://baqend.com
*
* Copyright (c) 2015 Baqend GmbH
*
* Includes:
* babel-helpers - https://babeljs.io/docs/plugins/external-helpers/
* Copyright (c) 2014-2016 Sebastian McKenzie <sebmck@gmail.com>
*
* core.js - https://github.com/zloirock/core-js
* Copyright (c) 2014-2016 Denis Pushkarev
*
* uuid - http://github.com/broofa/node-uuid
* Copyright (c) 2010-2016 Robert Kieffer and other contributors
*
* validator - http://github.com/chriso/validator.js
* Copyright (c) 2015 Chris O'Hara <cohara87@gmail.com>
*
* Released under the MIT license
*
* Date: Mon, 18 Sep 2017 14:31:32 GMT
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DB = f()}})(function(){var define,module,exports;var babelHelpers = {};
babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers.defaults = function (obj, defaults) {
  var keys = Object.getOwnPropertyNames(defaults);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = Object.getOwnPropertyDescriptor(defaults, key);

    if (value && value.configurable && obj[key] === undefined) {
      Object.defineProperty(obj, key, value);
    }
  }

  return obj;
};

babelHelpers.inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : babelHelpers.defaults(subClass, superClass);
};

babelHelpers.possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

var Permission = _dereq_(68);

/**
 * Creates a new Acl object, with an empty rule set for an object
 *
 * @alias Acl
 */

var Acl = function () {

  /**
   * @param {util.Metadata=} metadata the metadata of the object, null for files
   */
  function Acl(metadata) {
    babelHelpers.classCallCheck(this, Acl);

    /**
     * The read permission of the object
     * @type util.Permission
     */
    this.read = new Permission(metadata);
    /**
     * The write permission of the object
     * @type util.Permission
     */
    this.write = new Permission(metadata);
  }

  /**
   * Removes all acl rules, read and write access is public afterwards
   */

  Acl.prototype.clear = function clear() {
    this.read.clear();
    this.write.clear();
  };

  /**
   * Copies permissions from another ACL
   * @param {Acl} acl The ACL to copy from
   * @return {Acl}
   */

  Acl.prototype.copy = function copy(acl) {
    this.read.copy(acl.read);
    this.write.copy(acl.write);
    return this;
  };

  /**
   * Gets whenever all users and roles have the permission to read the object
   * @return {boolean} <code>true</code> If public access is allowed
   */

  Acl.prototype.isPublicReadAllowed = function isPublicReadAllowed() {
    return this.read.isPublicAllowed();
  };

  /**
   * Sets whenever all users and roles should have the permission to read the object.
   * Note: All other allow read rules will be removed.
   */

  Acl.prototype.setPublicReadAllowed = function setPublicReadAllowed() {
    return this.read.setPublicAllowed();
  };

  /**
   * Checks whenever the user or role is explicit allowed to read the object.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if read access is explicitly allowed for the given user or role
   */

  Acl.prototype.isReadAllowed = function isReadAllowed(userOrRole) {
    return this.read.isAllowed(userOrRole);
  };

  /**
   * Checks whenever the user or role is explicit denied to read the object
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if read access is explicitly denied for the given user or role
   */

  Acl.prototype.isReadDenied = function isReadDenied(userOrRole) {
    return this.read.isDenied(userOrRole);
  };

  /**
   * Allows the given user or rule to read the object
   * @param {...(model.User|model.Role|string)} userOrRole The user or role to allow
   * @return {Acl} this acl object
   */

  Acl.prototype.allowReadAccess = function allowReadAccess(userOrRole) {
    Permission.prototype.allowAccess.apply(this.read, arguments);
    return this;
  };

  /**
   * Denies the given user or rule to read the object
   * @param {...(model.User|model.Role|string)} userOrRole The user or role to deny
   * @return {Acl} this acl object
   */

  Acl.prototype.denyReadAccess = function denyReadAccess(userOrRole) {
    Permission.prototype.denyAccess.apply(this.read, arguments);
    return this;
  };

  /**
   * Deletes any read allow/deny rule for the given user or role
   * @param {...(model.User|model.Role|string)} userOrRole The user or role
   * @return {Acl} this acl object
   */

  Acl.prototype.deleteReadAccess = function deleteReadAccess(userOrRole) {
    Permission.prototype.deleteAccess.apply(this.read, arguments);
    return this;
  };

  /**
   * Gets whenever all users and roles have the permission to write the object
   * @return {boolean} <code>true</code> If public access is allowed
   */

  Acl.prototype.isPublicWriteAllowed = function isPublicWriteAllowed() {
    return this.write.isPublicAllowed();
  };

  /**
   * Sets whenever all users and roles should have the permission to write the object.
   * Note: All other allow write rules will be removed.
   */

  Acl.prototype.setPublicWriteAllowed = function setPublicWriteAllowed() {
    return this.write.setPublicAllowed();
  };

  /**
   * Checks whenever the user or role is explicit allowed to write the object.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if write access is explicitly allowed for the given user or role
   */

  Acl.prototype.isWriteAllowed = function isWriteAllowed(userOrRole) {
    return this.write.isAllowed(userOrRole);
  };

  /**
   * Checks whenever the user or role is explicit denied to write the object
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {boolean} <code>true</code> if write access is explicitly denied for the given user or role
   */

  Acl.prototype.isWriteDenied = function isWriteDenied(userOrRole) {
    return this.write.isDenied(userOrRole);
  };

  /**
   * Allows the given user or rule to write the object
   * @param {...(model.User|model.Role|string)} userOrRole The user or role to allow
   * @return {Acl} this acl object
   */

  Acl.prototype.allowWriteAccess = function allowWriteAccess(userOrRole) {
    Permission.prototype.allowAccess.apply(this.write, arguments);
    return this;
  };

  /**
   * Denies the given user or rule to write the object
   * @param {...(model.User|model.Role|string)} userOrRole The user or role to deny
   * @return {Acl} this acl object
   */

  Acl.prototype.denyWriteAccess = function denyWriteAccess(userOrRole) {
    Permission.prototype.denyAccess.apply(this.write, arguments);
    return this;
  };

  /**
   * Deletes any write allow/deny rule for the given user or role
   * @param {...(model.User|model.Role|string)} userOrRole The user or role
   * @return {Acl} this acl object
   */

  Acl.prototype.deleteWriteAccess = function deleteWriteAccess(userOrRole) {
    Permission.prototype.deleteAccess.apply(this.write, arguments);
    return this;
  };

  /**
   * A Json representation of the set of rules
   * @return {json}
   */

  Acl.prototype.toJSON = function toJSON() {
    return {
      read: this.read.toJSON(),
      write: this.write.toJSON()
    };
  };

  /**
   * Sets the acl rules form json
   * @param {json} json The json encoded acls
   */

  Acl.prototype.fromJSON = function fromJSON(json) {
    this.read.fromJSON(json.read || {});
    this.write.fromJSON(json.write || {});
  };

  return Acl;
}();

module.exports = Acl;

},{"68":68}],2:[function(_dereq_,module,exports){
"use strict";

var message = _dereq_(35);
var error = _dereq_(33);
var binding = _dereq_(20);
var util = _dereq_(75);
var query = _dereq_(62);

var UserFactory = _dereq_(19);
var EntityTransaction = _dereq_(4);
var Metadata = _dereq_(66);
var Message = _dereq_(25);
var BloomFilter = _dereq_(21);
var StatusCode = Message.StatusCode;

/**
 * @alias EntityManager
 * @extends util.Lockable
 */

var EntityManager = function (_util$Lockable) {
  babelHelpers.inherits(EntityManager, _util$Lockable);
  babelHelpers.createClass(EntityManager, [{
    key: 'isOpen',

    /**
     * Determine whether the entity manager is open.
     * true until the entity manager has been closed
     * @type boolean
     */
    get: function get() {
      return !!this._connector;
    }

    /**
     * The authentication token if the user is logged in currently
     * @type string
     */

  }, {
    key: 'token',
    get: function get() {
      return this.tokenStorage.token;
    },

    /**
     * The authentication token if the user is logged in currently
     * @param {string} value
     */
    set: function set(value) {
      this.tokenStorage.update(value);
    }

    /**
     * @param {EntityManagerFactory} entityManagerFactory The factory which of this entityManager instance
     */

  }, {
    key: 'isCachingDisabled',
    get: function get() {
      return !this.bloomFilter;
    }
  }]);

  function EntityManager(entityManagerFactory) {
    babelHelpers.classCallCheck(this, EntityManager);

    /**
     * Log messages can created by calling log directly as function, with a specific log level or with the helper
     * methods, which a members of the log method.
     *
     * Logs will be filtered by the client logger and the before they persisted. The default log level is
     * 'info' therefore all log messages below the given message aren't persisted.
     *
     * Examples:
     * <pre class="prettyprint">
     // default log level ist info
     db.log('test message %s', 'my string');
     // info: test message my string
      // pass a explicit log level as the first argument, one of ('trace', 'debug', 'info', 'warn', 'error')
     db.log('warn', 'test message %d', 123);
     // warn: test message 123
      // debug log level will not be persisted by default, since the default logging level is info
     db.log('debug', 'test message %j', {number: 123}, {});
     // debug: test message {"number":123}
     // data = {}
      // One additional json object can be provided, which will be persisted together with the log entry
     db.log('info', 'test message %s, %s', 'first', 'second', {number: 123});
     // info: test message first, second
     // data = {number: 123}
      //use the log level helper
     db.log.info('test message', 'first', 'second', {number: 123});
     // info: test message first second
     // data = {number: 123}
      //change the default log level to trace, i.e. all log levels will be persisted, note that the log level can be
     //additionally configured in the baqend
     db.log.level = 'trace';
      //trace will be persisted now
     db.log.trace('test message', 'first', 'second', {number: 123});
     // info: test message first second
     // data = {number: 123}
     * </pre>
     *
     * @type util.Logger
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _util$Lockable.call(this));

    _this.log = util.Logger.create(_this);

    /**
     * The connector used for requests
     * @type connector.Connector
     * @private
     */
    _this._connector = null;

    /**
     * All managed and cached entity instances
     * @type Map<String,binding.Entity>
     * @private
     */
    _this._entities = null;

    /** @type EntityManagerFactory */
    _this.entityManagerFactory = entityManagerFactory;

    /** @type metamodel.Metamodel */
    _this.metamodel = entityManagerFactory.metamodel;

    /** @type util.Code */
    _this.code = entityManagerFactory.code;

    /** @type util.Modules */
    _this.modules = null;

    /**
     * The current logged in user object
     * @type model.User
     */
    _this.me = null;

    /**
     * Returns true if the device token is already registered, otherwise false.
     * @type boolean
     */
    _this.isDeviceRegistered = false;

    /**
     * Returns the tokenStorage which will be used to authorize all requests.
     * @type {util.TokenStorage}
     */
    _this.tokenStorage = null;

    /**
     * @type {caching.BloomFilter}
     */
    _this.bloomFilter = null;

    /**
     * Set of object ids that were revalidated after the Bloom filter was loaded.
     */
    _this.cacheWhiteList = null;

    /**
     * Set of object ids that were updated but are not yet included in the bloom filter.
     * This set essentially implements revalidation by side effect which does not work in Chrome.
     */
    _this.cacheBlackList = null;

    /**
     * Bloom filter refresh interval in seconds.
     *
     * @type {number}
     */
    _this.bloomFilterRefresh = 60;

    /**
     * Bloom filter refresh Promise
     *
     */
    _this._bloomFilterLock = new util.Lockable();
    return _this;
  }

  /**
   * Connects this entityManager, used for synchronous and asynchronous initialization
   * @param {connector.Connector} connector
   * @param {Object} connectData
   * @param {util.TokenStorage} tokenStorage The used tokenStorage for token persistence
   */

  EntityManager.prototype.connected = function connected(connector, connectData, tokenStorage) {
    this._connector = connector;
    this.tokenStorage = tokenStorage;
    this.bloomFilterRefresh = this.entityManagerFactory.staleness;
    this._entities = {};

    this.File = binding.FileFactory.create(this);
    this._createObjectFactory(this.metamodel.embeddables);
    this._createObjectFactory(this.metamodel.entities);

    this.transaction = new EntityTransaction(this);
    this.modules = new util.Modules(this, connector);

    if (connectData) {
      this.isDeviceRegistered = !!connectData.device;
      if (connectData.user && tokenStorage.token) this._updateUser(connectData.user, true);

      if (this.bloomFilterRefresh > 0 && connectData.bloomFilter && util.atob && !util.isNode) {
        this.updateBloomFilter(connectData.bloomFilter);
      }
    }
  };

  /**
   * @param {metamodel.ManagedType[]} types
   * @return {binding.ManagedFactory}
   * @private
   */

  EntityManager.prototype._createObjectFactory = function _createObjectFactory(types) {
    var _this2 = this;

    Object.keys(types).forEach(function (ref) {
      var type = _this2.metamodel.managedType(ref);
      var name = type.name;

      if (_this2[name]) {
        type.typeConstructor = _this2[name];
        Object.defineProperty(_this2, name, {
          value: type.createObjectFactory(_this2)
        });
      } else {
        Object.defineProperty(_this2, name, {
          get: function get() {
            Object.defineProperty(this, name, {
              value: type.createObjectFactory(this)
            });

            return this[name];
          },
          set: function set(typeConstructor) {
            type.typeConstructor = typeConstructor;
          },

          configurable: true
        });
      }
    }, this);
  };

  EntityManager.prototype.send = function send(message, ignoreCredentialError) {
    var _this3 = this;

    message.tokenStorage = this.tokenStorage;
    var result = this._connector.send(message);
    if (!ignoreCredentialError) {
      result = result.catch(function (e) {
        if (e.status == StatusCode.BAD_CREDENTIALS) {
          _this3._logout();
        }
        throw e;
      });
    }
    return result;
  };

  /**
   * Get an instance, whose state may be lazily fetched. If the requested instance does not exist
   * in the database, the EntityNotFoundError is thrown when the instance state is first accessed.
   * The application should not expect that the instance state will be available upon detachment,
   * unless it was accessed by the application while the entity manager was open.
   *
   * @param {(Class<binding.Entity>|string)} entityClass
   * @param {string=} key
   */

  EntityManager.prototype.getReference = function getReference(entityClass, key) {
    var id = void 0,
        type = void 0;
    if (key) {
      type = this.metamodel.entity(entityClass);
      if (key.indexOf('/db/') == 0) {
        id = key;
      } else {
        id = type.ref + '/' + encodeURIComponent(key);
      }
    } else {
      if (typeof entityClass === 'string') {
        id = entityClass;
        type = this.metamodel.entity(id.substring(0, id.indexOf('/', 4))); //skip /db/
      } else {
        type = this.metamodel.entity(entityClass);
      }
    }

    var entity = this._entities[id];
    if (!entity) {
      entity = type.create();
      var metadata = Metadata.get(entity);
      if (id) metadata.id = id;
      metadata.setUnavailable();
      this._attach(entity);
    }

    return entity;
  };

  /**
   * Creates an instance of Query.Builder for query creation and execution. The Query results are instances of the
   * resultClass argument.
   * @alias EntityManager.prototype.createQueryBuilder<T>
   * @param {Class<T>=} resultClass - the type of the query result
   * @return {query.Builder<T>} A query builder to create one ore more queries for the specified class
   */

  EntityManager.prototype.createQueryBuilder = function createQueryBuilder(resultClass) {
    return new query.Builder(this, resultClass);
  };

  /**
   * Clear the persistence context, causing all managed entities to become detached.
   * Changes made to entities that have not been flushed to the database will not be persisted.
   */

  EntityManager.prototype.clear = function clear() {
    this._entities = {};
  };

  /**
   * Close an application-managed entity manager. After the close method has been invoked,
   * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it
   * will throw the IllegalStateError except for transaction, and isOpen (which will return false).
   * If this method is called when the entity manager is associated with an active transaction,
   * the persistence context remains managed until the transaction completes.
   */

  EntityManager.prototype.close = function close() {
    this._connector = null;

    return this.clear();
  };

  /**
   * Check if the instance is a managed entity instance belonging to the current persistence context.
   * @param {binding.Entity} entity - entity instance
   * @returns {boolean} boolean indicating if entity is in persistence context
   */

  EntityManager.prototype.contains = function contains(entity) {
    return !!entity && this._entities[entity.id] === entity;
  };

  /**
   * Check if an object with the id from the given entity is already attached.
   * @param {binding.Entity} entity - entity instance
   * @returns {boolean} boolean indicating if entity with same id is attached
   */

  EntityManager.prototype.containsById = function containsById(entity) {
    return !!(entity && this._entities[entity.id]);
  };

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached.
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it.
   * @param {binding.Entity} entity - entity instance
   */

  EntityManager.prototype.detach = function detach(entity) {
    var _this4 = this;

    var state = Metadata.get(entity);
    return state.withLock(function () {
      _this4.removeReference(entity);
      return Promise.resolve(entity);
    });
  };

  /**
   * Resolve the depth by loading the referenced objects of the given entity.
   *
   * @param {binding.Entity} entity - entity instance
   * @param {Object} [options] The load options
   * @return {Promise<binding.Entity>}
   */

  EntityManager.prototype.resolveDepth = function resolveDepth(entity, options) {
    var _this5 = this;

    if (!options || !options.depth) return Promise.resolve(entity);

    options.resolved = options.resolved || [];
    var promises = [];
    var subOptions = Object.assign({}, options, {
      depth: options.depth === true ? true : options.depth - 1
    });
    this.getSubEntities(entity, 1).forEach(function (subEntity) {
      if (subEntity != null && !~options.resolved.indexOf(subEntity)) {
        options.resolved.push(subEntity);
        promises.push(_this5.load(subEntity.id, null, subOptions));
      }
    });

    return Promise.all(promises).then(function () {
      return entity;
    });
  };

  /**
   * Search for an entity of the specified oid.
   * If the entity instance is contained in the persistence context, it is returned from there.
   * @param {(Class<binding.Entity>|string)} entityClass - entity class
   * @param {String} oid - Object ID
   * @param {Object} [options] The load options.
   * @return {Promise<binding.Entity>} the loaded entity or null
   */

  EntityManager.prototype.load = function load(entityClass, oid, options) {
    var _this6 = this;

    options = options || {};
    var entity = this.getReference(entityClass, oid);
    var state = Metadata.get(entity);

    if (!options.refresh && options.local && state.isAvailable) {
      return this.resolveDepth(entity, options);
    }

    var msg = new message.GetObject(state.bucket, state.key);

    this.ensureCacheHeader(entity.id, msg, options.refresh);

    return this.send(msg).then(function (response) {
      // refresh object if loaded older version from cache
      // chrome doesn't using cache when ifNoneMatch is set
      if (entity.version > response.entity.version) {
        options.refresh = true;
        return _this6.load(entityClass, oid, options);
      }

      _this6.addToWhiteList(response.entity.id);

      if (response.status != StatusCode.NOT_MODIFIED) {
        state.setJson(response.entity, { persisting: true });
      }

      return _this6.resolveDepth(entity, options);
    }, function (e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        _this6.removeReference(entity);
        state.setRemoved();
        return null;
      } else {
        throw e;
      }
    });
  };

  /**
   * @param {binding.Entity} entity
   * @param {Object} options
   * @return {Promise<binding.Entity>}
   */

  EntityManager.prototype.insert = function insert(entity, options) {
    var _this7 = this;

    options = options || {};
    var isNew = void 0;

    return this._save(entity, options, function (state, json) {
      if (state.version) throw new error.PersistentError('Existing objects can\'t be inserted.');

      isNew = !state.id;

      return new message.CreateObject(state.bucket, json);
    }).then(function (val) {
      if (isNew) _this7._attach(entity);

      return val;
    });
  };

  /**
   * @param {binding.Entity} entity
   * @param {Object} options
   * @return {Promise<binding.Entity>}
   */

  EntityManager.prototype.update = function update(entity, options) {
    options = options || {};

    return this._save(entity, options, function (state, json) {
      if (!state.version) throw new error.PersistentError("New objects can't be inserted.");

      if (options.force) {
        delete json.version;
        return new message.ReplaceObject(state.bucket, state.key, json).ifMatch('*');
      } else {
        return new message.ReplaceObject(state.bucket, state.key, json).ifMatch(state.version);
      }
    });
  };

  /**
   * @param {binding.Entity} entity
   * @param {Object} options The save options
   * @param {boolean=} withoutLock Set true to save the entity without locking
   * @return {Promise<binding.Entity>}
   */

  EntityManager.prototype.save = function save(entity, options, withoutLock) {
    options = options || {};

    var msgFactory = function msgFactory(state, json) {
      if (options.force) {
        if (!state.id) throw new error.PersistentError("New special objects can't be forcedly saved.");

        delete json.version;
        return new message.ReplaceObject(state.bucket, state.key, json);
      } else if (state.version) {
        return new message.ReplaceObject(state.bucket, state.key, json).ifMatch(state.version);
      } else {
        return new message.CreateObject(state.bucket, json);
      }
    };

    return withoutLock ? this._locklessSave(entity, options, msgFactory) : this._save(entity, options, msgFactory);
  };

  /**
   * @param {binding.Entity} entity
   * @param {Function} cb pre-safe callback
   * @return {Promise<binding.Entity>}
   */

  EntityManager.prototype.optimisticSave = function optimisticSave(entity, cb) {
    var _this8 = this;

    return Metadata.get(entity).withLock(function () {
      return _this8._optimisticSave(entity, cb);
    });
  };

  /**
   * @param {binding.Entity} entity
   * @param {Function} cb pre-safe callback
   * @return {Promise<binding.Entity>}
   * @private
   */

  EntityManager.prototype._optimisticSave = function _optimisticSave(entity, cb) {
    var _this9 = this;

    var abort = false;
    var abortFn = function abortFn() {
      abort = true;
    };
    var promise = Promise.resolve(cb(entity, abortFn));

    if (abort) return Promise.resolve(entity);

    return promise.then(function () {
      return _this9.save(entity, {}, true).catch(function (e) {
        if (e.status == 412) {
          return _this9.refresh(entity, {}).then(function () {
            return _this9._optimisticSave(entity, cb);
          });
        } else {
          throw e;
        }
      });
    });
  };

  /**
   * Save the object state without locking
   * @param {binding.Entity} entity
   * @param {Object} options
   * @param {Function} msgFactory
   * @return {Promise.<binding.Entity>}
   * @private
   */

  EntityManager.prototype._locklessSave = function _locklessSave(entity, options, msgFactory) {
    var _this10 = this;

    this.attach(entity);
    var state = Metadata.get(entity);
    var refPromises = void 0;

    var json = void 0;
    if (state.isAvailable) {
      //getting json will check all collections changes, therefore we must do it before proofing the dirty state
      json = state.getJson({
        persisting: true
      });
    }

    if (state.isDirty) {
      if (!options.refresh) {
        state.setPersistent();
      }

      var sendPromise = this.send(msgFactory(state, json)).then(function (response) {
        state.setJson(response.entity, {
          persisting: options.refresh,
          onlyMetadata: !options.refresh
        });
        return entity;
      }, function (e) {
        if (e.status == StatusCode.OBJECT_NOT_FOUND) {
          _this10.removeReference(entity);
          state.setRemoved();
          return null;
        } else {
          state.setDirty();
          throw e;
        }
      });

      refPromises = [sendPromise];
    } else {
      refPromises = [Promise.resolve(entity)];
    }

    var subOptions = Object.assign({}, options);
    subOptions.depth = 0;
    this.getSubEntities(entity, options.depth).forEach(function (sub) {
      refPromises.push(_this10._save(sub, subOptions, msgFactory));
    });

    return Promise.all(refPromises).then(function () {
      return entity;
    });
  };

  /**
   * Save and lock the object state
   * @param {binding.Entity} entity
   * @param {Object} options
   * @param {Function} msgFactory
   * @return {Promise.<binding.Entity>}
   * @private
   */

  EntityManager.prototype._save = function _save(entity, options, msgFactory) {
    var _this11 = this;

    this.ensureBloomFilterFreshness();

    var state = Metadata.get(entity);
    if (state.version) {
      this.addToBlackList(entity.id);
    }

    return state.withLock(function () {
      return _this11._locklessSave(entity, options, msgFactory);
    });
  };

  /**
   * Returns all referenced sub entities for the given depth and root entity
   * @param {binding.Entity} entity
   * @param {boolean|number} depth
   * @param {binding.Entity[]} [resolved]
   * @param {binding.Entity=} initialEntity
   * @returns {binding.Entity[]}
   */

  EntityManager.prototype.getSubEntities = function getSubEntities(entity, depth, resolved, initialEntity) {
    var _this12 = this;

    resolved = resolved || [];
    if (!depth) {
      return resolved;
    }
    initialEntity = initialEntity || entity;

    var state = Metadata.get(entity);
    for (var _iterator = state.type.references(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var value = _ref;

      this.getSubEntitiesByPath(entity, value.path).forEach(function (subEntity) {
        if (!~resolved.indexOf(subEntity) && subEntity != initialEntity) {
          resolved.push(subEntity);
          resolved = _this12.getSubEntities(subEntity, depth === true ? depth : depth - 1, resolved, initialEntity);
        }
      });
    }

    return resolved;
  };

  /**
   * Returns all referenced one level sub entities for the given path
   * @param {binding.Entity} entity
   * @param {Array<string>} path
   * @returns {binding.Entity[]}
   */

  EntityManager.prototype.getSubEntitiesByPath = function getSubEntitiesByPath(entity, path) {
    var _this13 = this;

    var subEntities = [entity];

    path.forEach(function (attributeName) {

      var tmpSubEntities = [];
      subEntities.forEach(function (subEntity) {
        var curEntity = subEntity[attributeName];
        if (!curEntity) return;

        var attribute = _this13.metamodel.managedType(subEntity.constructor).getAttribute(attributeName);
        if (attribute.isCollection) {
          for (var _iterator2 = curEntity.entries(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            var _ref2;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref2 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref2 = _i2.value;
            }

            var entry = _ref2;

            tmpSubEntities.push(entry[1]);
            attribute.keyType && attribute.keyType.isEntity && tmpSubEntities.push(entry[0]);
          }
        } else {
          tmpSubEntities.push(curEntity);
        }
      });
      subEntities = tmpSubEntities;
    });

    return subEntities;
  };

  /**
   * Delete the entity instance.
   * @param {binding.Entity} entity
   * @param {Object} options The delete options
   * @return {Promise<binding.Entity>}
   */

  EntityManager.prototype['delete'] = function _delete(entity, options) {
    var _this14 = this;

    options = options || {};

    this.attach(entity);
    var state = Metadata.get(entity);

    return state.withLock(function () {
      if (!state.version && !options.force) throw new error.IllegalEntityError(entity);

      var msg = new message.DeleteObject(state.bucket, state.key);

      _this14.addToBlackList(entity.id);

      if (!options.force) msg.ifMatch(state.version);

      var refPromises = [_this14.send(msg).then(function () {
        _this14.removeReference(entity);
        state.setRemoved();
        return entity;
      })];

      var subOptions = Object.assign({}, options);
      subOptions.depth = 0;
      _this14.getSubEntities(entity, options.depth).forEach(function (sub) {
        refPromises.push(_this14.delete(sub, subOptions));
      });

      return Promise.all(refPromises).then(function () {
        return entity;
      });
    });
  };

  /**
   * Synchronize the persistence context to the underlying database.
   *
   * @returns {Promise<*>}
   */

  EntityManager.prototype.flush = function flush(doneCallback, failCallback) {}
  // TODO: implement this


  /**
   * Make an instance managed and persistent.
   * @param {binding.Entity} entity - entity instance
   */
  ;

  EntityManager.prototype.persist = function persist(entity) {
    this.attach(entity);
  };

  /**
   * Refresh the state of the instance from the database, overwriting changes made to the entity, if any.
   * @param {binding.Entity} entity - entity instance
   * @param {Object} options The refresh options
   * @return {Promise<binding.Entity>}
   */

  EntityManager.prototype.refresh = function refresh(entity, options) {
    options = options || {};
    options.refresh = true;

    return this.load(entity.id, null, options);
  };

  /**
   * Attach the instance to this database context, if it is not already attached
   * @param {binding.Entity} entity The entity to attach
   */

  EntityManager.prototype.attach = function attach(entity) {
    if (!this.contains(entity)) {
      var type = this.metamodel.entity(entity.constructor);
      if (!type) throw new error.IllegalEntityError(entity);

      if (this.containsById(entity)) throw new error.EntityExistsError(entity);

      this._attach(entity);
    }
  };

  EntityManager.prototype._attach = function _attach(entity) {
    var metadata = Metadata.get(entity);
    if (metadata.isAttached) {
      if (metadata.db != this) {
        throw new error.EntityExistsError(entity);
      }
    } else {
      metadata.db = this;
    }

    if (!metadata.id) {
      if (metadata.type.name != 'User' && metadata.type.name != 'Role' && metadata.type.name != 'logs.AppLog') {
        metadata.id = '/db/' + metadata.type.name + '/' + util.uuid();
      }
    }

    if (metadata.id) {
      this._entities[metadata.id] = entity;
    }
  };

  EntityManager.prototype.removeReference = function removeReference(entity) {
    var state = Metadata.get(entity);
    if (!state) throw new error.IllegalEntityError(entity);

    delete this._entities[state.id];
  };

  EntityManager.prototype.register = function register(user, password, loginOption) {
    var _this15 = this;

    var login = loginOption > UserFactory.LoginOption.NO_LOGIN;
    if (this.me && login) {
      throw new error.PersistentError('User is already logged in.');
    }

    return this.withLock(function () {
      var msg = new message.Register({ user: user, password: password, login: login });
      return _this15._userRequest(msg, loginOption);
    });
  };

  EntityManager.prototype.login = function login(username, password, loginOption) {
    var _this16 = this;

    if (this.me) throw new error.PersistentError('User is already logged in.');

    return this.withLock(function () {
      var msg = new message.Login({ username: username, password: password });
      return _this16._userRequest(msg, loginOption);
    });
  };

  EntityManager.prototype.logout = function logout() {
    var _this17 = this;

    return this.withLock(function () {
      return _this17.send(new message.Logout()).then(_this17._logout.bind(_this17));
    });
  };

  EntityManager.prototype.loginWithOAuth = function loginWithOAuth(provider, clientID, options) {
    if (this.me) throw new error.PersistentError('User is already logged in.');

    options = Object.assign({
      title: "Login with " + provider,
      timeout: 5 * 60 * 1000,
      state: {},
      loginOption: true
    }, options);

    if (options.redirect) {
      Object.assign(options.state, { redirect: options.redirect, loginOption: options.loginOption });
    }

    var msg = void 0;
    if (Message[provider + 'OAuth']) {
      msg = new Message[provider + 'OAuth'](clientID, options.scope, JSON.stringify(options.state));
      msg.addRedirectOrigin(this._connector.origin + this._connector.basePath);
    } else {
      throw new Error('OAuth provider ' + provider + ' not supported.');
    }

    if (options.redirect) {
      // use oauth via redirect by opening the login in the same window
      // for app wrappers we need to open the system browser
      var isBrowser = document.URL.indexOf('http://') != -1 || document.URL.indexOf('https://') != -1;
      if (isBrowser) {
        open(msg.request.path, '_self');
      } else {
        open(msg.request.path, '_system');
      }
      return new Promise(function (resolve) {});
    }

    var req = this._userRequest(msg, options.loginOption);
    var w = open(msg.request.path, options.title, 'width=' + options.width + ',height=' + options.height);

    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () {
        reject(new error.PersistentError('OAuth login timeout.'));
      }, options.timeout);

      req.then(resolve, reject).then(function () {
        clearTimeout(timeout);
      });
    });
  };

  EntityManager.prototype.renew = function renew(loginOption) {
    var _this18 = this;

    return this.withLock(function () {
      var msg = new message.Me();
      return _this18._userRequest(msg, loginOption);
    });
  };

  EntityManager.prototype.newPassword = function newPassword(username, password, _newPassword) {
    var _this19 = this;

    return this.withLock(function () {
      var msg = new message.NewPassword({ username: username, password: password, newPassword: _newPassword });

      return _this19.send(msg, true).then(function (response) {
        return _this19._updateUser(response.entity);
      });
    });
  };

  EntityManager.prototype.newPasswordWithToken = function newPasswordWithToken(token, newPassword, loginOption) {
    var _this20 = this;

    return this.withLock(function () {
      return _this20._userRequest(new message.NewPassword({ token: token, newPassword: newPassword }), loginOption);
    });
  };

  EntityManager.prototype.resetPassword = function resetPassword(username) {
    return this.send(new message.ResetPassword({ username: username }));
  };

  EntityManager.prototype._updateUser = function _updateUser(obj, updateMe) {
    var user = this.getReference(obj.id);
    var metadata = Metadata.get(user);
    metadata.setJson(obj, { persisting: true });

    if (updateMe) this.me = user;

    return user;
  };

  EntityManager.prototype._logout = function _logout() {
    this.me = null;
    this.token = null;
  };

  EntityManager.prototype._userRequest = function _userRequest(msg, loginOption) {
    var _this21 = this;

    if (loginOption === undefined) loginOption = true;

    var login = loginOption > UserFactory.LoginOption.NO_LOGIN;
    if (login) {
      this.tokenStorage.temporary = loginOption < UserFactory.LoginOption.PERSIST_LOGIN;
    }

    return this.send(msg, !login).then(function (response) {
      if (response.entity) {
        return _this21._updateUser(response.entity, login);
      }
    }, function (e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        if (login) _this21._logout();
        return null;
      } else {
        throw e;
      }
    });
  };

  EntityManager.prototype.registerDevice = function registerDevice(os, token, device) {
    var msg = new message.DeviceRegister({
      token: token,
      device: device,
      devicetype: os
    });

    msg.withCredentials = true;
    return this.send(msg);
  };

  EntityManager.prototype.checkDeviceRegistration = function checkDeviceRegistration() {
    var _this22 = this;

    return this.send(new message.DeviceRegistered()).then(function () {
      return _this22.isDeviceRegistered = true;
    }, function (e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return _this22.isDeviceRegistered = false;
      } else {
        throw e;
      }
    });
  };

  EntityManager.prototype.pushDevice = function pushDevice(pushMessage) {
    return this.send(new message.DevicePush(pushMessage));
  };

  /**
   * The given entity will be checked by the validation code of the entity type.
   *
   * @param {binding.Entity} entity
   * @returns {util.ValidationResult} result
   */

  EntityManager.prototype.validate = function validate(entity) {
    var type = Metadata.get(entity).type;

    var result = new util.ValidationResult();
    var iter = type.attributes();
    var item = void 0;
    for (; !(item = iter.next()).done;) {
      var validate = new util.Validator(item.value.name, entity);
      result.fields[validate.key] = validate;
    }

    var validationCode = type.validationCode;
    if (validationCode) {
      validationCode(result.fields);
    }

    return result;
  };

  /**
   * Adds the given object id to the cacheWhiteList if needed.
   * @param {string} objectId The id to add.
   */

  EntityManager.prototype.addToWhiteList = function addToWhiteList(objectId) {
    if (!this.isCachingDisabled) {
      if (this.bloomFilter.contains(objectId)) {
        this.cacheWhiteList.add(objectId);
      }
      this.cacheBlackList.delete(objectId);
    }
  };

  /**
   * Adds the given object id to the cacheBlackList if needed.
   * @param {string} objectId The id to add.
   */

  EntityManager.prototype.addToBlackList = function addToBlackList(objectId) {
    if (!this.isCachingDisabled) {
      if (!this.bloomFilter.contains(objectId)) {
        this.cacheBlackList.add(objectId);
      }
      this.cacheWhiteList.delete(objectId);
    }
  };

  EntityManager.prototype.refreshBloomFilter = function refreshBloomFilter() {
    var _this23 = this;

    if (this.isCachingDisabled) return Promise.resolve();

    var msg = new message.GetBloomFilter();
    msg.noCache();
    return this.send(msg).then(function (response) {
      _this23.updateBloomFilter(response.entity);
      return _this23.bloomFilter;
    });
  };

  EntityManager.prototype.updateBloomFilter = function updateBloomFilter(bloomFilter) {
    this.bloomFilter = new BloomFilter(bloomFilter);
    this.cacheWhiteList = new Set();
    this.cacheBlackList = new Set();
  };

  /**
   * Checks the freshness of the bloom filter and does a reload if necessary
   */

  EntityManager.prototype.ensureBloomFilterFreshness = function ensureBloomFilterFreshness() {
    var _this24 = this;

    if (this.isCachingDisabled) return;

    var now = new Date().getTime();
    var refreshRate = this.bloomFilterRefresh * 1000;

    if (this._bloomFilterLock.isReady && now - this.bloomFilter.creation > refreshRate) {
      this._bloomFilterLock.withLock(function () {
        return _this24.refreshBloomFilter();
      });
    }
  };

  /**
   * Checks for a given id, if revalidation is required, the resource is stale or caching was disabled
   * @param {string} id The object id to check
   * @returns {boolean} Indicates if the resource must be revalidated
   */

  EntityManager.prototype.mustRevalidate = function mustRevalidate(id) {
    if (util.isNode) return false;

    this.ensureBloomFilterFreshness();

    var refresh = this.isCachingDisabled || !this._bloomFilterLock.isReady;
    refresh = refresh || !this.cacheWhiteList.has(id) && (this.cacheBlackList.has(id) || this.bloomFilter.contains(id));
    return refresh;
  };

  /**
   *
   * @param {string} id To check the bloom filter
   * @param {connector.Message} message To attach the headers
   * @param {boolean} refresh To force the reload headers
   */

  EntityManager.prototype.ensureCacheHeader = function ensureCacheHeader(id, message, refresh) {
    refresh = refresh || this.mustRevalidate(id);

    if (refresh) {
      message.noCache();
    }
  };

  /**
   * Creates a absolute url for the given relative one
   * @param {string} relativePath the relative url
   * @param {boolean=} authorize indicates if authorization credentials should be generated and be attached to the url
   * @return {string} a absolute url wich is optionaly signed with a resource token which authenticates the currently
   * logged in user
   */

  EntityManager.prototype.createURL = function createURL(relativePath, authorize) {
    var path = this._connector.basePath + relativePath;

    var append = false;
    if (authorize && this.me) {
      path = this.tokenStorage.signPath(path);
      append = true;
    } else {
      path = path.split('/').map(encodeURIComponent).join('/');
    }

    if (this.mustRevalidate(relativePath)) {
      path = path + (append ? '&' : '?') + 'BCB';
    }

    return this._connector.origin + path;
  };

  return EntityManager;
}(util.Lockable);

/**
 * Constructor for a new List collection
 * @function
 * @param {...*} args Same arguments can be passed as the Array constructor takes
 * @return {void} The new created List
 */

EntityManager.prototype.List = Array;

/**
 * Constructor for a new Set collection
 * @function
 * @param {Iterable<*>=} collection The initial array or collection to initialize the new Set
 * @return {void} The new created Set
 */
EntityManager.prototype.Set = Set;

/**
 * Constructor for a new Map collection
 * @function
 * @param {Iterable<*>=} collection The initial array or collection to initialize the new Map
 * @return {void} The new created Map
 */
EntityManager.prototype.Map = Map;

/**
 * Constructor for a new GeoPoint
 * @function
 * @param {string|number|Object|Array<number>} [latitude] A coordinate pair (latitude first), a GeoPoint like object or the GeoPoint's latitude
 * @param {number=} longitude The GeoPoint's longitude
 * @return {void} The new created GeoPoint
 */
EntityManager.prototype.GeoPoint = _dereq_(5);

/**
 * An User factory for user objects.
 * The User factory can be called to create new instances of users or can be used to register/login/logout users.
 * The created instances implements the {@link model.User} interface
 * @name User
 * @type binding.UserFactory
 * @memberOf EntityManager.prototype
 */

/**
 * An Role factory for role objects.
 * The Role factory can be called to create new instances of roles, later on users can be attached to roles to manage the
 * access permissions through this role
 * The created instances implements the {@link model.Role} interface
 * @name Role
 * @memberOf EntityManager.prototype
 * @type binding.EntityFactory<model.Role>
 */

/**
 * An Device factory for user objects.
 * The Device factory can be called to create new instances of devices or can be used to register, push to and
 * check registration status of devices.
 * @name Device
 * @memberOf EntityManager.prototype
 * @type binding.DeviceFactory
 */

/**
 * An Object factory for entity or embedded objects,
 * that can be accessed by the type name of the entity type.
 * An object factory can be called to create new instances of the type.
 * The created instances implements the {@link binding.Entity} or the {@link binding.Managed} interface
 * whenever the class is an entity or embedded object
 * @name [YourEntityClass: string]
 * @memberOf EntityManager.prototype
 * @type {*}
 */

/**
 * A File factory for file objects.
 * The file factory can be called to create new instances for files.
 * The created instances implements the {@link binding.File} interface
 * @name File
 * @memberOf EntityManager.prototype
 * @type binding.FileFactory
 */

module.exports = EntityManager;

},{"19":19,"20":20,"21":21,"25":25,"33":33,"35":35,"4":4,"5":5,"62":62,"66":66,"75":75}],3:[function(_dereq_,module,exports){
"use strict";

var message = _dereq_(35);
var metamodel = _dereq_(51);

var util = _dereq_(75);
var caching = _dereq_(22);
var Connector = _dereq_(23);
var EntityManager = _dereq_(2);

/**
 * @alias EntityManagerFactory
 * @extends util.Lockable
 */

var EntityManagerFactory = function (_util$Lockable) {
  babelHelpers.inherits(EntityManagerFactory, _util$Lockable);

  EntityManagerFactory.prototype._connected = function _connected() {};

  /**
   * Creates a new EntityManagerFactory connected to the given destination
   * @param {string|Object} [options] The destination to connect with, or an options object
   * @param {string} [options.host] The destination to connect with
   * @param {number} [options.port=80|443] The optional destination port to connect with
   * @param {boolean} [options.secure=false] <code>true</code> To use a secure ssl encrypted connection
   * @param {string} [options.basePath="/v1"] The base path of the api
   * @param {Object} [options.schema=null] The serialized schema as json used to initialize the metamodel
   * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which should
   * be used for token storage
   * @param {number} [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached data
   */

  function EntityManagerFactory(options) {
    babelHelpers.classCallCheck(this, EntityManagerFactory);

    var _this = babelHelpers.possibleConstructorReturn(this, _util$Lockable.call(this));

    options = Object(options) instanceof String ? { host: options } : options || {};

    /** @type connector.Connector */
    _this._connector = null;
    /** @type metamodel.Metamodel */
    _this.metamodel = _this.createMetamodel();
    /** @type util.Code */
    _this.code = new util.Code(_this.metamodel, _this);
    /** @type util.TokenStorageFactory */
    _this.tokenStorageFactory = util.TokenStorage.WEB_STORAGE || util.TokenStorage.GLOBAL;

    _this.configure(options);

    var isReady = true;
    var ready = new Promise(function (success) {
      _this._connected = success;
    });

    if (options.host) {
      _this.connect(options.host, options.port, options.secure, options.basePath);
    } else {
      isReady = false;
    }

    if (!_this.tokenStorage) {
      isReady = false;
      ready = ready.then(function () {
        return _this.tokenStorageFactory.create(_this._connector.origin);
      }).then(function (tokenStorage) {
        _this.tokenStorage = tokenStorage;
      });
    }

    if (options.schema) {
      _this._connectData = options;
      _this.metamodel.init(options.schema);
    } else {
      isReady = false;
      ready = ready.then(function () {
        var msg = new message.Connect();
        msg.withCredentials = true; //used for registered devices

        if (_this.staleness === 0) msg.noCache();

        return _this.send(msg);
      }).then(function (response) {
        _this._connectData = response.entity;

        if (_this.staleness === undefined) {
          _this.staleness = _this._connectData.bloomFilterRefresh || 60;
        }

        if (!_this.metamodel.isInitialized) _this.metamodel.init(_this._connectData.schema);

        _this.tokenStorage.update(_this._connectData.token);
      });
    }

    if (!isReady) {
      _this.withLock(function () {
        return ready;
      }, true);
    }
    return _this;
  }

  /**
   * Apply additional configurations to this EntityManagerFactory
   * @param {Object} options The additional configuration options
   * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which should
   * be used for token storage
   * @param {number} [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached data,
   * <code>0</code> to always bypass the browser cache
   */

  EntityManagerFactory.prototype.configure = function configure(options) {
    if (this._connector) throw new Error('The EntityManagerFactory can only be configured before is is connected.');

    if (options.tokenStorage) {
      /** @type util.TokenStorage */
      this.tokenStorage = options.tokenStorage;
    }

    if (options.tokenStorageFactory) {
      this.tokenStorageFactory = options.tokenStorageFactory;
    }

    if (options.staleness !== undefined) {
      /** @type number */
      this.staleness = options.staleness;
    }
  };

  /**
   * Connects this EntityManager to the given destination
   * @param {string} hostOrApp The host or the app name to connect with
   * @param {number} [port=80|443] The port to connect to
   * @param {boolean} [secure=false] <code>true</code> To use a secure connection
   * @param {string} [basePath="/v1"] The base path of the api
   */

  EntityManagerFactory.prototype.connect = function connect(hostOrApp, port, secure, basePath) {
    if (this._connector) throw new Error('The EntityManagerFactory is already connected.');

    if (Object(port) instanceof Boolean) {
      secure = port;
      port = 0;
    }

    this._connector = Connector.create(hostOrApp, port, secure, basePath);

    this._connected();
    return this.ready();
  };

  /**
   * Connects this EntityManager to the given destination
   * @param {string} hostOrApp The host or the app name to connect with
   * @param {boolean} [secure=false] <code>true</code> To use a secure connection
   * @name connect
   * @memberOf EntityManagerFactory.prototype
   * @method
   */

  /**
   * Creates a new Metamodel instance, which is not connected
   * @return {metamodel.Metamodel} A new Metamodel instance
   */

  EntityManagerFactory.prototype.createMetamodel = function createMetamodel() {
    return new metamodel.Metamodel(this);
  };

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {boolean=} useSharedTokenStorage The token storage to persist the authorization token, or
   * <code>true</code> To use the shared token storage of the emf.
   * <code>false</code> To use a instance based storage.
   *
   * @returns {EntityManager} a new entityManager
   */

  EntityManagerFactory.prototype.createEntityManager = function createEntityManager(useSharedTokenStorage) {
    var _this2 = this;

    var em = new EntityManager(this);

    if (this.isReady) {
      em.connected(this._connector, this._connectData, useSharedTokenStorage ? this.tokenStorage : new util.TokenStorage(this._connector.origin));
    } else {
      em.withLock(function () {
        return _this2.ready().then(function () {
          em.connected(_this2._connector, _this2._connectData, useSharedTokenStorage ? _this2.tokenStorage : new util.TokenStorage(_this2._connector.origin));
        });
      }, true);
    }

    return em;
  };

  EntityManagerFactory.prototype.send = function send(message) {
    if (!message.tokenStorage) message.tokenStorage = this.tokenStorage;
    return this._connector.send(message);
  };

  return EntityManagerFactory;
}(util.Lockable);

module.exports = EntityManagerFactory;

},{"2":2,"22":22,"23":23,"35":35,"51":51,"75":75}],4:[function(_dereq_,module,exports){
"use strict";

var message = _dereq_(35);
var error = _dereq_(33);

/**
 * @alias EntityTransaction
 */

var EntityTransaction = function () {
	babelHelpers.createClass(EntityTransaction, [{
		key: 'isActive',

		/**
   * Indicate whether a resource transaction is in progress. 
   * @returns {boolean} indicating whether transaction is in progress 
  	 */
		get: function get() {
			return Boolean(this.tid);
		}

		/**
   * @param {EntityManager} entityManager
   */

	}]);

	function EntityTransaction(entityManager) {
		babelHelpers.classCallCheck(this, EntityTransaction);

		this._connector = entityManager.connector;
		this.entityManager = entityManager;

		this.tid = null;
		this.rollbackOnly = false;

		this.readSet = null;
		this.changeSet = null;
	}

	/**
  * Start a resource transaction.
  */

	EntityTransaction.prototype.begin = function begin(doneCallback, failCallback) {
		return this.yield().then(function () {
			var result = this.send(new message.PostTransaction()).done(function (msg) {
				this.tid = msg.tid;

				this.rollbackOnly = false;
				this.readSet = {};
				this.changeSet = {};
			});

			return this.wait(result);
		}).then(doneCallback, failCallback);
	};

	/**
  * Commit the current resource transaction, writing any unflushed changes to the database. 
  */

	EntityTransaction.prototype.commit = function commit(doneCallback, failCallback) {
		return this.yield().then(function () {
			if (this.getRollbackOnly()) {
				return this.rollback().then(function () {
					throw new error.RollbackError();
				});
			} else {
				return this.wait(this.entityManager.flush()).then(function () {
					var readSet = [];
					for (var ref in this.readSet) {
						readSet.push({
							"oid": ref,
							"version": this.readSet[ref]
						});
					}

					var result = this.send(new message.PutTransactionCommitted(this.tid, readSet));

					return this.wait(result).then(function (msg) {
						this.tid = null;
						this.readSet = null;
						this.changeSet = null;

						var oids = msg.oids;
						for (var oid in oids) {
							var version = oids[oid];
							var entity = this.entityManager.entities[oid];

							if (entity) {
								var state = util.Metadata.get(entity);
								if (version == 'DELETED' || state.isDeleted) {
									this.entityManager.removeReference(entity);
								} else {
									state.setJsonValue(state.type.version, version);
								}
							}
						}
					});
				});
			}
		}).then(doneCallback, failCallback);
	};

	/**
  * Determine whether the current resource transaction has been marked for rollback. 
  * @returns {boolean} indicating whether the transaction has been marked for rollback 
  */

	EntityTransaction.prototype.getRollbackOnly = function getRollbackOnly() {
		return this.rollbackOnly;
	};

	/**
  * Roll back the current resource transaction. 
  */

	EntityTransaction.prototype.rollback = function rollback(doneCallback, failCallback) {
		return this.yield().then(function () {
			var result = this.send(new message.PutTransactionAborted(this.tid));

			this.wait(result).then(function () {
				this.tid = null;
				this.readSet = null;
				this.changeSet = null;
				return this.entityManager.clear();
			}, function () {
				return this.entityManager.clear();
			});
		}).then(doneCallback, failCallback);
	};

	/**
  * Mark the current resource transaction so that the only possible outcome of the transaction is for the transaction to be rolled back. 
  */

	EntityTransaction.prototype.setRollbackOnly = function setRollbackOnly(context, onSuccess) {
		return this.yield().done(function () {
			this.rollbackOnly = true;
		});
	};

	EntityTransaction.prototype.isRead = function isRead(identifier) {
		return this.isActive && identifier in this.readSet;
	};

	EntityTransaction.prototype.setRead = function setRead(identifier, version) {
		if (this.isActive && !this.isChanged(identifier)) {
			this.readSet[identifier] = version;
		}
	};

	EntityTransaction.prototype.isChanged = function isChanged(identifier) {
		return this.isActive && identifier in this.changeSet;
	};

	EntityTransaction.prototype.setChanged = function setChanged(identifier) {
		if (this.isActive) {
			delete this.readSet[identifier];
			this.changeSet[identifier] = true;
		}
	};

	return EntityTransaction;
}();

module.exports = EntityTransaction;

},{"33":33,"35":35}],5:[function(_dereq_,module,exports){
"use strict";

/**
 * Creates a new GeoPoint instance
 * From latitude and longitude
 * From a json object
 * Or an tuple of latitude and longitude
 *
 * @alias GeoPoint
 */

var GeoPoint = function () {

  /**
   * Creates a GeoPoint with the user's current location, if available.
   * @return {Promise<GeoPoint>} A promise that will be resolved with a GeoPoint
   */
  GeoPoint.current = function current() {
    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(function (location) {
        resolve(new GeoPoint(location.coords.latitude, location.coords.longitude));
      }, function (error) {
        reject(error);
      });
    });
  };

  /**
   * @param {string|number|Object|Array<number>} [latitude] A coordinate pair (latitude first), a GeoPoint like object or the GeoPoint's latitude
   * @param {number=} longitude The GeoPoint's longitude
   */

  function GeoPoint(latitude, longitude) {
    babelHelpers.classCallCheck(this, GeoPoint);

    var lat = void 0,
        lng = void 0;
    if (Object(latitude) instanceof String) {
      var index = latitude.indexOf(';');
      lat = latitude.substring(0, index);
      lng = latitude.substring(index + 1);
    } else if (Object(latitude) instanceof Number) {
      lat = latitude;
      lng = longitude;
    } else if (Object(latitude) instanceof Array) {
      lat = latitude[0];
      lng = latitude[1];
    } else if (latitude instanceof Object) {
      lat = latitude.latitude;
      lng = latitude.longitude;
    } else {
      lat = 0;
      lng = 0;
    }

    /**
     * Longitude of the given point
     * @type {number}
     */
    this.longitude = lng;

    /**
     * Latitude of the given point
     * @type {number}
     */
    this.latitude = lat;

    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error("Latitude " + this.latitude + " is not in bound of -90 <= latitude <= 90");
    }

    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error("Longitude " + this.longitude + " is not in bound of -180 <= longitude <= 180");
    }
  }

  /**
   * Returns the distance from this GeoPoint to another in kilometers.
   * @param {GeoPoint} point another GeoPoint
   * @return {number} The distance in kilometers
   *
   * @see GeoPoint#radiansTo
   */

  GeoPoint.prototype.kilometersTo = function kilometersTo(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_KILOMETERS * this.radiansTo(point)).toFixed(3));
  };

  /**
   * Returns the distance from this GeoPoint to another in miles.
   * @param {GeoPoint} point another GeoPoint
   * @return {number} The distance in miles
   *
   * @see GeoPoint#radiansTo
   */

  GeoPoint.prototype.milesTo = function milesTo(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_MILES * this.radiansTo(point)).toFixed(3));
  };

  /**
   * Computes the arc, in radian, between two WGS-84 positions.
   *
   * The haversine formula implementation is taken from:
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   *
   * Returns the distance from this GeoPoint to another in radians.
   * @param {GeoPoint} point another GeoPoint
   * @return {number} the arc, in radian, between two WGS-84 positions
   *
   * @see http://en.wikipedia.org/wiki/Haversine_formula
   */

  GeoPoint.prototype.radiansTo = function radiansTo(point) {
    var from = this,
        to = point;
    var rad1 = from.latitude * GeoPoint.DEG_TO_RAD,
        rad2 = to.latitude * GeoPoint.DEG_TO_RAD,
        dLng = (to.longitude - from.longitude) * GeoPoint.DEG_TO_RAD;

    return Math.acos(Math.sin(rad1) * Math.sin(rad2) + Math.cos(rad1) * Math.cos(rad2) * Math.cos(dLng));
  };

  /**
   * A String representation in latitude, longitude format
   * @return {string} The string representation of this class
   */

  GeoPoint.prototype.toString = function toString() {
    return this.latitude + ';' + this.longitude;
  };

  /**
   * Returns a JSON representation of the GeoPoint
   * @return {json} A GeoJson object of this GeoPoint
   */

  GeoPoint.prototype.toJSON = function toJSON() {
    return { latitude: this.latitude, longitude: this.longitude };
  };

  return GeoPoint;
}();

GeoPoint.DEG_TO_RAD = Math.PI / 180;

/**
 * The Earth radius in kilometers used by {@link GeoPoint#kilometersTo}
 * @type {number}
 */
GeoPoint.EARTH_RADIUS_IN_KILOMETERS = 6371;

/**
 * The Earth radius in miles used by {@link GeoPoint#milesTo}
 * @type {number}
 */
GeoPoint.EARTH_RADIUS_IN_MILES = 3956;

module.exports = GeoPoint;

},{}],6:[function(_dereq_,module,exports){
'use strict';

/**
 * @interface baqend
 * @extends EntityManager
 */

var EntityManagerFactory = _dereq_(3);
var EntityManager = _dereq_(2);

EntityManager.prototype.binding = _dereq_(20);
EntityManager.prototype.connector = _dereq_(27);
EntityManager.prototype.error = _dereq_(33);
EntityManager.prototype.message = _dereq_(35);
EntityManager.prototype.metamodel = _dereq_(51);
EntityManager.prototype.util = _dereq_(75);
EntityManager.prototype.caching = _dereq_(22);
EntityManager.prototype.query = _dereq_(62);
EntityManager.prototype.partialupdate = _dereq_(55);

EntityManager.prototype.EntityManager = _dereq_(2);
EntityManager.prototype.EntityManagerFactory = _dereq_(3);
EntityManager.prototype.EntityTransaction = _dereq_(4);
EntityManager.prototype.Acl = _dereq_(1);

var emf = new EntityManagerFactory();
var db = emf.createEntityManager(true);

/**
 * Configures the DB with additional config options
 * @param {Object} options The additional configuration options
 * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
 * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which should
 * be used for token storage
 * @param {number} [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached data,
 * <code>0</code> to always bypass the browser cache
 * @function
 * @return {baqend}
 * @alias baqend#configure
 */
db.configure = function (options) {
  emf.configure(options);
  return this;
};

/**
 * Connects the DB with the server and calls the callback on success
 * @param {string} hostOrApp The host or the app name to connect with
 * @param {boolean} [secure=false] <code>true</code> To use a secure connection
 * @param {util.Lockable~doneCallback=} doneCallback The callback, called when a connection is established and the
 * SDK is ready to use
 * @param {util.Lockable~failCallback=} failCallback When an error occurred while initializing the SDK
 * @function
 * @return {Promise<EntityManager>}
 * @alias baqend#connect
 */
db.connect = function (hostOrApp, secure, doneCallback, failCallback) {
  if (secure instanceof Function) {
    failCallback = doneCallback;
    doneCallback = secure;
    secure = undefined;
  }

  emf.connect(hostOrApp, secure);
  return this.ready(doneCallback, failCallback);
};

exports = module.exports = db;
//import {db} from 'baqend';
exports.db = db;
//import db from 'baqend';
exports.default = db;

},{"1":1,"2":2,"20":20,"22":22,"27":27,"3":3,"33":33,"35":35,"4":4,"51":51,"55":55,"62":62,"75":75}],7:[function(_dereq_,module,exports){
"use strict";

/**
 * @alias binding.Accessor
 */

var Accessor = function () {
	function Accessor() {
		babelHelpers.classCallCheck(this, Accessor);
	}

	/**
  * @param {Object} object
  * @param {metamodel.Attribute} attribute
  * @returns {*}
  */
	Accessor.prototype.getValue = function getValue(object, attribute) {
		return object[attribute.name];
	};

	/**
  * @param {Object} object
  * @param {metamodel.Attribute} attribute
  * @param {*} value
  */

	Accessor.prototype.setValue = function setValue(object, attribute, value) {
		object[attribute.name] = value;
	};

	return Accessor;
}();

module.exports = Accessor;

},{}],8:[function(_dereq_,module,exports){
"use strict";

var EntityFactory = _dereq_(11);

/**
 * @class binding.DeviceFactory
 * @extends binding.EntityFactory<model.Device>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {model.Device} The new managed instance
 */
var DeviceFactory = EntityFactory.extend( /** @lends binding.DeviceFactory.prototype */{

  /**
   * Returns true if the devices is already registered, otherwise false.
   * @returns {boolean} Status of the device registration
   */
  get isRegistered() {
    return this._db.isDeviceRegistered;
  },

  /**
   * Register a new device with the given device token and OS.
   * @param {string} os The OS of the device (IOS/Android)
   * @param {string} token The GCM or APNS device token
   * @param {model.Device=} device A optional device entity to set custom field values
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<any>}
   */
  register: function register(os, token, device, doneCallback, failCallback) {
    if (device instanceof Function) {
      failCallback = doneCallback;
      doneCallback = device;
      device = null;
    }

    return this._db.registerDevice(os, token, device).then(doneCallback, failCallback);
  },

  /**
   * Uses the info from the given {util.PushMessage} message to send an push notification.
   * @param {util.PushMessage} pushMessage to send an push notification.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<any>}
   */
  push: function push(pushMessage, doneCallback, failCallback) {
    return this._db.pushDevice(pushMessage).then(doneCallback, failCallback);
  }
});

DeviceFactory.PushMessage = _dereq_(69);

module.exports = DeviceFactory;

},{"11":11,"69":69}],9:[function(_dereq_,module,exports){
"use strict";

var Metadata = _dereq_(66);
var Lockable = _dereq_(64);

/**
 * @alias binding.Enhancer
 */

var Enhancer = function () {
  function Enhancer() {
    babelHelpers.classCallCheck(this, Enhancer);
  }

  /**
   * @param {Class<*>} superClass
   * @returns {Class<*>} typeConstructor
   */
  Enhancer.prototype.createProxy = function createProxy(superClass) {
    return function (_superClass) {
      babelHelpers.inherits(Proxy, _superClass);

      function Proxy() {
        babelHelpers.classCallCheck(this, Proxy);
        return babelHelpers.possibleConstructorReturn(this, _superClass.apply(this, arguments));
      }

      return Proxy;
    }(superClass);
  };

  /**
   * @param {Class<*>} typeConstructor
   * @returns {string}
   */

  Enhancer.prototype.getIdentifier = function getIdentifier(typeConstructor) {
    return typeConstructor.__baqendId__;
  };

  /**
   * @param {Class<*>} typeConstructor
   * @param {string} identifier
   */

  Enhancer.prototype.setIdentifier = function setIdentifier(typeConstructor, identifier) {
    Object.defineProperty(typeConstructor, '__baqendId__', {
      value: identifier
    });
  };

  /**
   * @param {metamodel.ManagedType} type
   * @param {Class<*>} typeConstructor
   */

  Enhancer.prototype.enhance = function enhance(type, typeConstructor) {
    if (typeConstructor.__baqendType__ == type) return;

    if (typeConstructor.hasOwnProperty('__baqendType__')) throw new Error('Type is already used by a different manager');

    Object.defineProperty(typeConstructor, '__baqendType__', {
      value: type
    });

    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor.prototype, type);
  };

  /**
   * Enhance the prototype of the type
   * @param {Object} proto
   * @param {metamodel.ManagedType} type
   */

  Enhancer.prototype.enhancePrototype = function enhancePrototype(proto, type) {
    if (proto.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      Object.defineProperty(proto, 'toString', {
        value: function toString() {
          return this._metadata.id || this._metadata.bucket;
        },
        enumerable: false
      });
    }

    // enhance all persistent object properties
    if (type.superType && type.superType.name == 'Object') {
      for (var _iterator = type.superType.declaredAttributes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var attr = _ref;

        if (!attr.isMetadata) this.enhanceProperty(proto, attr);
      }
    }

    // enhance all persistent properties
    for (var _iterator2 = type.declaredAttributes, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var _attr = _ref2;

      this.enhanceProperty(proto, _attr);
    }
  };

  /**
   * @param {Object} proto
   * @param {metamodel.Attribute} attribute
   */

  Enhancer.prototype.enhanceProperty = function enhanceProperty(proto, attribute) {
    var name = '$' + attribute.name;
    Object.defineProperty(proto, attribute.name, {
      get: function get() {
        var metadata = this._metadata;
        metadata.readAccess();
        return metadata[name];
      },
      set: function set(value) {
        var metadata = this._metadata;
        metadata.writeAccess();
        metadata[name] = value;
      },

      configurable: true,
      enumerable: true
    });
  };

  return Enhancer;
}();

module.exports = Enhancer;

},{"64":64,"66":66}],10:[function(_dereq_,module,exports){
"use strict";

var Managed = _dereq_(15);
var EntityPartialUpdateBuilder = _dereq_(52);

/**
 * @alias binding.Entity
 * @extends binding.Managed
 */

var Entity = function (_Managed) {
  babelHelpers.inherits(Entity, _Managed);

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */
  function Entity(properties) {
    babelHelpers.classCallCheck(this, Entity);
    return babelHelpers.possibleConstructorReturn(this, _Managed.call(this, properties));
  }

  return Entity;
}(Managed);

Object.defineProperties(Entity.prototype, /** @lends binding.Entity.prototype */{
  /**
   * The unique id of this object
   *
   * Sets the unique id of this object, if the id is not formatted as an valid id,
   * it will be used as the key component of the id has the same affect as setting the key
   *
   * @type string
   */
  id: {
    get: function get() {
      return this._metadata.id;
    },
    set: function set(value) {
      if (this._metadata.id) throw new Error('The id can\'t be set twice: ' + value);

      value += '';
      if (value.indexOf('/db/' + this._metadata.bucket + '/') == 0) {
        this._metadata.id = value;
      } else {
        this.key = value;
      }
    },

    enumerable: true
  },

  /**
   * The unique key part of the id
   * When the key of the unique id is set an error will be thrown if an id is already set.
   * @type string
   */
  key: {
    get: function get() {
      return this._metadata.key;
    },
    set: function set(value) {
      this._metadata.key = value;
    }
  },

  /**
   * The version of this object
   * @type number
   */
  version: {
    get: function get() {
      return this._metadata.version;
    },

    enumerable: true
  },

  /**
   * The object read/write permissions
   * @type Acl
   */
  acl: {
    get: function get() {
      return this._metadata.acl;
    },

    enumerable: true
  },

  /**
   * Date of the creation of the object
   * @name createdAt
   * @memberOf binding.Entity.prototype
   * @type Date
   */

  /**
   * Last update date of the object
   * @name updatedAt
   * @memberOf binding.Entity.prototype
   * @type Date
   */

  /**
   * Waits on the previously requested operation on this object completes
   * @param {binding.Entity~doneCallback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Promise<this>} A promise which completes successfully, when the previously requested
   * operation completes
   * @method
   */
  ready: {
    value: function ready(doneCallback) {
      return this._metadata.ready(doneCallback);
    }
  },

  /**
   * Attach this object to the given db
   * @param {EntityManager} db The db which will be used for future crud operations
   * @method
   */
  attach: {
    value: function attach(db) {
      db.attach(this);
    }
  },

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Object} [options] The save options
   * @param {boolean} [options.force=false] Force the save operation, the version will not be validated.
   * @param {number|boolean} [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  save: {
    value: function save(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.save(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Object} [options] The insertion options
   * @param {number|boolean} [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  insert: {
    value: function insert(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Updates an existing object.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Object} [options] The update options
   * @param {boolean} [options.force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {number|boolean} [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  update: {
    value: function update(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.update(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Resolves the referenced object in the specified depth. Only unresolved objects will be loaded unless the refresh option is specified.
   * Removed objects will be marked as removed.
   * @param {Object} [options] The load options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth set to <code>true</code>
   * loads objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  load: {
    value: function load(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }
      options = options || {};
      options.local = true;

      return this._metadata.db.load(this.id, null, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Delete an existing object.
   * @param {Object} [options] The remove options
   * @param {boolean} [options.force=false] Force the remove operation, the version will not be validated.
   * @param {number|boolean} [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  'delete': {
    value: function value(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.delete(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Saves the object and repeats the operation if the object is out of date.
   * In each pass the callback will be called. Ths first parameter of the callback is the entity and the second one
   * is a function to abort the process.
   *
   * @param {Function} cb Will be called in each pass
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  optimisticSave: {
    value: function optimisticSave(cb, doneCallback, failCallback) {
      return this._metadata.db.optimisticSave(this, cb).then(doneCallback, failCallback);
    }
  },

  attr: {
    value: function attr() {
      throw new Error("Attr is not yet implemented.");
    }
  },

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @returns {util.ValidationResult} Contains the result of the Validation
   * @method
   */
  validate: {
    value: function validate() {
      return this._metadata.db.validate(this);
    }
  },

  /**
   * Starts a partial update on this entity
   *
   * @param {json} operations
   * @returns {partialupdate.EntityPartialUpdateBuilder<this>}
   */
  partialUpdate: {
    value: function partialUpdate(operations) {
      return new EntityPartialUpdateBuilder(this, operations);
    }
  },

  /**
   * Get all objects which refer to this object
   *
   * @param {Object} [options] Some options to pass
   * @param {Array.<string>} [options.classes] An array of class names to filter for, null for no filter
   * @return {Promise.<binding.Entity>} A promise resolving with an array of all referencing objects
   * @method
   */
  getReferencing: {
    value: function getReferencing(options) {
      var _this2 = this;

      var db = this._metadata.db;
      var references = this._metadata.type.getReferencing(db, options);

      // Query all possibly referencing objects
      var allResults = Array.from(references).map(function (refAttr) {
        // Create query for given entity
        var ref = refAttr[0];
        var qb = db.createQueryBuilder(ref.typeConstructor);

        // Add term for each attribute
        var attrs = refAttr[1];
        var terms = [];
        attrs.forEach(function (attr) {
          terms.push(qb.equal(attr, _this2));
        });

        // If more than one term, put everything in a disjunction
        var query = terms.length == 1 ? terms[0] : qb.or(terms);

        return query.resultList();
      });

      return Promise.all(allResults).then(function (results) {
        // Filter out all objects which did not match
        return results.filter(function (result) {
          return !!result.length;
        });
      }).then(function (results) {
        // Flat the array of results
        return [].concat.apply([], results);
      });
    }
  },

  /**
   * Converts the object to an JSON-Object
   * @param {Object|boolean} [options=false] to json options by default excludes the metadata
   * @param {boolean} [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param {number|boolean} [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @returns {json} JSON-Object
   * @method
   */
  toJSON: {
    value: function toJSON(options) {
      //JSON.stringify calls toJSON with the parent key as the first argument.
      //Therefore ignore all unknown option types.
      if (typeof options === 'boolean') {
        options = {
          excludeMetadata: options
        };
      }

      if ((typeof options === 'undefined' ? 'undefined' : babelHelpers.typeof(options)) !== 'object') {
        options = {};
      }

      return this._metadata.getJson(options);
    }
  }
});

module.exports = Entity;

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback binding.Entity~doneCallback
 * @param {this} entity This entity
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.Entity~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise, result or undefined
 */

},{"15":15,"52":52}],11:[function(_dereq_,module,exports){
"use strict";

var ManagedFactory = _dereq_(16);
var Metadata = _dereq_(66);

/**
 * @class binding.EntityFactory<T>
 * @extends binding.ManagedFactory<T>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {T} The new managed instance
 */
var EntityFactory = ManagedFactory.extend( /** @lends binding.EntityFactory<T>.prototype */{
  /**
   * Loads the instance for the given id, or null if the id does not exists.
   * @param {string} id The id to query
   * @param {Object} [options] The load options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 loads only this object,
   * <code>true</code> loads the objects by reachability.
   * @param {boolean} [options.refresh=false] Indicates whether the object should be revalidated (cache bypass).
   * @param {boolean} [options.local=false] Indicates whether the local copy (from the entity manager)
   * of an object should be returned if it exists. This value might be stale.
   * @param {binding.EntityFactory~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.EntityFactory~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load: function load(id, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._db.load(this._managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  },

  /**
   * Gets an unloaded reference for the given id.
   * @param {string} id The id of an object to get a reference for.
   * @return {T} An unloaded reference to the object with the given id.
   */
  ref: function ref(id) {
    return this._db.getReference(this._managedType.ref, id);
  },

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {json} json
   * @returns {T} instance
   */
  fromJSON: function fromJSON(json) {
    var obj = this._db.getReference(this._managedType.typeConstructor, json.id);
    return this._managedType.fromJsonValue(null, json, obj);
  },

  /**
   * Creates a new query for this class
   * @return {query.Builder<T>} The query builder
   */
  find: function find() {
    return this._db.createQueryBuilder(this._managedType.typeConstructor);
  },

  /**
   * Creates a new partial update for this class
   * @param {string} id The id to partial update
   * @param {json} [partialUpdate] An initial partial update to execute
   * @return {partialupdate.EntityPartialUpdateBuilder<T>}
   */
  partialUpdate: function partialUpdate(id, _partialUpdate) {
    return this.ref(id).partialUpdate(_partialUpdate);
  }

  /**
   * Creates a new instance of the of this type
   * @function
   * @name new
   * @param {Object<string, *>} properties Additional properties which will be applied to the created instance
   * @return {binding.Entity} A new created instance of this class
   * @memberOf binding.EntityFactory.prototype
   */

});

module.exports = EntityFactory;

/**
 * The entity callback is called, when the asynchronous operation completes successfully
 * @callback binding.EntityFactory~doneCallback
 * @param {T} entity The entity
 * @return {Promise<*>|*} A Promise or result
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.EntityFactory~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise or result
 */

},{"16":16,"66":66}],12:[function(_dereq_,module,exports){
"use strict";

/**
 * This factory creates instances of type T, by invoking the {@link #new()} method or by instanciating this factory directly
 * @class binding.Factory<T>
 *
 * @param {...any} args constructor params passed to the type constructor
 * @return {T} The new instance
 */

var Factory = _extend( /** @lends binding.Factory<T>.prototype */{

  /**
   * Creates a child factory of this factory
   * @param {Object} factoryMembers additional members applied to the child factory
   * @returns {Object} The new created child Factory
   * @static
   * @ignore
   */
  extend: function extend(factoryMembers) {
    //copy all factory members to the child factory
    return _extend({}, this, factoryMembers);
  },

  /**
   * Creates a new Factory for the given type
   * @param {Class<*>} type the type constructor of T
   * @return {binding.Factory} A new object factory to created instances of T
   * @static
   * @ignore
   */
  create: function create(type) {
    var factory = function Factory(properties) {
      return factory.newInstance(arguments);
    };

    _extend(factory, this);

    //lets instanceof work properly
    factory.prototype = type.prototype;
    factory._type = type;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {...any} args Constructor arguments used for instantiation
   * @return {*} A new created instance of *
   * @instance
   */
  new: function _new() {
    return this.newInstance(arguments);
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} a Constructor arguments used for instantiation
   * @return {*} A new created instance of *
   * @instance
   */
  newInstance: function newInstance(a) {
    var instance;
    if (!a || a.length == 0) {
      instance = new this._type();
    } else {
      //es6 constructors can't be called, therfore we must provide all arguments separately
      //TODO: uggly! replace this with the spread operator if node support it
      instance = new this._type(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9]);
    }

    return instance;
  }
});

function _extend(target) {
  for (var i = 1, source; source = arguments[i]; ++i) {
    for (var _iterator = Object.getOwnPropertyNames(source), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var prop = _ref;

      Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
    }
  }return target;
}

module.exports = Factory;

},{}],13:[function(_dereq_,module,exports){
"use strict";

var error = _dereq_(33);
var Acl = _dereq_(1);
var uuid = _dereq_(77).uuid;
var message = _dereq_(35);
var StatusCode = _dereq_(25).StatusCode;

var PREFIX = '/file';
var LEN = PREFIX.length;

/**
 * Creates a file object, which represents one specific file reference.
 * This File object can afterwards be used to up- and download the file contents or to retrieves and change the files
 * metadata.
 *
 * The file data can be uploaded and downloaded as:
 *
 *  <table class="table">
 *   <tr>
 *     <th>type</th>
 *     <th>JavaScript type</th>
 *     <th>Description</th>
 *   </tr>
 *   <tr>
 *     <td>'arraybuffer'</td>
 *     <td>ArrayBuffer</td>
 *     <td>The content is represented as a fixed-length raw binary data buffer</td>
 *   </tr>
 *   <tr>
 *     <td>'blob'</th>
 *     <td>Blob</td>
 *     <td>The content is represented as a simple blob</td>
 *   </tr>
 *   <tr>
 *     <td>'json'</td>
 *     <td>object|array|string</td>
 *     <td>The file content is represented as json</td>
 *   </tr>
 *   <tr>
 *     <td>'text'</td>
 *     <td>string</td>
 *     <td>The file content is represented through the string</td>
 *   </tr>
 *   <tr>
 *     <td>'base64'</td>
 *     <td>string</td>
 *     <td>The file content as base64 encoded string</td>
 *   </tr>
 *   <tr>
 *     <td>'data-url'</td>
 *     <td>string</td>
 *     <td>A data url which represents the file content</td>
 *   </tr>
 * </table>
 *
 *
 * @alias binding.File
 */

var File = function () {
  babelHelpers.createClass(File, [{
    key: 'id',

    /**
     * The complete id of the file, including folder and name
     * @type string
     */
    get: function get() {
      return this._id;
    }

    /**
     * The fully url to the file, can be directly used to link the file, i.e. in link tags ot image sources
     * @type string
     */

  }, {
    key: 'url',
    get: function get() {
      if (this.isFolder) {
        throw new Error("Url can not be created for folders.");
      }
      if (!this._url) {
        this._url = this._db.createURL(this.id, this.bucket != 'www');
      }
      return this._url;
    }

    /**
     * The name of the file
     * @type string
     */

  }, {
    key: 'name',
    get: function get() {
      if (!this._name) this._name = this._id.substring(this._id.lastIndexOf('/', this._id.length - 2) + 1);
      return this._name;
    }

    /**
     * The mimeType of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
     * @type string
     */

  }, {
    key: 'mimeType',
    get: function get() {
      if (this.isFolder) {
        throw new Error("A folder has no mimeType");
      }
      this._checkAvailable();
      return this._mimeType;
    }

    /**
     * The current file acl, only accessible after fetching the metadata or downloading/uploading/providing the file
     * @type string
     */

  }, {
    key: 'acl',
    get: function get() {
      this._checkAvailable();
      return this._acl;
    }

    /**
     * The last modified date of the file, only accessible after fetching the metadata or downloading/uploading/providing the eTag
     * @type Date
     */

  }, {
    key: 'lastModified',
    get: function get() {
      if (this.isFolder) {
        throw new Error("A folder has no lastModified");
      }
      this._checkAvailable();
      return this._lastModified;
    }

    /**
     * The creation date of the file, only accessible after fetching the metadata or downloading/uploading/providing the eTag
     * @type Date
     */

  }, {
    key: 'createdAt',
    get: function get() {
      if (this.isFolder) {
        throw new Error("A folder has no creation date");
      }
      this._checkAvailable();
      return this._createdAt;
    }

    /**
     * The eTag of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
     * @type string
     */

  }, {
    key: 'eTag',
    get: function get() {
      if (this.isFolder) {
        throw new Error("A folder has no eTag");
      }
      this._checkAvailable();
      return this._eTag;
    }

    /**
     * The size of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
     * @type number
     */

  }, {
    key: 'size',
    get: function get() {
      if (this.isFolder) {
        throw new Error("A folder has no size");
      }
      this._checkAvailable();
      return this._size;
    }
  }, {
    key: 'bucket',
    get: function get() {
      return this.id.substring(LEN + 1, this.id.indexOf('/', LEN + 1));
    }
  }, {
    key: 'key',
    get: function get() {
      return this.id.substring(this.id.indexOf('/', LEN + 1) + 1);
    }

    /**
     * The full path of the file.
     * @type string
     */

  }, {
    key: 'path',
    get: function get() {
      return this.id.substring(LEN);
    }

    /**
     * The parent folder of the file.
     * @type string
     */

  }, {
    key: 'parent',
    get: function get() {
      return this.id.substring(LEN, this.id.lastIndexOf('/', this.id.length - 2));
    }

    /**
     * Indicates if the metadata are loaded.
     * @type boolean
     */

  }, {
    key: 'isMetadataLoaded',
    get: function get() {
      return this._available;
    }

    /**
     * Creates a new file object which represents the a file at the given id. Data are provided to the constructor will
     * be uploaded by invoking {@link upload()}
     * @param {object|string} fileOptions The fileOptions used to create a new file object, or just the id of the
     * file object
     * @param {string=} fileOptions.id The id of the file.
     * @param {string=} fileOptions.name The filename without the id. If omitted and data is provided as a file object, the
     * {@link File#name} will be used otherwise a uuid will be generated.
     * @param {string} [fileOptions.parent="/www"] The parent folder which contains the file
     * @param {string} [fileOptions.path="/www"] The full path of the file. You might either specifiy the path of the file or a combination of parent and file name.
     * @param {string|Blob|File|ArrayBuffer|json=} fileOptions.data The initial file content, which will be uploaded by
     * invoking {@link #upload} later on.
     * @param {string=} fileOptions.type A optional type hint used to correctly interpret the provided data
     * @param {string=} fileOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
     * it is a file object, blob or data-url
     * @param {number=} fileOptions.size The size of the file content in bytes
     * @param {string=} fileOptions.eTag The optional current ETag of the file
     * @param {string|Date=} fileOptions.lastModified The optional last modified date
     * @param {Acl=} fileOptions.acl The file acl which will be set, if the file is uploaded afterwards
     */

  }]);

  function File(fileOptions) {
    babelHelpers.classCallCheck(this, File);

    fileOptions = fileOptions || {};

    this._available = false;

    if (Object(fileOptions) instanceof String) {
      var id = fileOptions;
      var nameSeparator = id.indexOf('/', '/file/'.length);
      if (nameSeparator == -1 || id.indexOf('/file/') != 0) {
        throw new Error('Invalid file reference ' + id);
      }

      this._id = id;
    } else if (fileOptions.id) {
      this._id = fileOptions.id;
      this._setMetadata(fileOptions);
    } else {
      var path = void 0;
      if (fileOptions.path) {
        path = fileOptions.path;
      } else {
        var parent = fileOptions.parent || '/www';
        if (parent.charAt(parent.length - 1) != '/') parent = parent + '/';

        if (parent.length < 3) {
          throw new Error('Invalid parent name: ' + parent);
        }

        var name = fileOptions.name || fileOptions.data && fileOptions.data.name || uuid();
        path = parent + name;
      }

      if (path.charAt(0) != '/') path = '/' + path;

      if (path.indexOf('//') != -1 || path.length < 3) throw new Error('Invalid path: ' + path);

      this._id = PREFIX + path;
      this._setMetadata(fileOptions);
    }

    /**
     * Specifies whether this file is a folder.
     * @type {boolean}
     */
    this.isFolder = this._id.charAt(this._id.length - 1) == '/';
  }

  /**
   * Uploads the file content which was provided in the constructor or by uploadOptions.data
   * @param {object=} uploadOptions The upload options
   * @param {string|Blob|File|ArrayBuffer|json=} uploadOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} uploadOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} uploadOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} uploadOptions.eTag The optional current ETag of the file
   * @param {string=} uploadOptions.lastModified The optional last modified date
   * @param {Acl=} uploadOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @param {boolean} [uploadOptions.force=false] force the upload and overwrite any existing files without validating it
   * @param {connector.Message~progressCallback} [uploadOptions.progress] listen to progress changes during upload
   * @param {binding.File~fileCallback=} doneCallback The callback is invoked after the upload succeed successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<binding.File>} A promise which will be fulfilled with this file object where the metadata is updated
   */

  File.prototype.upload = function upload(uploadOptions, doneCallback, failCallback) {
    var _this = this;

    uploadOptions = uploadOptions || {};

    if (this.isFolder) {
      throw new Error("A folder cannot be uploaded");
    }

    this._setMetadata(uploadOptions);

    var uploadMessage = new message.UploadFile(this.bucket, this.key).entity(this._data, this._type).acl(this._acl);

    uploadMessage.progress(uploadOptions.progress);

    if (this._size) {
      uploadMessage.contentLength(this._size);
    }

    if (this._mimeType) {
      uploadMessage.mimeType(this._mimeType);
    }

    this._conditional(uploadMessage, uploadOptions);

    this._db.addToBlackList(this.id);
    return this._db.send(uploadMessage).then(function (response) {
      _this._data = null;
      _this._type = null;

      _this.fromJSON(response.entity);
      return _this;
    }).then(doneCallback, failCallback);
  };

  /**
   * Download a file and providing it in the requested type
   * @param {object=} downloadOptions The download options
   * @param {string} [downloadOptions.type="blob"] The type used to provide the file
   * @param {string} [downloadOptions.refresh=false] Indicates to make a revalidation request and not use the cache
   * @param {binding.File~downloadCallback=} doneCallback The callback is invoked after the download succeed successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<string|Blob|File|ArrayBuffer|json>} A promise which will be fulfilled with the downloaded file content
   */

  File.prototype.download = function download(downloadOptions, doneCallback, failCallback) {
    var _this2 = this;

    downloadOptions = downloadOptions || {};

    if (this.isFolder) {
      throw new Error("A folder cannot be downloaded");
    }

    var type = downloadOptions.type || 'blob';

    var downloadMessage = new message.DownloadFile(this.bucket, this.key).responseType(type);

    this._db.ensureCacheHeader(this.id, downloadMessage, downloadOptions.refresh);

    return this._db.send(downloadMessage).then(function (response) {
      _this2._db.addToWhiteList(_this2.id);
      _this2._fromHeaders(response.headers);
      return response.entity;
    }, function (e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    }).then(doneCallback, failCallback);
  };

  /**
   * Deletes a file
   * @param {object=} deleteOptions The delete options
   * @param {boolean} [deleteOptions.force=false] force the deletion without verifying any version
   * @param {binding.File~deleteCallback=} doneCallback The callback is invoked after the deletion succeed successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<binding.File|binding.File[]>} A promise which will be fulfilled with this file object,
   * or with a list of all deleted files, if this file is an folder
   */

  File.prototype.delete = function _delete(deleteOptions, doneCallback, failCallback) {
    var _this3 = this;

    deleteOptions = deleteOptions || {};

    var deleteMessage = new message.DeleteFile(this.bucket, this.key);
    this._conditional(deleteMessage, deleteOptions);

    if (!this.isFolder) this._db.addToBlackList(this.id);

    return this._db.send(deleteMessage).then(function (response) {
      if (!_this3.isFolder) return _this3;

      return response.entity.map(function (fileId) {
        return _this3._db.File(fileId);
      });
    }).then(doneCallback, failCallback);
  };

  File.prototype._conditional = function _conditional(message, options) {
    if (!options.force) {
      if (this._lastModified) message.ifUnmodifiedSince(this._lastModified);
      if (this._eTag) message.ifMatch(this._eTag);
      if (!this._lastModified && !this._eTag) message.ifNoneMatch('*');
    }
  };

  /**
   * Gets the file metadata of a file
   * @param {Object=} options The load metadata options
   * @param {Object} [options.refresh=false] Force a revalidation while fetching the metadata
   * @param {binding.File~fileCallback=} doneCallback The callback is invoked after the metadata is fetched
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<binding.File>} A promise which will be fulfilled with this file
   */

  File.prototype.loadMetadata = function loadMetadata(options, doneCallback, failCallback) {
    var _this4 = this;

    options = options || {};
    //TODO: make options really optional
    if (this.isFolder) {
      throw new Error("A folder has no matadata");
    }

    var msg = new message.GetFileMetadata(this.bucket, this.key);
    this._db.ensureCacheHeader(this.id, msg, options.refresh);
    return this._db.send(msg).then(function (response) {
      // do not white list the file, because head-request does not revalidate the cache.
      _this4._fromHeaders(response.headers);
      return _this4;
    }, function (e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    }).then(doneCallback, failCallback);
  };

  /**
   * Updates the matadata of this file.
   * @param {Object=} options The save metadata options
   * @param {boolean} [options.force=false] force the update and overwrite the existing metadata without validating it
   * @param {binding.File~fileCallback=} doneCallback The callback is invoked after the metadata is saved
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<binding.File>} A promise which will be fulfilled with this file
   */

  File.prototype.saveMetadata = function saveMetadata(options, doneCallback, failCallback) {
    var _this5 = this;

    options = options || {};

    var metadata = this.toJSON();
    metadata.id = this._id;

    var msg = new message.UpdateFileMetadata(this.bucket, this.key).entity(metadata);

    this._conditional(msg, options);

    return this._db.send(msg).then(function (response) {
      _this5.fromJSON(response.entity);
      return _this5;
    }).then(doneCallback, failCallback);
  };

  /**
   * Validates and sets the file metadata based on the given options
   * @param {Object} options
   * @private
   */

  File.prototype._setMetadata = function _setMetadata(options) {
    var data = options.data;
    var type = options.type;
    var eTag = options.eTag;
    var acl = options.acl;
    var size = options.size;
    var mimeType = options.mimeType;
    var lastModified = options.lastModified;

    if (!data) {
      this._available = false;
    } else {
      if (typeof Blob !== "undefined" && data instanceof Blob) {
        mimeType = mimeType || data.type;
      } else if (type == 'data-url') {
        var match = data.match(/^data:(.+?)(;base64)?,.*$/);
        mimeType = mimeType || match[1];
      }

      this._data = data;
      this._type = type;
      this._size = size;

      this._mimeType = mimeType;
      this._acl = acl || this._acl || new Acl();
      this._available = true;
    }

    this._eTag = eTag || this._eTag;

    if (lastModified) {
      this._lastModified = new Date(lastModified);
    }
  };

  File.prototype._fromHeaders = function _fromHeaders(headers) {
    this.fromJSON({
      eTag: headers.etag ? headers.etag.substring(1, headers.etag.length - 1) : null,
      lastModified: headers['last-modified'],
      createdAt: headers['baqend-created-at'],
      mimeType: headers['content-type'],
      acl: headers['baqend-acl'] && JSON.parse(headers['baqend-acl']),
      contentLength: +headers['baqend-size']
    });
  };

  File.prototype.fromJSON = function fromJSON(metadata) {
    if (metadata.mimeType) this._mimeType = metadata.mimeType;

    if (metadata.lastModified) this._lastModified = new Date(metadata.lastModified);

    if (metadata.createdAt) this._createdAt = new Date(metadata.createdAt);

    if (metadata.eTag) this._eTag = metadata.eTag;

    this._acl = this._acl || new Acl();
    if (metadata.acl) this._acl.fromJSON(metadata.acl);

    if (metadata.contentLength) this._size = metadata.contentLength;

    this._available = true;
  };

  File.prototype.toJSON = function toJSON() {
    var result = {
      mimeType: this._mimeType,
      eTag: this._eTag,
      acl: this._acl,
      contentLength: this._size
    };

    if (this._lastModified) {
      result.lastModified = this._lastModified.toISOString();
    }

    if (this._createdAt) {
      result.createdAt = this._createdAt.toISOString();
    }
    return result;
  };

  File.prototype._checkAvailable = function _checkAvailable() {
    if (!this._available) {
      throw new error.PersistentError('The file metadata of ' + this.id + ' is not available.');
    }
  };

  /**
   * The database connection to use
   * @member {EntityManager} _db
   * @private
   */

  return File;
}();

/**
 * The file callback is called, when the asynchronous operation completes successfully
 * @callback binding.File~fileCallback
 * @param {binding.File} file The updated file metadata
 * @return {any} A Promise, result or undefined
 */

/**
 * The download callback is called, when the asynchronous download completes successfully
 * @callback binding.File~downloadCallback
 * @param {string|Blob|File|ArrayBuffer|json} data The download file content in the requested format
 * @return {any} A Promise, result or undefined
 */

/**
 * The delete callback is called, when the asynchronous deletion completes successfully
 * @callback binding.File~deleteCallback
 * @param {binding.File} data The file metadata
 * @return {any} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.File~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {any} A Promise, result or undefined
 */

module.exports = File;

},{"1":1,"25":25,"33":33,"35":35,"77":77}],14:[function(_dereq_,module,exports){
"use strict";

var Factory = _dereq_(12);
var File = _dereq_(13);
var message = _dereq_(35);
var Permission = _dereq_(68);

/**
 * @class binding.FileFactory
 * @extends binding.Factory<binding.File>
 *
 * @param {Object=} properties initial properties to set on the file
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {binding.File} The new managed instance
 */
var FileFactory = Factory.extend( /** @lends binding.FileFactory.prototype */{

  /**
   * Creates a new FileFactory for the given type
   * @param {EntityManager} db
   * @return {binding.FileFactory} A new file factory
   * @static
   */
  create: function create(db) {
    //invoke super method
    var factory = Factory.create.call(this, File);
    factory._db = db;
    return factory;
  },

  /**
   * Creates a new file
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {binding.File} A new created file
   */
  newInstance: function newInstance(args) {
    var instance = Factory.newInstance.call(this, args);
    instance._db = this._db;
    return instance;
  },

  /**
   * Updates the metadata of the root file directory formally the file "bucket"
   * @param {string} bucket The name of the root file directory
   * @param {Object<string, util.Permission>} metadata The new metadata for the bucket
   * @param {util.Permission=} metadata.load The load permission which grants read access to all stored
   * files under the specified bucket
   * @param {util.Permission=} metadata.insert The insert permission which is required to insert new
   * files into the bucket
   * @param {util.Permission=} metadata.update The update permission which is required to update existing
   * files within the bucket
   * @param {util.Permission=} metadata.delete The delete permission which is required to delete existing
   * files within the bucket
   * @param {util.Permission=} metadata.query The query permission which is required to list all files
   * within a bucket
   * @param {binding.FileFactory~bucketMetadataCallback=} doneCallback Invoked if the operation succeeds
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<void>} A promise which will fulfilled with the updated metadata
   */
  saveMetadata: function saveMetadata(bucket, metadata, doneCallback, failCallback) {
    var msg = new message.SetFileBucketMetadata(bucket, metadata);
    return this._db.send(msg).then(doneCallback, failCallback);
  },

  /**
   * Gets the metadata of the root folder (formally the file "bucket")
   * @param {string} bucket The name of the root file directory
   * @param {Object=} options The load metadata options
   * @param {Object} [options.refresh=false] Force a revalidation while fetching the metadata
   * @param {binding.FileFactory~bucketMetadataCallback=} doneCallback The callback is invoked after the metadata is fetched
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Object<string, util.Permission>>} A promise which will be fulfilled with the bucket acls
   */
  loadMetadata: function loadMetadata(bucket, options, doneCallback, failCallback) {
    options = options || {};

    var msg = new message.GetFileBucketMetadata(bucket);
    // this._db.ensureCacheHeader(this.id, msg, options.refresh);
    // do not white list the file, because head-request does not revalidate the cache.
    return this._db.send(msg).then(function (response) {
      var result = {};
      Permission.BASE_PERMISSIONS.forEach(function (key) {
        result[key] = Permission.fromJSON(response.entity[key] || {});
      });
      return result;
    }, function (e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    }).then(doneCallback, failCallback);
  },

  /**
   * Lists all the buckets.
   * @param {binding.FileFactory~fileListCallback=} doneCallback The callback is invoked with the listed buckets
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Array<binding.File>>} The listed buckets.
   */
  listBuckets: function listBuckets(doneCallback, failCallback) {
    var _this = this;

    return this._db.send(new message.ListBuckets()).then(function (response) {
      return response.entity.map(function (bucket) {
        return _this.new(bucket + '/');
      });
    }).then(doneCallback, failCallback);
  },

  /**
   * Lists the files (and folders) in the given folder.
   *
   * @param {binding.File|string} folder The folder/path to list.
   * @param {binding.File} start The file/folder from where to start listing (not included)
   * @param {number} count The maximum number of files to return.
   * @param {binding.FileFactory~fileListCallback=} doneCallback The callback is invoked with the listed files
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Array<binding.File>>} The listed files/folders.
   */
  listFiles: function listFiles(folder, start, count, doneCallback, failCallback) {
    var _this2 = this;

    if (Object(folder) instanceof String) {
      if (folder.charAt(folder.length - 1) != '/') {
        folder += '/';
      }
      folder = this.new({ path: folder });
    }

    var path = folder.key;
    var bucket = folder.bucket;
    start = start ? start.key : null;
    return this._db.send(new message.ListFiles(bucket, path, start, count)).then(function (response) {
      return response.entity.map(function (file) {
        return _this2.new(file);
      });
    }).then(doneCallback, failCallback);
  }

  /**
   * Creates a new file object which represents the a file at the given id. Data are provided to the constructor will
   * be uploaded by invoking {@link upload()}
   * @param {object|string} fileOptions The fileOptions used to create a new file object, or just the id of the
   * file object
   * @param {string=} fileOptions.name The filename without the id. If omitted and data is provided as a file object, the
   * {@link File#name} will be used otherwise a uuid will be generated.
   * @param {string} [fileOptions.parent="/www"] The parent folder which contains the file
   * @param {string|Blob|File|ArrayBuffer|json=} fileOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} fileOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} fileOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} fileOptions.eTag The optional current ETag of the file
   * @param {string=} fileOptions.lastModified The optional last modified date
   * @param {Acl=} fileOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @return {binding.File} A new file instance
   *
   * @function
   * @name new
   * @memberOf binding.FileFactory.prototype
   */

});

/**
 * The list files callback is called, with the bucket metadata
 * @callback binding.FileFactory~bucketMetadataCallback
 * @param {Object<string, util.Permission>} bucketMetadata the bucket metadata
 * @return {any} A Promise, result or undefined
 */

/**
 * The list files callback is called, with the loaded files
 * @callback binding.FileFactory~fileListCallback
 * @param {Array<binding.File>} files The listed files
 * @return {any} A Promise, result or undefined
 */

module.exports = FileFactory;

},{"12":12,"13":13,"35":35,"68":68}],15:[function(_dereq_,module,exports){
"use strict";

var Metadata = _dereq_(66);

/**
 * @alias binding.Managed
 */

var Managed = function () {

  /**
   * Initialize the given instance
   * @param {binding.Managed} instance The managed instance to initialize
   * @param {Object=} properties The optional properties to set on the instance
   */
  Managed.init = function init(instance, properties) {
    var type = instance.constructor.__baqendType__;
    if (type) {
      Object.defineProperty(instance, '_metadata', {
        value: Metadata.create(type, instance),
        configurable: true
      });
    }

    if (properties) Object.assign(instance, properties);
  };

  /**
   * Creates a subclass of this class
   * @param {Class<*>} childClass
   * @return {Class<*>} The extended child class
   */

  Managed.extend = function extend(childClass) {
    childClass.prototype = Object.create(this.prototype, {
      constructor: {
        value: childClass,
        configurable: true,
        writable: true
      }
    });
    childClass.extend = Managed.extend;
    return childClass;
  };

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */

  function Managed(properties) {
    babelHelpers.classCallCheck(this, Managed);

    Managed.init(this, properties);
  }

  return Managed;
}();

Object.defineProperties(Managed.prototype, /** @lends binding.Managed.prototype */{
  /**
   * Converts the managed object to an JSON-Object.
   * @return {json} JSON-Object
   * @method
   */
  toJSON: {
    value: function toJSON() {
      return this._metadata.type.toJsonValue(this._metadata, this, {});
    }
  }
});

/**
 * Contains the metadata of this managed object
 * @type util.Metadata
 * @name _metadata
 * @memberOf binding.Managed
 * @private
 */

module.exports = Managed;

},{"66":66}],16:[function(_dereq_,module,exports){
"use strict";

var Factory = _dereq_(12);
var Managed = _dereq_(15);

/**
 * @class binding.ManagedFactory<T>
 * @extends binding.Factory<T>
 *
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} args Additional constructor params passed through the type constructor
 * @return {T} The new managed instance
 */
var ManagedFactory = Factory.extend( /** @lends binding.ManagedFactory<T>.prototype */{

  /**
   * Creates a new ManagedFactory for the given type
   * @param {metamodel.ManagedType} managedType The metadata of type T
   * @param {EntityManager} db
   * @return {binding.ManagedFactory<*>} A new object factory to created instances of T
   * @static
   * @ignore
   */
  create: function create(managedType, db) {
    //invoke super method
    var factory = Factory.create.call(this, managedType.typeConstructor);
    factory.methods = factory.prototype;

    factory._managedType = managedType;
    factory._db = db;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {T} A new created instance of T
   */
  newInstance: function newInstance(args) {
    var instance = args ? Factory.newInstance.call(this, args) : this._managedType.create(args);
    instance._metadata.db = this._db;
    return instance;
  },

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param {json} json
   * @returns {T} instance
   */
  fromJSON: function fromJSON(json) {
    var instance = this.newInstance();
    var metadata = instance._metadata;
    return this._managedType.fromJsonValue(metadata, json, instance, {});
  },

  /**
   * Adds methods to instances of this factories type
   * @param {Object<string, Function>} methods The methods to add
   */
  addMethods: function addMethods(methods) {
    Object.assign(this.methods, methods);
  },

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {Function} fn The Method to add
   */
  addMethod: function addMethod(name, fn) {
    this.methods[name] = fn;
  }

  /**
   * Methods that are added to object instances
   * This property is an alias for this factory type prototype
   * @name methods
   * @type {Object<string, Function>}
   * @memberOf binding.ManagedFactory<T>.prototype
   */

  /**
   * The managed type of this factory
   * @name _managedType
   * @type metamodel.ManagedType
   * @protected
   * @memberOf binding.ManagedFactory<T>.prototype
   */

  /**
   * The owning EntityManager where this factory belongs to
   * @name _db
   * @type EntityManager
   * @protected
   * @memberOf binding.ManagedFactory<T>.prototype
   */

  /**
   * Creates a new instance of the of this type
   * @function
   * @name new
   * @param {Object<string, *>} properties Additional properties which will be applied to the created instance
   * @return {T} A new created instance of this class
   * @memberOf binding.ManagedFactory<T>.prototype
   */

});

module.exports = ManagedFactory;

},{"12":12,"15":15}],17:[function(_dereq_,module,exports){
"use strict";

var Entity = _dereq_(10);
var User = _dereq_(18);

/**
 * @alias binding.Role
 * @extends binding.Entity
 */

var Role = function (_Entity) {
  babelHelpers.inherits(Role, _Entity);

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */
  function Role(properties) {
    babelHelpers.classCallCheck(this, Role);
    return babelHelpers.possibleConstructorReturn(this, _Entity.call(this, properties));
  }

  return Role;
}(Entity);

Object.defineProperties(Role.prototype, /** @lends binding.Role.prototype */{
  /**
   * Test if the given user has this role
   * @param {model.User} user The user to check
   * @return {boolean} <code>true</code> if the given user has this role,
   * otherwise <code>false</code>
   * @method
   */
  hasUser: {
    value: function hasUser(user) {
      return this.users && this.users.has(user);
    }
  },

  /**
   * Add the given user to this role
   * @param {model.User} user The user to add
   * @method
   */
  addUser: {
    value: function addUser(user) {
      if (user instanceof User) {
        if (!this.users) this.users = new Set();

        this.users.add(user);
      } else {
        throw new Error('Only user instances can be added to a role.');
      }
    }
  },

  /**
   * Remove the given user from this role
   * @param {model.User} user The user to remove
   * @method
   */
  removeUser: {
    value: function removeUser(user) {
      if (user instanceof User) {
        if (this.users) this.users.delete(user);
      } else {
        throw new Error('Only user instances can be removed from a role.');
      }
    }

    /**
     * A set of users which have this role
     * @type Set<model.User>
     * @name users
     * @memberOf binding.Role.prototype
     */

    /**
     * The name of the role
     * @type string
     * @name name
     * @memberOf binding.Role.prototype
     */
  } });

module.exports = Role;

},{"10":10,"18":18}],18:[function(_dereq_,module,exports){
"use strict";

var Entity = _dereq_(10);

/**
 * @alias binding.User
 * @extends binding.Entity
 */

var User = function (_Entity) {
  babelHelpers.inherits(User, _Entity);

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */
  function User(properties) {
    babelHelpers.classCallCheck(this, User);
    return babelHelpers.possibleConstructorReturn(this, _Entity.call(this, properties));
  }

  return User;
}(Entity);

Object.defineProperties(User.prototype, /** @lends binding.User.prototype */{

  /**
   * Change the password of the given user
   *
   * @param {string} currentPassword Current password of the user
   * @param {string} password New password of the user
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   * @method
   */
  newPassword: {
    value: function newPassword(currentPassword, password, doneCallback, failCallback) {
      return this._metadata.db.newPassword(this.username, currentPassword, password).then(doneCallback, failCallback);
    }

    /**
     * The users username or email address
     * @type string
     * @name username
     * @memberOf binding.User.prototype
     */

    /**
     * Indicates if the user is currently inactive, which disallow user login
     * @type boolean
     * @name inactive
     * @memberOf binding.User.prototype
     */
  } });

module.exports = User;

},{"10":10}],19:[function(_dereq_,module,exports){
"use strict";

var EntityFactory = _dereq_(11);

/**
 * @class binding.UserFactory
 * @extends binding.EntityFactory<model.User>
 *
 * Creates a new instance of the managed type of this factory
 * @param {Object=} properties initial properties to set on the instance
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {model.User} The new managed instance
 */
var UserFactory = EntityFactory.extend( /** @lends binding.UserFactory.prototype */{
  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   * @type model.User
   */
  get me() {
    return this._db.me;
  },

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param {string|model.User} user The username as a string or a <User> Object, which must contain the username.
   * @param {string} password The password for the given user
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default logs the user in after a successful registration and keeps the user logged in over multiple sessions
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>} The created user object, for the new registered user.
   */
  register: function register(user, password, loginOption, doneCallback, failCallback) {
    if (loginOption instanceof Function) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    user = Object(user) instanceof String ? this.fromJSON({ username: user }) : user;
    return this._db.register(user, password, loginOption === undefined ? true : loginOption).then(doneCallback, failCallback);
  },

  /**
   * Log in the user with the given username and password and starts a user session
   * @param {string} username The username of the user
   * @param {string} password The password of the user
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   */
  login: function login(username, password, loginOption, doneCallback, failCallback) {
    if (loginOption instanceof Function) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    return this._db.login(username, password, loginOption === undefined ? true : loginOption).then(doneCallback, failCallback);
  },

  /**
   * Log in the user assiciated with the given token and starts a user session.
   * @param {string} token The user token.
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   */
  loginWithToken: function loginWithToken(token, loginOption, doneCallback, failCallback) {
    if (loginOption instanceof Function) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    this._db.token = token;
    return this._db.renew(loginOption).then(doneCallback, failCallback);
  },

  /**
   * Log out the current logged in user and ends the active user session
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<*>}
   */
  logout: function logout(doneCallback, failCallback) {
    return this._db.logout().then(doneCallback, failCallback);
  },

  /**
   * Change the password of the given user
   *
   * @param {string} username Username to identify the user
   * @param {string} password Current password of the user
   * @param {string} newPassword New password of the user
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   */
  newPassword: function newPassword(username, password, _newPassword, doneCallback, failCallback) {
    if (typeof _newPassword !== 'string') {
      // detect signature newPassword(token, newPassword, [loginOption=true][, doneCallback[, failCallback]])
      var arg = arguments;
      var token = arg[0],
          newPassword = arg[1],
          loginOption = arg[2],
          _doneCallback = arg[3],
          _failCallback = arg[4];

      if (loginOption instanceof Function) {
        _failCallback = _doneCallback;
        _doneCallback = loginOption;
        loginOption = true;
      }

      return this._db.newPasswordWithToken(token, newPassword, loginOption).then(_doneCallback, _failCallback);
    } else {
      return this._db.newPassword(username, password, _newPassword).then(doneCallback, failCallback);
    }
  },

  /**
   * Sends an email with a link to reset the password for the given username. The username must be an email address.
   *
   * @param {string} username Username (email) to identify the user
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @returns {Promise<*>}
   */
  resetPassword: function resetPassword(username, doneCallback, failCallback) {
    return this._db.resetPassword(username).then(doneCallback, failCallback);
  }

  /**
   * Change the password of a user, which will be identified by the given token from the reset password e-mail.
   *
   * @see resetPassword
   * @param {string} token Token from the reset password e-mail
   * @param {string} newPassword New password of the user
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   *
   * @function
   * @name newPassword
   * @memberOf binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the Google login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/google</code> and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {string} clientID
   * @param {Object=} options
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {string} [options.title="Login"] sets the title of the popup window
   * @param {number} [options.width=585] defines the width of the popup window
   * @param {number} [options.height=545] defines the height of the popup window
   * @param {string} [options.scope="email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {number} [options.timeout=5 * 60 * 1000]
   * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
   * i.e. this site is closed to open the providers login page. Once the login is finished this redirect url will be opened
   * with the logged-in user's token attached.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   *
   * @function
   * @name loginWithGoogle
   * @memberOf binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the Facebook login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/facebook and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {string} clientID
   * @param {Object=} options
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {string} [options.title="Login"] sets the title of the popup window
   * @param {number} [options.width=1140] defines the width of the popup window
   * @param {number} [options.height=640] defines the height of the popup window
   * @param {string} [options.scope="email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {number} [options.timeout=5 * 60 * 1000]
   * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
   * i.e. this site is closed to open the providers login page. Once the login is finished this redirect url will be opened
   * with the logged-in user's token attached.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   *
   * @function
   * @name loginWithFacebook
   * @memberOf binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the GitHub login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/github and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {string} clientID
   * @param {Object=} options
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {string} [options.title="Login"] sets the title of the popup window
   * @param {number} [options.width=1040] defines the width of the popup window
   * @param {number} [options.height=580] defines the height of the popup window
   * @param {string} [options.scope="user:email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {number} [options.timeout=5 * 60 * 1000]
   * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
   * i.e. this site is closed to open the providers login page. Once the login is finished this redirect url will be opened
   * with the logged-in user's token attached.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   *
   * @function
   * @name loginWithGitHub
   * @memberOf binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the Twitter login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/twitter and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {string} clientID
   * @param {Object=} options
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {string} [options.title="Login"] sets the title of the popup window
   * @param {number} [options.width=740] defines the width of the popup window
   * @param {number} [options.height=730] defines the height of the popup window
   * @param {number} [options.timeout=5 * 60 * 1000]
   * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
   * i.e. this site is closed to open the providers login page. Once the login is finished this redirect url will be opened
   * with the logged-in user's token attached.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   *
   * @function
   * @name loginWithTwitter
   * @memberOf binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the LinkedIn login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/linkedin and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {string} clientID
   * @param {Object=} options
   * @param {boolean|binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {string} [options.title="Login"] sets the title of the popup window
   * @param {number} [options.width=630] defines the width of the popup window
   * @param {number} [options.height=530] defines the height of the popup window
   * @param {string} [options.scope=""] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {number} [options.timeout=5 * 60 * 1000]
   * @param {string} [options.redirect=""] if set this changes the oauth behaviour to redirect mode,
   * i.e. this site is closed to open the providers login page. Once the login is finished this redirect url will be opened
   * with the logged-in user's token attached.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<model.User>}
   *
   * @function
   * @name loginWithLinkedIn
   * @memberOf binding.UserFactory.prototype
   */

  /**
   * Creates a new user object
   * @function
   * @name new
   * @param {Object<string, *>} properties Additional properties which will be applied to the created instance
   * @return {model.User} A new created user
   * @memberOf binding.UserFactory.prototype
   */

});

/**
 * @alias binding.UserFactory.LoginOption
 * @enum {number}
 */
UserFactory.LoginOption = {
  /**
   * Do not login the user after a successful registration
   */
  NO_LOGIN: -1,
  /**
   * Login in after a successful registration and keep the token in a nonpermanent storage, i.e SessionStorage
   */
  SESSION_LOGIN: 0,
  /**
   * Login in after a successful registration and keep the token in a persistent storage, i.e LocalStorage
   */
  PERSIST_LOGIN: 1
};

/**
 * @alias binding.UserFactory.DefaultOptions
 * @property {Object} oauth default properties
 * @property {Object} oauth.google default oauth properties for Google
 * @property {Object} oauth.facebook default oauth properties for Facebook
 * @property {Object} oauth.github default oauth properties for GitHub
 * @property {Object} oauth.twitter default oauth properties for Twitter
 * @property {Object} oauth.linkedin default oauth properties for LinkedIn
 */
UserFactory.DefaultOptions = {
  google: {
    width: 585,
    height: 545,
    scope: 'email'
  },
  facebook: {
    width: 1140,
    height: 640,
    scope: 'email'
  },
  github: {
    width: 1040,
    height: 580,
    scope: 'user:email'
  },
  twitter: {
    width: 740,
    height: 730
  },
  linkedin: {
    width: 630,
    height: 530,
    scope: ''
  }
};

["Google", "Facebook", "GitHub", "Twitter", "LinkedIn"].forEach(function (name) {
  UserFactory["loginWith" + name] = function (clientID, options, doneCallback, failCallback) {
    //noinspection JSPotentiallyInvalidUsageOfThis
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    options = Object.assign({}, UserFactory.DefaultOptions[name.toLowerCase()], options || {});

    return this._db.loginWithOAuth(name, clientID, options).then(doneCallback, failCallback);
  };
});

module.exports = UserFactory;

},{"11":11}],20:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace binding
 */

exports.Accessor = _dereq_(7);
exports.Enhancer = _dereq_(9);
exports.Factory = _dereq_(12);
exports.ManagedFactory = _dereq_(16);
exports.EntityFactory = _dereq_(11);
exports.UserFactory = _dereq_(19);
exports.DeviceFactory = _dereq_(8);
exports.FileFactory = _dereq_(14);
exports.Managed = _dereq_(15);
exports.Entity = _dereq_(10);
exports.Role = _dereq_(17);
exports.User = _dereq_(18);
exports.File = _dereq_(13);

},{"10":10,"11":11,"12":12,"13":13,"14":14,"15":15,"16":16,"17":17,"18":18,"19":19,"7":7,"8":8,"9":9}],21:[function(_dereq_,module,exports){
"use strict";

var atob = _dereq_(73).atob;

/**
 * @alias caching.BloomFilter
 */

var BloomFilter = function () {
  /**
   * @param {Object} rawBF The raw Bloom filter.
   * @param {number} rawBF.m The raw Bloom filter bits.
   * @param {number} rawBF.h The raw Bloom filter hashes.
   * @param {string} rawBF.b The Base64-encoded raw Bloom filter bytes.
   */
  function BloomFilter(rawBF) {
    babelHelpers.classCallCheck(this, BloomFilter);

    /**
     * The raw bytes of this Bloom filter.
     * @type string
     */
    this.bytes = atob(rawBF.b);

    /**
     * The amount of bits.
     * @type number
     */
    this.bits = rawBF.m;

    /**
     * The amount of hashes.
     * @type number
     */
    this.hashes = rawBF.h;

    /**
     * The creation timestamp of this bloom filter.
     * @type number
     */
    this.creation = Date.now();
  }

  /**
   * Returns whether this Bloom filter contains the given element.
   *
   * @param {string} element The element to check if it is contained.
   * @return {boolean} True, if the element is contained in this Bloom filter.
   */

  BloomFilter.prototype.contains = function contains(element) {
    for (var _iterator = BloomFilter._getHashes(element, this.bits, this.hashes), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var hash = _ref;

      if (!this._isSet(hash)) {
        return false;
      }
    }
    return true;
  };

  /**
   * Checks whether a bit is set at a given position.
   *
   * @param {number} index The position index to check.
   * @return {boolean} True, if the bit is set at the given position.
   * @private
   */

  BloomFilter.prototype._isSet = function _isSet(index) {
    var pos = Math.floor(index / 8);
    var bit = 1 << index % 8;
    //Extract byte as int or NaN if out of range
    var byte = this.bytes.charCodeAt(pos);
    //Bit-wise AND should be non-zero (NaN always yields false)
    return (byte & bit) != 0;
  };

  /**
   * Returns the hases of a given element in the Bloom filter.
   *
   * @param {string} element The element to check.
   * @param {number} bits The amount of bits.
   * @param {number} hashes The amount of hashes.
   * @return {number[]} The hashes of an element in the Bloom filter.
   * @private
   */

  BloomFilter._getHashes = function _getHashes(element, bits, hashes) {
    var hashValues = new Array(this.hashes);
    var hash1 = BloomFilter._murmur3(0, element);
    var hash2 = BloomFilter._murmur3(hash1, element);
    for (var i = 0; i < hashes; i++) {
      hashValues[i] = (hash1 + i * hash2) % bits;
    }
    return hashValues;
  };

  /**
   * Calculate a Murmur3 hash.
   *
   * @param {number} seed A seed to use for the hashing.
   * @param {string} key A key to check.
   * @return {number} A hashed value of key.
   * @private
   */

  BloomFilter._murmur3 = function _murmur3(seed, key) {
    var remainder = key.length & 3;
    var bytes = key.length - remainder;
    var c1 = 0xcc9e2d51;
    var c2 = 0x1b873593;
    var h1 = void 0,
        h1b = void 0,
        k1 = void 0,
        i = void 0;
    h1 = seed;
    i = 0;

    while (i < bytes) {
      k1 = key.charCodeAt(i) & 0xff | (key.charCodeAt(++i) & 0xff) << 8 | (key.charCodeAt(++i) & 0xff) << 16 | (key.charCodeAt(++i) & 0xff) << 24;
      ++i;

      k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
      k1 = k1 << 15 | k1 >>> 17;
      k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;

      h1 ^= k1;
      h1 = h1 << 13 | h1 >>> 19;
      h1b = (h1 & 0xffff) * 5 + (((h1 >>> 16) * 5 & 0xffff) << 16) & 0xffffffff;
      h1 = (h1b & 0xffff) + 0x6b64 + (((h1b >>> 16) + 0xe654 & 0xffff) << 16);
    }

    k1 = 0;

    switch (remainder) {
      case 3:
        k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
      case 2:
        k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
      case 1:
        k1 ^= key.charCodeAt(i) & 0xff;

        k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
        k1 = k1 << 15 | k1 >>> 17;
        k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
        h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (h1 & 0xffff) * 0x85ebca6b + (((h1 >>> 16) * 0x85ebca6b & 0xffff) << 16) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = (h1 & 0xffff) * 0xc2b2ae35 + (((h1 >>> 16) * 0xc2b2ae35 & 0xffff) << 16) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
  };

  return BloomFilter;
}();

module.exports = BloomFilter;

},{"73":73}],22:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace caching
 */

exports.BloomFilter = _dereq_(21);

},{"21":21}],23:[function(_dereq_,module,exports){
"use strict";

var PersistentError = _dereq_(31);
var message = _dereq_(35);

/**
 * @alias connector.Connector
 */

var Connector = function () {

  /**
   * @param {string} host or location
   * @param {number=} port
   * @param {boolean=} secure <code>true</code> for an secure connection
   * @param {string=} basePath The basepath of the api
   * @return {connector.Connector}
   */
  Connector.create = function create(host, port, secure, basePath) {
    if (typeof location !== 'undefined') {
      if (!host) {
        host = location.hostname;
        port = Number(location.port);
      }

      if (secure === undefined) {
        secure = location.protocol == 'https:';
      }
    }

    //ensure right type
    secure = !!secure;
    if (basePath === undefined) basePath = Connector.DEFAULT_BASE_PATH;

    if (host.indexOf('/') != -1) {
      var matches = /^(https?):\/\/([^\/:]+|\[[^\]]+])(:(\d*))?(\/\w+)?\/?$/.exec(host);
      if (matches) {
        secure = matches[1] == 'https';
        host = matches[2].replace(/(\[|])/g, '');
        port = matches[4];
        basePath = matches[5] || '';
      } else {
        throw new Error('The connection uri host ' + host + ' seems not to be valid');
      }
    } else if (host != 'localhost' && /^[a-z0-9-]*$/.test(host)) {
      //handle app names as hostname
      host += Connector.HTTP_DOMAIN;
    }

    if (!port) port = secure ? 443 : 80;

    var url = Connector.toUri(host, port, secure, basePath);
    var connection = this.connections[url];

    if (!connection) {
      //check last registered connector first to simplify registering connectors
      for (var i = this.connectors.length - 1; i >= 0; --i) {
        var connector = this.connectors[i];
        if (connector.isUsable && connector.isUsable(host, port, secure, basePath)) {
          connection = new connector(host, port, secure, basePath);
          break;
        }
      }

      if (!connection) throw new Error('No connector is usable for the requested connection.');

      this.connections[url] = connection;
    }

    return connection;
  };

  Connector.toUri = function toUri(host, port, secure, basePath) {
    var uri = (secure ? 'https://' : 'http://') + (host.indexOf(':') != -1 ? '[' + host + ']' : host);
    uri += secure && port != 443 || !secure && port != 80 ? ':' + port : '';
    uri += basePath;
    return uri;
  };

  /**
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @param {string} basePath
   */

  function Connector(host, port, secure, basePath) {
    babelHelpers.classCallCheck(this, Connector);

    /**
     * @type {string}
     */
    this.host = host;

    /**
     * @type {number}
     */
    this.port = port;

    /**
     * @type {boolean}
     */
    this.secure = secure;

    /**
     * @type {string}
     */
    this.basePath = basePath;

    /**
     * the origin do not contains the basepath
     * @type {string}
     */
    this.origin = Connector.toUri(host, port, secure, "");
  }

  /**
   * @param {connector.Message} message
   * @returns {Promise<connector.Message>}
   */

  Connector.prototype.send = function send(message) {
    var _this = this;

    var response = { status: 0 };
    return new Promise(function (resolve) {
      _this.prepareRequest(message);
      _this.doSend(message, message.request, resolve);
    }).then(function (res) {
      return response = res;
    }).then(function () {
      return _this.prepareResponse(message, response);
    }).then(function () {
      message.doReceive(response);
      return response;
    }).catch(function (e) {
      response.entity = null;
      throw PersistentError.of(e);
    });
  };

  /**
   * Handle the actual message send
   * @param {connector.Message} message
   * @param {Object} request
   * @param {Function} receive
   * @abstract
   */

  Connector.prototype.doSend = function doSend(message, request, receive) {};

  /**
   * @param {connector.Message} message
   */

  Connector.prototype.prepareRequest = function prepareRequest(message) {
    var mimeType = message.mimeType();
    if (!mimeType) {
      var type = message.request.type;
      if (type == 'json') {
        message.mimeType('application/json;charset=utf-8');
      } else if (type == 'text') {
        message.mimeType('text/plain;charset=utf-8');
      }
    }

    this.toFormat(message);

    var accept = void 0;
    switch (message.responseType()) {
      case 'json':
        accept = 'application/json';
        break;
      case 'text':
        accept = 'text/*';
        break;
      default:
        accept = 'application/json,text/*;q=0.5,*/*;q=0.1';
    }

    if (!message.accept()) {
      message.accept(accept);
    }

    if (this.gzip) {
      var ifNoneMatch = message.ifNoneMatch();
      if (ifNoneMatch && ifNoneMatch !== '""' && ifNoneMatch != '*') {
        message.ifNoneMatch(ifNoneMatch.slice(0, -1) + '--gzip"');
      }
    }

    if (message.request.path == '/connect') {
      message.request.path = message.tokenStorage.signPath(this.basePath + message.request.path).substring(this.basePath.length);
      if (message.cacheControl()) {
        message.request.path += (message.tokenStorage.token ? '&' : '?') + 'BCB';
      }
    } else if (message.tokenStorage) {
      var token = message.tokenStorage.token;
      if (token) {
        message.header('authorization', 'BAT ' + token);
      }
    }
  };

  /**
   * Convert the message entity to the sendable representation
   * @param {connector.Message} message The message to send
   * @protected
   * @abstract
   */

  Connector.prototype.toFormat = function toFormat(message) {};

  /**
   * @param {connector.Message} message
   * @param {Object} response The received response headers and data
   */

  Connector.prototype.prepareResponse = function prepareResponse(message, response) {
    var _this2 = this;

    // IE9 returns status code 1223 instead of 204
    response.status = response.status == 1223 ? 204 : response.status;

    var type = void 0;
    var headers = response.headers || {};
    // some proxies send content back on 204 responses
    var entity = response.status == 204 ? null : response.entity;

    if (entity) {
      type = message.responseType();
      if (!type || response.status >= 400) {
        var contentType = headers['content-type'] || headers['Content-Type'];
        if (contentType && contentType.indexOf("application/json") > -1) {
          type = 'json';
        }
      }
    }

    if (headers.etag) {
      headers.etag = headers.etag.replace('--gzip', '');
    }

    if (message.tokenStorage) {
      var token = headers['baqend-authorization-token'] || headers['Baqend-Authorization-Token'];
      if (token) {
        message.tokenStorage.update(token);
      }
    }

    return new Promise(function (resolve) {
      resolve(entity && _this2.fromFormat(response, entity, type));
    }).then(function (entity) {
      response.entity = entity;

      if (message.request.path.indexOf('/connect') != -1 && entity) {
        _this2.gzip = !!entity.gzip;
      }
    }, function (e) {
      throw new Error('Response was not valid ' + type + ': ' + e.message);
    });
  };

  /**
   * Convert received data to the requested response entity type
   * @param {Object} response The response object
   * @param {*} entity The received data
   * @param {string} type The requested response format
   * @protected
   * @abstract
   */

  Connector.prototype.fromFormat = function fromFormat(response, entity, type) {};

  return Connector;
}();

Object.assign(Connector, /** @lends connector.Connector */{
  DEFAULT_BASE_PATH: '/v1',
  HTTP_DOMAIN: '.app.baqend.com',

  /**
   * An array of all exposed response headers
   * @type string[]
   */
  RESPONSE_HEADERS: ['baqend-authorization-token', 'content-type', 'baqend-size', 'baqend-acl', 'etag', 'last-modified', 'baqend-created-at'],

  /**
   * Array of all available connector implementations
   * @type connector.Connector[]
   */
  connectors: [],

  /**
   * Array of all created connections
   * @type Object<string,connector.Connector>
   */
  connections: {},

  /**
   * The connector will detect if gzip is supports.
   * Returns true if supported otherwise false.
   * @returns {boolean} gzip
   */
  gzip: false
});

module.exports = Connector;

},{"31":31,"35":35}],24:[function(_dereq_,module,exports){
"use strict";

var Connector = _dereq_(23);
var XMLHttpConnector = _dereq_(26);

/**
 * @alias connector.IFrameConnector
 * @extends connector.XMLHttpConnector
 */

var IFrameConnector = function (_XMLHttpConnector) {
  babelHelpers.inherits(IFrameConnector, _XMLHttpConnector);

  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @returns {boolean}
   */
  IFrameConnector.isUsable = function isUsable(host, port, secure) {
    if (typeof location == 'undefined' || typeof document == 'undefined') return false;

    var locationSecure = location.protocol == 'https:';
    var locationPort = location.port || (locationSecure ? 443 : 80);

    return location.hostname != host || locationPort != port || locationSecure != secure;
  };

  function IFrameConnector(host, port, secure, basePath) {
    babelHelpers.classCallCheck(this, IFrameConnector);

    var _this = babelHelpers.possibleConstructorReturn(this, _XMLHttpConnector.call(this, host, port, secure, basePath));

    _this.mid = 0;
    _this.messages = {};
    _this.doReceive = _this.doReceive.bind(_this);

    addEventListener('message', _this.doReceive, false);
    return _this;
  }

  IFrameConnector.prototype.load = function load(path) {
    this.iframe = document.createElement('iframe');
    this.iframe.src = this.origin + this.basePath + path;
    this.iframe.setAttribute("style", IFrameConnector.style);
    document.body.appendChild(this.iframe);

    this.queue = [];
    this.iframe.addEventListener('load', this.onLoad.bind(this), false);
  };

  IFrameConnector.prototype.onLoad = function onLoad() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.postMessage(queue[i]);
    }

    this.queue = null;
  };

  /**
   * @inheritDoc
   */

  IFrameConnector.prototype.doSend = function doSend(message, request, receive) {
    var _this2 = this;

    //binary data will be send and received directly
    if (message.isBinary) {
      return _XMLHttpConnector.prototype.doSend.call(this, message, request, receive);
    }

    if (!this.iframe) {
      this.load(message.request.path);
      //ensure that we get a local resource cache hit
      message.request.path = '/connect';
    }

    var msg = {
      mid: ++this.mid,
      method: request.method,
      path: request.path,
      headers: request.headers,
      entity: request.entity,
      responseHeaders: Connector.RESPONSE_HEADERS
    };

    this.messages[msg.mid] = receive;

    var strMsg = JSON.stringify(msg);
    if (this.queue) {
      this.queue.push(strMsg);
    } else {
      this.postMessage(strMsg);
    }

    if (!this.connected) {
      setTimeout(function () {
        if (_this2.messages[msg.mid]) {
          delete _this2.messages[msg.mid];
          receive({
            status: 0,
            error: new Error('Connection refused.')
          });
        }
      }, 10000);
    }
  };

  IFrameConnector.prototype.postMessage = function postMessage(msg) {
    this.iframe.contentWindow.postMessage(msg, this.origin);
  };

  IFrameConnector.prototype.doReceive = function doReceive(event) {
    if (event.origin !== this.origin || event.data[0] != '{') {
      return;
    }

    var msg = JSON.parse(event.data);

    var receive = this.messages[msg.mid];
    if (receive) {
      delete this.messages[msg.mid];
      this.connected = true;

      receive({
        status: msg.status,
        headers: msg.headers,
        entity: msg.entity
      });
    }
  };

  return IFrameConnector;
}(XMLHttpConnector);

IFrameConnector.style = 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;';

Connector.connectors.push(IFrameConnector);

module.exports = IFrameConnector;

},{"23":23,"26":26}],25:[function(_dereq_,module,exports){
"use strict";

var CommunicationError = _dereq_(28);

/**
 * Checks whether the user uses a browser which does support revalidation.
 */
var REVALIDATION_SUPPORTED = typeof navigator === 'undefined' || typeof chrome !== 'undefined' && /google/i.test(navigator.vendor) || /cros i686/i.test(navigator.platform);

/**
 * @alias connector.Message
 */

var Message = function () {
  /**
   * Creates a new message class with the given message specification
   * @param {Object} specification
   * @return {Class<Message>}
   */
  Message.create = function create(specification) {
    var parts = specification.path.split('?');
    var path = parts[0].split(/[:\*]\w*/);

    var query = [];
    if (parts[1]) {
      parts[1].split('&').forEach(function (arg) {
        var part = arg.split('=');
        query.push(part[0]);
      });
    }

    specification.dynamic = specification.path.indexOf('*') != -1;
    specification.path = path;
    specification.query = query;

    return function (_Message) {
      babelHelpers.inherits(_class, _Message);

      function _class() {
        babelHelpers.classCallCheck(this, _class);
        return babelHelpers.possibleConstructorReturn(this, _Message.apply(this, arguments));
      }

      babelHelpers.createClass(_class, [{
        key: 'spec',
        get: function get() {
          return specification;
        }
      }]);
      return _class;
    }(Message);
  };

  /**
   * Creates a new message class with the given message specification and a full path
   * @param {Object} specification
   * @param {Object} members additional members applied to the created message
   * @return {Class<Message>}
   */

  Message.createExternal = function createExternal(specification, members) {
    specification.path = [specification.path];

    /**
     * @ignore
     */
    var cls = function (_Message2) {
      babelHelpers.inherits(cls, _Message2);

      function cls() {
        babelHelpers.classCallCheck(this, cls);
        return babelHelpers.possibleConstructorReturn(this, _Message2.apply(this, arguments));
      }

      babelHelpers.createClass(cls, [{
        key: 'spec',
        get: function get() {
          return specification;
        }
      }]);
      return cls;
    }(Message);

    Object.assign(cls.prototype, members);

    return cls;
  };

  babelHelpers.createClass(Message, [{
    key: 'isBinary',
    get: function get() {
      return this.request.type in Message.BINARY || this._responseType in Message.BINARY;
    }

    /**
     * @param {string} arguments... The path arguments
     */

  }]);

  function Message() {
    babelHelpers.classCallCheck(this, Message);

    /** @type boolean */
    this.withCredentials = false;

    /** @type util.TokenStorage */
    this.tokenStorage = null;

    /** @type connector.Message~progressCallback */
    this._progress = null;

    var args = arguments;
    var index = 0;
    var path = this.spec.path;
    if (Object(path) instanceof Array) {
      path = this.spec.path[0];
      var len = this.spec.path.length;
      for (var i = 1; i < len; ++i) {
        if (this.spec.dynamic && len - 1 == i) {
          path += args[index].split('/').map(encodeURIComponent).join('/');
          index += 1;
        } else {
          path += encodeURIComponent(args[index++]) + this.spec.path[i];
        }
      }
    }

    var query = "";
    for (var _i = 0; _i < this.spec.query.length; ++_i) {
      var arg = args[index++];
      if (arg !== undefined && arg !== null) {
        query += query || ~path.indexOf("?") ? "&" : "?";
        query += this.spec.query[_i] + '=' + encodeURIComponent(arg);
      }
    }

    this.request = {
      method: this.spec.method,
      path: path + query,
      entity: null,
      headers: {}
    };

    if (args[index]) {
      this.entity(args[index], 'json');
    }

    this.responseType('json');
  }

  /**
   * Get/Sets the value of a the specified request header
   * @param {string} name The header name
   * @param {string=} value The header value if omitted the value will be returned
   * @return {connector.Message|string} This message object
   */

  Message.prototype.header = function header(name, value) {
    if (value !== undefined) {
      this.request.headers[name] = value;
      return this;
    } else {
      return this.request.headers[name];
    }
  };

  /**
   * sets the entity type
   * @param {any} data The data to send
   * @param {string} [type="json"] the type of the data one of 'json'|'text'|'blob'|'arraybuffer' defaults to 'json'
   * @return {connector.Message} This message object
   */

  Message.prototype.entity = function entity(data, type) {
    if (!type) {
      if (typeof data === 'string') {
        if (/^data:(.+?)(;base64)?,.*$/.test(data)) {
          type = 'data-url';
        } else {
          type = 'text';
        }
      } else if (typeof Blob != 'undefined' && data instanceof Blob) {
        type = 'blob';
      } else if (typeof Buffer != 'undefined' && data instanceof Buffer) {
        type = 'buffer';
      } else if (typeof ArrayBuffer != 'undefined' && data instanceof ArrayBuffer) {
        type = 'arraybuffer';
      } else if (typeof FormData != 'undefined' && data instanceof FormData) {
        type = 'form';
      } else {
        type = 'json';
      }
    }

    this.request.type = type;
    this.request.entity = data;
    return this;
  };

  /**
   * Get/Sets the mimeType
   * @param {string=} mimeType the mimeType of the data
   * @return {connector.Message} This message object
   */

  Message.prototype.mimeType = function mimeType(_mimeType) {
    return this.header('content-type', _mimeType);
  };

  /**
   * Get/Sets the contentLength
   * @param {number=} contentLength the content length of the data
   * @return {connector.Message} This message object
   */

  Message.prototype.contentLength = function contentLength(_contentLength) {
    return this.header('content-length', _contentLength);
  };

  /**
   * Get/Sets the request conditional If-Match header
   * @param {string=} eTag the If-Match ETag value
   * @return {connector.Message} This message object
   */

  Message.prototype.ifMatch = function ifMatch(eTag) {
    return this.header('If-Match', this._formatETag(eTag));
  };

  /**
   * Get/Sets the request a ETag based conditional header
   * @param {string=} eTag The ETag value
   * @return {connector.Message} This message object
   */

  Message.prototype.ifNoneMatch = function ifNoneMatch(eTag) {
    return this.header('If-None-Match', this._formatETag(eTag));
  };

  /**
   * Get/Sets the request date based conditional header
   * @param {Date=} date The date value
   * @return {connector.Message} This message object
   */

  Message.prototype.ifUnmodifiedSince = function ifUnmodifiedSince(date) {
    //IE 10 returns UTC strings and not an RFC-1123 GMT date string
    return this.header('if-unmodified-since', date && date.toUTCString().replace('UTC', 'GMT'));
  };

  /**
   * Indicates that the request should not be served by a local cache
   */

  Message.prototype.noCache = function noCache() {
    if (!REVALIDATION_SUPPORTED) {
      this.ifMatch('') // is needed for firefox or safari (but forbidden for chrome)
      .ifNoneMatch('-'); // is needed for edge and ie (but forbidden for chrome)
    }

    return this.cacheControl('max-age=0, no-cache');
  };

  /**
   * Get/Sets the cache control header
   * @param {string=} value The cache control flags
   * @return {connector.Message} This message object
   */

  Message.prototype.cacheControl = function cacheControl(value) {
    return this.header('cache-control', value);
  };

  /**
   * Get/Sets and encodes the acl of a file into the Baqend-Acl header
   * @param {Acl=} acl the file acls
   * @return {connector.Message} This message object
   */

  Message.prototype.acl = function acl(_acl) {
    return this.header('baqend-acl', _acl && JSON.stringify(_acl));
  };

  /**
   * Get/Sets the request accept header
   * @param {string=} accept the accept header value
   * @return {connector.Message} This message object
   */

  Message.prototype.accept = function accept(_accept) {
    return this.header('accept', _accept);
  };

  /**
   * Get/Sets the response type which should be returned
   * @param {string=} type The response type one of 'json'|'text'|'blob'|'arraybuffer' defaults to 'json'
   * @return {connector.Message} This message object
   */

  Message.prototype.responseType = function responseType(type) {
    if (type !== undefined) {
      this._responseType = type;
      return this;
    }

    return this._responseType;
  };

  /**
   * Get/Sets the progress callback
   * @param {connector.Message~progressCallback} callback
   * @return {connector.Message} This message object
   */

  Message.prototype.progress = function progress(callback) {
    if (callback !== undefined) {
      this._progress = callback;
      return this;
    }

    return this._progress;
  };

  /**
   * Adds the given String to the request path.
   * If the parameter is an object the query string will be created.
   *
   * @param {string|Object} query which will added to the request path
   */

  Message.prototype.addQueryString = function addQueryString(query) {
    var _this3 = this;

    if (Object(query) instanceof String) {
      this.request.path += query;
    } else if (query) {
      var sep = ~this.request.path.indexOf("?") ? "&" : "?";
      Object.keys(query).forEach(function (key, i) {
        _this3.request.path += sep + key + "=" + encodeURIComponent(query[key]);
        if (i == 0) {
          sep = "&";
        }
      });
    }
    return this;
  };

  Message.prototype._formatETag = function _formatETag(eTag) {
    if (eTag && eTag != '*') {
      eTag = '' + eTag;
      if (eTag.indexOf('"') == -1) eTag = '"' + eTag + '"';
    }

    return eTag;
  };

  /**
   * Handle the receive
   * @param {Object} response The received response headers and data
   */

  Message.prototype.doReceive = function doReceive(response) {
    if (this.spec.status.indexOf(response.status) == -1) {
      throw new CommunicationError(this, response);
    }
  };

  return Message;
}();

/**
 * The message specification
 * @name spec
 * @memberOf connector.Message.prototype
 * @type {Object}
 */

Object.assign(Message, {
  /**
   * @alias connector.Message.StatusCode
   * @enum {number}
   */
  StatusCode: {
    NOT_MODIFIED: 304,
    BAD_CREDENTIALS: 460,
    BUCKET_NOT_FOUND: 461,
    INVALID_PERMISSION_MODIFICATION: 462,
    INVALID_TYPE_VALUE: 463,
    OBJECT_NOT_FOUND: 404,
    OBJECT_OUT_OF_DATE: 412,
    PERMISSION_DENIED: 466,
    QUERY_DISPOSED: 467,
    QUERY_NOT_SUPPORTED: 468,
    SCHEMA_NOT_COMPATIBLE: 469,
    SCHEMA_STILL_EXISTS: 470,
    SYNTAX_ERROR: 471,
    TRANSACTION_INACTIVE: 472,
    TYPE_ALREADY_EXISTS: 473,
    TYPE_STILL_REFERENCED: 474,
    SCRIPT_ABORTION: 475
  },

  BINARY: {
    blob: true,
    buffer: true,
    stream: true,
    arraybuffer: true,
    'data-url': true,
    'base64': true
  },

  GoogleOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=online',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin: function addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/google'
      });
    }
  }),

  FacebookOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://www.facebook.com/dialog/oauth?response_type=code',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin: function addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/facebook'
      });
    }
  }),

  GitHubOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://github.com/login/oauth/authorize?response_type=code&access_type=online',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin: function addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/github'
      });
    }
  }),

  LinkedInOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code&access_type=online',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin: function addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/linkedin'
      });
    }
  }),

  TwitterOAuth: Message.createExternal({
    method: 'OAUTH',
    path: '',
    query: [],
    status: [200]
  }, {
    addRedirectOrigin: function addRedirectOrigin(baseUri) {
      this.request.path = baseUri + '/db/User/OAuth1/twitter';
    }
  })
});

module.exports = Message;

/**
 * The progress callback is called, when you send a message to the server and a progress is noticed
 * @callback connector.Message~progressCallback
 * @param {ProgressEvent} event The Progress Event
 * @return {*} unused
 */

},{"28":28}],26:[function(_dereq_,module,exports){
"use strict";

var Connector = _dereq_(23);

/**
 * @alias connector.XMLHttpConnector
 * @extends connector.Connector
 */

var XMLHttpConnector = function (_Connector) {
  babelHelpers.inherits(XMLHttpConnector, _Connector);

  function XMLHttpConnector() {
    babelHelpers.classCallCheck(this, XMLHttpConnector);
    return babelHelpers.possibleConstructorReturn(this, _Connector.apply(this, arguments));
  }

  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @returns {boolean}
   */
  XMLHttpConnector.isUsable = function isUsable(host, port, secure) {
    if (typeof XMLHttpRequest == 'undefined') return false;

    return true;
  };

  /**
   * @inheritDoc
   */

  XMLHttpConnector.prototype.doSend = function doSend(message, request, receive) {
    var _this2 = this;

    if (request.method == 'OAUTH') {
      if (this.oAuthHandle) this.oAuthHandle({ status: 409, entity: '{"message": "A new OAuth request was sent."}' });

      localStorage.removeItem('oauth-response');

      var handler = function handler(event) {
        if (event.key == 'oauth-response') {
          _this2.oAuthHandle(JSON.parse(event.newValue));
        }
      };

      this.oAuthHandle = function (msg) {
        receive(msg);
        localStorage.removeItem('oauth-response');
        removeEventListener("storage", handler, false);
      };

      addEventListener("storage", handler, false);
      return;
    }

    var xhr = new XMLHttpRequest();

    var url = this.origin + this.basePath + request.path;

    xhr.onreadystatechange = function () {
      //if we receive an error switch the response type to json
      if (xhr.responseType && xhr.readyState == 2 && xhr.status >= 400) xhr.responseType = 'text';

      if (xhr.readyState == 4) {
        var response = {
          headers: {},
          status: xhr.status,
          entity: xhr.response || xhr.responseText
        };

        Connector.RESPONSE_HEADERS.forEach(function (name) {
          response.headers[name] = xhr.getResponseHeader(name);
        });

        receive(response);
      }
    };

    // Set the message progress callback
    if (xhr.upload && message.progress()) xhr.upload.onprogress = message.progress();

    xhr.open(request.method, url, true);

    var entity = request.entity;
    var headers = request.headers;
    for (var name in headers) {
      xhr.setRequestHeader(name, headers[name]);
    }xhr.withCredentials = message.withCredentials;

    switch (message.responseType()) {
      case 'arraybuffer':
        xhr.responseType = 'arraybuffer';
        break;
      case 'blob':
      case 'data-url':
      case 'base64':
        xhr.responseType = 'blob';
        break;
    }

    xhr.send(entity);
  };

  /**
   * @inheritDoc
   */

  XMLHttpConnector.prototype.fromFormat = function fromFormat(response, entity, type) {
    if (type == 'json') {
      entity = JSON.parse(entity);
    } else if (type == 'data-url' || type == 'base64') {
      var reader = new FileReader();
      reader.readAsDataURL(entity);

      return new Promise(function (resolve, reject) {
        reader.onload = resolve;
        reader.onerror = reject;
      }).then(function () {
        var result = reader.result;

        if (type == 'base64') result = result.substring(result.indexOf(',') + 1);

        return result;
      });
    }

    return entity;
  };

  /**
   * @inheritDoc
   */

  XMLHttpConnector.prototype.toFormat = function toFormat(message) {
    var type = message.request.type;

    if (type) {
      var entity = message.request.entity;
      var mimeType = message.mimeType();
      switch (type) {
        case 'blob':
          mimeType = mimeType || entity.type;
          break;
        case 'arraybuffer':
        case 'form':
          break;
        case 'data-url':
          var match = entity.match(/^data:(.+?)(;base64)?,(.*)$/);
          var isBase64 = match[2];
          entity = match[3];

          type = 'blob';
          mimeType = mimeType || match[1];
          if (!isBase64) {
            entity = decodeURIComponent(entity);
            break;
          }

        //fallthrough
        case 'base64':
          var binaryStr = atob(entity),
              len = binaryStr.length;
          var array = new Uint8Array(len);
          for (var i = 0; i < len; ++i) {
            array[i] = binaryStr.charCodeAt(i);
          }
          type = 'blob';
          entity = new Blob([array], { type: mimeType });
          break;
        case 'json':
          if (typeof entity != 'string') {
            entity = JSON.stringify(entity);
          }
          break;
        case 'text':
          break;
      }

      message.entity(entity, type).mimeType(mimeType);
    }
  };

  return XMLHttpConnector;
}(Connector);

Connector.connectors.push(XMLHttpConnector);

module.exports = XMLHttpConnector;

},{"23":23}],27:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace connector
 */

exports.Message = _dereq_(25);
exports.Connector = _dereq_(23);
exports.FetchConnector = _dereq_(78);
exports.XMLHttpConnector = _dereq_(26);
exports.IFrameConnector = _dereq_(24);
exports.NodeConnector = _dereq_(78);

},{"23":23,"24":24,"25":25,"26":26,"78":78}],28:[function(_dereq_,module,exports){
"use strict";

var PersistentError = _dereq_(31);

/**
 * @alias error.CommunicationError
 * @extends error.PersistentError
 */

var CommunicationError = function (_PersistentError) {
	babelHelpers.inherits(CommunicationError, _PersistentError);

	/**
  * @param {connector.Message} httpMessage The http message which was send
  * @param {Object} response The received entity headers and content
   */
	function CommunicationError(httpMessage, response) {
		babelHelpers.classCallCheck(this, CommunicationError);

		var entity = response.entity || response.error || {};
		var state = response.status == 0 ? 'Request' : 'Response';
		var message = entity.message || 'Handling the ' + state + ' for ' + httpMessage.request.method + ' ' + httpMessage.request.path;

		/**
  * The name of the error
   * @type {string}
   */
		var _this = babelHelpers.possibleConstructorReturn(this, _PersistentError.call(this, message, entity));

		_this.name = entity.className || 'CommunicationError';

		/**
  * The reason of the error
   * @type {string}
   */
		_this.reason = entity.reason || 'Communication failed';

		/**
  * The error response status code of this error
  * @type {number}
   */
		_this.status = response.status;

		if (entity.data) _this.data = entity.data;

		var cause = entity;
		while (cause && cause.stackTrace) {
			_this.stack += '\nServerside Caused by: ' + cause.className + ' ' + cause.message;

			var stackTrace = cause.stackTrace;
			for (var i = 0; i < stackTrace.length; ++i) {
				var el = stackTrace[i];

				_this.stack += '\n    at ' + el.className + '.' + el.methodName;
				_this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')';
			}

			cause = cause.cause;
		}
		return _this;
	}

	return CommunicationError;
}(PersistentError);

module.exports = CommunicationError;

},{"31":31}],29:[function(_dereq_,module,exports){
"use strict";

var PersistentError = _dereq_(31);

/**
 * @alias error.EntityExistsError
 * @extends error.PersistentError
 */

var EntityExistsError = function (_PersistentError) {
  babelHelpers.inherits(EntityExistsError, _PersistentError);

  /**
   * @param {string} entity
   */
  function EntityExistsError(entity) {
    babelHelpers.classCallCheck(this, EntityExistsError);

    /**
     * The entity which cause the error
     * @type {binding.Entity}
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _PersistentError.call(this, 'The entity ' + entity + ' is managed by a different db.'));

    _this.entity = entity;
    return _this;
  }

  return EntityExistsError;
}(PersistentError);

module.exports = EntityExistsError;

},{"31":31}],30:[function(_dereq_,module,exports){
"use strict";

var PersistentError = _dereq_(31);

/**
 * @alias error.IllegalEntityError
 * @extends error.PersistentError
 */

var IllegalEntityError = function (_PersistentError) {
  babelHelpers.inherits(IllegalEntityError, _PersistentError);

  /**
   * @param {binding.Entity} entity
   */
  function IllegalEntityError(entity) {
    babelHelpers.classCallCheck(this, IllegalEntityError);

    /**
     * The entity which cause the error
     * @type {binding.Entity}
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _PersistentError.call(this, 'Entity ' + entity + ' is not a valid entity'));

    _this.entity = entity;
    return _this;
  }

  return IllegalEntityError;
}(PersistentError);

module.exports = IllegalEntityError;

},{"31":31}],31:[function(_dereq_,module,exports){
"use strict";
/**
 * @class error.PersistentError
 * @extends Error
 *
 * @param {string} message
 * @param {Error=} cause
 */

//do not use class here, since we can't change the class prototype

function PersistentError(message, cause) {
  message = message ? message : 'An unexpected persistent error occured.';

  if (Error.hasOwnProperty('captureStackTrace')) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    /**
     * The error stack trace
     * @type {string}
     */
    this.stack = new Error().stack;
  }

  /**
   * The error message
   * @type {string}
   */
  this.message = message;

  /**
   * The name of the error
   * @type {string}
   */
  this.name = this.constructor.name;

  if (cause) {
    /**
     * The error cause
     * @type {Error}
     */
    this.cause = cause;
    if (cause.stack) {
      this.stack += '\nCaused By: ' + cause.stack;
    }
  }
}

PersistentError.of = function of(error) {
  if (error instanceof PersistentError) {
    return error;
  } else {
    return new PersistentError(null, error);
  }
};

//custom errors must be manually extended for babel, otherwise the super call destroys the origin 'this' reference
PersistentError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: PersistentError,
    enumerable: false,
    configurable: true
  }
});

module.exports = PersistentError;

},{}],32:[function(_dereq_,module,exports){
"use strict";

var PersistentError = _dereq_(31);

/**
 * @alias error.RollbackError
 * @extends error.PersistentError
 */

var RollbackError = function (_PersistentError) {
  babelHelpers.inherits(RollbackError, _PersistentError);

  /**
   * @param {Error} cause
   */
  function RollbackError(cause) {
    babelHelpers.classCallCheck(this, RollbackError);
    return babelHelpers.possibleConstructorReturn(this, _PersistentError.call(this, 'The transaction has been rollbacked', cause));
  }

  return RollbackError;
}(PersistentError);

module.exports = RollbackError;

},{"31":31}],33:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace error
 */

exports.CommunicationError = _dereq_(28);
exports.IllegalEntityError = _dereq_(30);
exports.EntityExistsError = _dereq_(29);
exports.PersistentError = _dereq_(31);
exports.RollbackError = _dereq_(32);

},{"28":28,"29":29,"30":30,"31":31,"32":32}],34:[function(_dereq_,module,exports){
'use strict';

_dereq_(175);

module.exports = _dereq_(6);

},{"175":175,"6":6}],35:[function(_dereq_,module,exports){
'use strict';

var Message = _dereq_(25);

/**
 * Get the list of all available subresources
 * 
 * @class message.ListAllResources
 * @extends connector.Message
 *
 */
exports.ListAllResources = Message.create({
  method: 'GET',
  path: '/',
  status: [200]
});

/**
 * Get the API version of the Orestes-Server
 * 
 * @class message.ApiVersion
 * @extends connector.Message
 *
 */
exports.ApiVersion = Message.create({
  method: 'GET',
  path: '/version',
  status: [200]
});

/**
 * The Swagger specification of the Orestes-Server
 * 
 * @class message.Specification
 * @extends connector.Message
 *
 */
exports.Specification = Message.create({
  method: 'GET',
  path: '/spec',
  status: [200]
});

/**
 * Returns all changed objects
 * 
 * @class message.GetBloomFilter
 * @extends connector.Message
 *
 */
exports.GetBloomFilter = Message.create({
  method: 'GET',
  path: '/bloomfilter',
  status: [200]
});

/**
 * Clears the Bloom filter (TTLs and stale entries)
 * 
 * @class message.DeleteBloomFilter
 * @extends connector.Message
 *
 */
exports.DeleteBloomFilter = Message.create({
  method: 'DELETE',
  path: '/bloomfilter',
  status: [204]
});

/**
 * Get the current Orestes config
 * 
 * @class message.GetOrestesConfig
 * @extends connector.Message
 *
 */
exports.GetOrestesConfig = Message.create({
  method: 'GET',
  path: '/config',
  status: [200]
});

/**
 * Updates the current Orestes config
 * 
 * @class message.UpdateOrestesConfig
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.UpdateOrestesConfig = Message.create({
  method: 'PUT',
  path: '/config',
  status: [200, 202]
});

/**
 * Connects a browser to this server
 * 
 * @class message.Connect
 * @extends connector.Message
 *
 */
exports.Connect = Message.create({
  method: 'GET',
  path: '/connect',
  status: [200]
});

/**
 * Gets the status of the server health
 * 
 * @class message.Status
 * @extends connector.Message
 *
 */
exports.Status = Message.create({
  method: 'GET',
  path: '/status',
  status: [200]
});

/**
 * Gets the event Endpoint
 * 
 * @class message.EventsUrl
 * @extends connector.Message
 *
 */
exports.EventsUrl = Message.create({
  method: 'GET',
  path: '/events-url',
  status: [200]
});

/**
 * Determines whether the IP has exceeded its rate limit
 * 
 * @class message.BannedIp
 * @extends connector.Message
 *
 * @param ip {Object} The ip to test
 */
exports.BannedIp = Message.create({
  method: 'GET',
  path: '/banned/:ip',
  status: [204]
});

/**
 * Always returns banned status for proper CDN handling
 * 
 * @class message.Banned
 * @extends connector.Message
 *
 */
exports.Banned = Message.create({
  method: 'GET',
  path: '/banned',
  status: []
});

/**
 * Clears all rate-limiting information for all IPs
 * 
 * @class message.Unban
 * @extends connector.Message
 *
 */
exports.Unban = Message.create({
  method: 'DELETE',
  path: '/banned',
  status: [204]
});

/**
 * Clears rate-limiting information for given IPs
 * 
 * @class message.UnbanIp
 * @extends connector.Message
 *
 * @param ip {Object} The ip to reset
 */
exports.UnbanIp = Message.create({
  method: 'DELETE',
  path: '/banned/:ip',
  status: [204]
});

/**
 * List all available bucket names
 * List all bucket
 * 
 * @class message.GetBucketNames
 * @extends connector.Message
 *
 */
exports.GetBucketNames = Message.create({
  method: 'GET',
  path: '/db',
  status: [200]
});

/**
 * List all bucket objects
 * List all object ids of the bucket
 * 
 * @class message.GetBucketIds
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset to skip
 * @param count {Object} The upper limit to return
 */
exports.GetBucketIds = Message.create({
  method: 'GET',
  path: '/db/:bucket/ids?start=0&count=-1',
  status: [200]
});

/**
 * Dumps all objects of the bucket
 * Exports the complete Bucket content
 * 
 * @class message.ExportBucket
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ExportBucket = Message.create({
  method: 'GET',
  path: '/db/:bucket',
  status: [200]
});

/**
 * Upload all objects to the bucket
 * Imports the complete Bucket content. For large uploads this call will always return a status code 200.
 * If failures occur the will be returned in the response body.
 * 
 * @class message.ImportBucket
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {Object} The massage Content
 */
exports.ImportBucket = Message.create({
  method: 'PUT',
  path: '/db/:bucket',
  status: [200]
});

/**
 * Deletes all objects of the bucket
 * Deletes all objects of the bucket
 * 
 * @class message.TruncateBucket
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.TruncateBucket = Message.create({
  method: 'DELETE',
  path: '/db/:bucket',
  status: [200]
});

/**
 * Create object
 * Create the given Object.
 * The object will be created and gets a unique oid.
 * 
 * @class message.CreateObject
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {Object} The massage Content
 */
exports.CreateObject = Message.create({
  method: 'POST',
  path: '/db/:bucket',
  status: [201, 202]
});

/**
 * Get object
 * Returns the specified object. Each object has one unique identifier and therefore only one location.
 * 
 * @class message.GetObject
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.GetObject = Message.create({
  method: 'GET',
  path: '/db/:bucket/:oid',
  status: [200, 304]
});

/**
 * Replace object
 * Replace the current object with the updated one.
 * To update a specific version of the object a version Number can be provided in the If-Match header.
 * The update will only be accepted, if the current version matches the provided one, otherwise the update
 * will be rejected.
 * You can use the * wildcard to match any existing object, but prevents a insertion if the object doesn't exists.
 * 
 * @class message.ReplaceObject
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {Object} The massage Content
 */
exports.ReplaceObject = Message.create({
  method: 'PUT',
  path: '/db/:bucket/:oid',
  status: [200, 202]
});

/**
 * Deletes the object
 * Deletes the object. The If-Match Header can be used to specify an expected version. The object will
 * only be deleted if the version matches the provided one. The * wildcard can be used to match any existing
 * version but results in an error if the object doesn't exists.
 * 
 * @class message.DeleteObject
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.DeleteObject = Message.create({
  method: 'DELETE',
  path: '/db/:bucket/:oid',
  status: [202, 204]
});

/**
 * Get all available class schemas
 * Gets the complete schema
 * 
 * @class message.GetAllSchemas
 * @extends connector.Message
 *
 */
exports.GetAllSchemas = Message.create({
  method: 'GET',
  path: '/schema',
  status: [200]
});

/**
 * Create new class schemas and update existing class schemas
 * Updates the complete schema, merge all changes, reject the schema update if the schema changes aren't compatible
 * 
 * @class message.UpdateAllSchemas
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.UpdateAllSchemas = Message.create({
  method: 'POST',
  path: '/schema',
  status: [200]
});

/**
 * Replace all currently created schemas with the new ones
 * Replace the complete schema, with the new one.
 * 
 * @class message.ReplaceAllSchemas
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.ReplaceAllSchemas = Message.create({
  method: 'PUT',
  path: '/schema',
  status: [200]
});

/**
 * Get the class schema
 * Returns the schema definition of the class
 * The class definition contains a link to its parent class and all persistable fields with there types of the class
 * 
 * @class message.GetSchema
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.GetSchema = Message.create({
  method: 'GET',
  path: '/schema/:bucket',
  status: [200]
});

/**
 * Update the class schema
 * Modify the schema definition of the class by adding all missing fields
 * 
 * @class message.UpdateSchema
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {Object} The massage Content
 */
exports.UpdateSchema = Message.create({
  method: 'POST',
  path: '/schema/:bucket',
  status: [200]
});

/**
 * Replace the class schema
 * Replace the schema definition of the class
 * 
 * @class message.ReplaceSchema
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {Object} The massage Content
 */
exports.ReplaceSchema = Message.create({
  method: 'PUT',
  path: '/schema/:bucket',
  status: [200]
});

/**
 * Delete the class schema
 * Delete the schema definition of the class
 * 
 * @class message.DeleteSchema
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DeleteSchema = Message.create({
  method: 'DELETE',
  path: '/schema/:bucket',
  status: [204]
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 * 
 * @class message.AdhocQuery
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param q {Object} The query
 * @param eager {Object} indicates if the query result should be sent back as ids or as objects
 * @param hinted {Object} indicates whether the query should be cached even when capacity limit is reached
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 */
exports.AdhocQuery = Message.create({
  method: 'GET',
  path: '/db/:bucket/query?q&start=0&count=-1&sort=&eager=&hinted=',
  status: [200]
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 * 
 * @class message.AdhocQueryPOST
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 * @param body {Object} The massage Content
 */
exports.AdhocQueryPOST = Message.create({
  method: 'POST',
  path: '/db/:bucket/query?start=0&count=-1&sort=',
  status: [200]
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 * 
 * @class message.AdhocCountQuery
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param q {Object} The query
 */
exports.AdhocCountQuery = Message.create({
  method: 'GET',
  path: '/db/:bucket/count?q',
  status: [200]
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 * 
 * @class message.AdhocCountQueryPOST
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {Object} The massage Content
 */
exports.AdhocCountQueryPOST = Message.create({
  method: 'POST',
  path: '/db/:bucket/count',
  status: [200]
});

/**
 * List all Query subresources
 * 
 * @class message.ListQueryResources
 * @extends connector.Message
 *
 */
exports.ListQueryResources = Message.create({
  method: 'GET',
  path: '/query',
  status: [200]
});

/**
 * Creates a prepared query
 * 
 * @class message.CreateQuery
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.CreateQuery = Message.create({
  method: 'POST',
  path: '/query',
  status: [201]
});

/**
 * List all subresources of a query
 * 
 * @class message.ListThisQueryResources
 * @extends connector.Message
 *
 * @param qid {Object} The query id
 */
exports.ListThisQueryResources = Message.create({
  method: 'GET',
  path: '/query/:qid',
  status: [200]
});

/**
 * Get the query string
 * 
 * @class message.GetQueryCode
 * @extends connector.Message
 *
 * @param qid {Object} The query id
 */
exports.GetQueryCode = Message.create({
  method: 'GET',
  path: '/query/:qid/source',
  status: [200]
});

/**
 * Executes a prepared query
 * 
 * @class message.RunQuery
 * @extends connector.Message
 *
 * @param start {Object} The offset from where to start from
 * @param count {Object} The number of objects to enlist
 * @param qid {Object} The query id
 */
exports.RunQuery = Message.create({
  method: 'GET',
  path: '/query/:qid/result?start=0&count=-1',
  status: [200]
});

/**
 * Get the declared query parameters
 * 
 * @class message.GetQueryParameters
 * @extends connector.Message
 *
 * @param qid {Object} The query id
 */
exports.GetQueryParameters = Message.create({
  method: 'GET',
  path: '/query/:qid/parameters',
  status: [200]
});

/**
 * Starts a new Transaction
 * 
 * @class message.NewTransaction
 * @extends connector.Message
 *
 */
exports.NewTransaction = Message.create({
  method: 'POST',
  path: '/transaction',
  status: [201]
});

/**
 * Commits the transaction
 * If the transaction can be completed a list of all changed objects with their updated versions are returned.
 * 
 * @class message.CommitTransaction
 * @extends connector.Message
 *
 * @param tid {Object} The transaction id
 * @param body {Object} The massage Content
 */
exports.CommitTransaction = Message.create({
  method: 'PUT',
  path: '/transaction/:tid/committed',
  status: [200]
});

/**
 * Update the object
 * Executes the partial updates on the object.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class message.UpdatePartially
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {Object} The massage Content
 */
exports.UpdatePartially = Message.create({
  method: 'POST',
  path: '/db/:bucket/:oid',
  status: [200]
});

/**
 * Update the object field
 * Executes the partial update on a object field.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class message.UpdateField
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param field {Object} The field name
 * @param oid {Object} The unique object identifier
 * @param body {Object} The massage Content
 */
exports.UpdateField = Message.create({
  method: 'POST',
  path: '/db/:bucket/:oid/:field',
  status: [200]
});

/**
 * Method to login a user
 * Log in a user by it's credentials
 * 
 * @class message.Login
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.Login = Message.create({
  method: 'POST',
  path: '/db/User/login',
  status: [200]
});

/**
 * Method to register a user
 * Register and creates a new user
 * 
 * @class message.Register
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.Register = Message.create({
  method: 'POST',
  path: '/db/User/register',
  status: [200, 204]
});

/**
 * Method to load the current user object
 * Gets the user object of the currently logged in user
 * 
 * @class message.Me
 * @extends connector.Message
 *
 */
exports.Me = Message.create({
  method: 'GET',
  path: '/db/User/me',
  status: [200]
});

/**
 * Method to validate a user token
 * Validates if a given token is still valid
 * 
 * @class message.ValidateUser
 * @extends connector.Message
 *
 */
exports.ValidateUser = Message.create({
  method: 'GET',
  path: '/db/User/validate',
  status: [200]
});

/**
 * Method to remove token cookie
 * Log out a user by removing the cookie token
 * 
 * @class message.Logout
 * @extends connector.Message
 *
 */
exports.Logout = Message.create({
  method: 'GET',
  path: '/db/User/logout',
  status: [204]
});

/**
 * Method to change the password
 * 
 * @class message.NewPassword
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.NewPassword = Message.create({
  method: 'POST',
  path: '/db/User/password',
  status: [200]
});

/**
 * Method to request a new password
 * 
 * @class message.ResetPassword
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.ResetPassword = Message.create({
  method: 'POST',
  path: '/db/User/reset',
  status: [200]
});

/**
 * Method to verify user by a given token
 * 
 * @class message.Verify
 * @extends connector.Message
 *
 * @param token {Object} Token to verify the user
 */
exports.Verify = Message.create({
  method: 'GET',
  path: '/db/User/verify?token=',
  status: [204]
});

/**
 * Method to register or login using an OAuth provider.
 * This resource is should be invoked by the provider with a redirect after the user granted permission.
 * 
 * @class message.OAuth2
 * @extends connector.Message
 *
 * @param oauth_verifier {Object} OAuth 1.0 code
 * @param code {Object} The code written by the provider
 * @param provider {Object} The OAuth provider
 * @param oauth_token {Object} OAuth 1.0 identifier
 * @param error_description {Object} The error description of the oauth provider
 * @param state {Object} Additional form encoded state. Can contain an optional redirect (url) that will be called after login with the user token attached as query parameter.
 */
exports.OAuth2 = Message.create({
  method: 'GET',
  path: '/db/User/OAuth/:provider?state=&code=&oauth_verifier=&oauth_token=&error_description=',
  status: [200]
});

/**
 * Method to invoke a OAuth-1.0 login/register
 * The resource requests a request-token and redirects the user to the provider page to log-in and grant permission for
 * your application.
 * 
 * @class message.OAuth1
 * @extends connector.Message
 *
 * @param provider {Object} The OAuth provider
 */
exports.OAuth1 = Message.create({
  method: 'GET',
  path: '/db/User/OAuth1/:provider',
  status: [200]
});

/**
 * Gets the code of the the given bucket and type
 * 
 * @class message.GetBaqendCode
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The type of the script
 */
exports.GetBaqendCode = Message.create({
  method: 'GET',
  path: '/code/:bucket/:type',
  status: [200]
});

/**
 * Sets the code of the bucket and type
 * 
 * @class message.SetBaqendCode
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The type of the script
 * @param body {Object} The massage Content
 */
exports.SetBaqendCode = Message.create({
  method: 'PUT',
  path: '/code/:bucket/:type',
  status: [200, 202]
});

/**
 * Delete the code of the given bucket and type
 * 
 * @class message.DeleteBaqendCode
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The type of the script
 */
exports.DeleteBaqendCode = Message.create({
  method: 'DELETE',
  path: '/code/:bucket/:type',
  status: [202, 204]
});

/**
 * Calls the module of the specific bucket
 * 
 * @class message.PostBaqendModule
 * @extends connector.Message
 *
 * @param bucket {Object} The method name
 */
exports.PostBaqendModule = Message.create({
  method: 'POST',
  path: '/code/:bucket',
  status: [200, 204]
});

/**
 * Calls the module of the specific bucket
 * 
 * @class message.GetBaqendModule
 * @extends connector.Message
 *
 * @param bucket {Object} The module name
 */
exports.GetBaqendModule = Message.create({
  method: 'GET',
  path: '/code/:bucket',
  status: [200, 204]
});

/**
 * List all available modules
 * 
 * @class message.GetAllModules
 * @extends connector.Message
 *
 */
exports.GetAllModules = Message.create({
  method: 'GET',
  path: '/code',
  status: [200]
});

/**
 * Get all file ID's in the given folder
 * Retrieve meta-information about all accessible Files and folders in a specified folder.
 * 
 * @class message.ListFiles
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param path {Object} The folder to list
 * @param deep {Object} If true, files of subdirectories are returned as well
 * @param start {Object} The file/folder name from where to start listing
 * @param count {Object} The upper limit to return, -1 is equal to the upper limit of 1000
 */
exports.ListFiles = Message.create({
  method: 'GET',
  path: '/file/:bucket/ids?path=/&start=&count=-1&deep=false',
  status: [200]
});

/**
 * Get all buckets
 * Gets all buckets.
 * 
 * @class message.ListBuckets
 * @extends connector.Message
 *
 */
exports.ListBuckets = Message.create({
  method: 'GET',
  path: '/file/buckets',
  status: [200]
});

/**
 * Download a bucket archive
 * Downloads an archive containing the bucket contents.
 * 
 * @class message.DownloadArchive
 * @extends connector.Message
 *
 * @param archive {Object} The archive file name
 */
exports.DownloadArchive = Message.create({
  method: 'GET',
  path: '/file',
  status: [200]
});

/**
 * Upload a patch bucket archive
 * Uploads an archive; files contained within that archive will be replaced within the bucket.
 * 
 * @class message.UploadPatchArchive
 * @extends connector.Message
 *
 * @param archive {Object} The archive file name
 * @param body {Object} The massage Content
 */
exports.UploadPatchArchive = Message.create({
  method: 'POST',
  path: '/file',
  status: [200]
});

/**
 * Retrieve the bucket Metadata
 * The bucket metadata object contains the bucketAcl.
 * 
 * @class message.GetFileBucketMetadata
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.GetFileBucketMetadata = Message.create({
  method: 'GET',
  path: '/file/:bucket',
  status: [200]
});

/**
 * Set the Bucket Metadata
 * Creates or replaces the bucket Metadata to control permission access to all included Files.
 * 
 * @class message.SetFileBucketMetadata
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {Object} The massage Content
 */
exports.SetFileBucketMetadata = Message.create({
  method: 'PUT',
  path: '/file/:bucket',
  status: [204]
});

/**
 * Delete all files of a file Bucket
 * Deletes the bucket and all its content.
 * 
 * @class message.DeleteFileBucket
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DeleteFileBucket = Message.create({
  method: 'DELETE',
  path: '/file/:bucket',
  status: [204]
});

/**
 * Creates a new file with a random UUID
 * Creates a file with a random ID, only Insert permissions are required.
 * 
 * @class message.CreateFile
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.CreateFile = Message.create({
  method: 'POST',
  path: '/file/:bucket',
  status: [200]
});

/**
 * Download a file
 * Downloads a file by its ID.
 * 
 * @class message.DownloadFile
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {String} The unique object identifier
 */
exports.DownloadFile = Message.create({
  method: 'GET',
  path: '/file/:bucket/*oid',
  status: [200, 304]
});

/**
 * Upload a new file
 * Uploads and replace an existing file with a new one.
 * The If-Match or If-Unmodified-Since header can be used to make a conditional update
 * 
 * @class message.UploadFile
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {String} The unique file identifier
 */
exports.UploadFile = Message.create({
  method: 'PUT',
  path: '/file/:bucket/*oid',
  status: [200]
});

/**
 * Get the file metadata
 * Gets the file Acl and metadata.
 * 
 * @class message.GetFileMetadata
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {String} The unique object identifier
 */
exports.GetFileMetadata = Message.create({
  method: 'HEAD',
  path: '/file/:bucket/*oid',
  status: [200]
});

/**
 * Update File Metadata
 * Updates the file Metadata.
 * 
 * @class message.UpdateFileMetadata
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {String} The unique object identifier
 * @param body {Object} The massage Content
 */
exports.UpdateFileMetadata = Message.create({
  method: 'POST',
  path: '/file/:bucket/*oid',
  status: [200]
});

/**
 * Delete a file
 * Deletes a file or a folder with all its contents.
 * The If-Match or If-Unmodified-Since header can be used to make a conditional deletion
 * 
 * @class message.DeleteFile
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {String} The unique file identifier
 */
exports.DeleteFile = Message.create({
  method: 'DELETE',
  path: '/file/:bucket/*oid',
  status: [200, 204]
});

/**
 * Downloads (and clones) an external asset
 * Downloads an external file.
 * 
 * @class message.DownloadAsset
 * @extends connector.Message
 *
 * @param url {String} The url of the external asset to download
 */
exports.DownloadAsset = Message.create({
  method: 'GET',
  path: '/asset/*url',
  status: [200, 304]
});

/**
 * Checks and purges assets
 * Checks and purges assets for the SpeedKit.
 * 
 * @class message.RevalidateAssets
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.RevalidateAssets = Message.create({
  method: 'POST',
  path: '/asset/revalidate',
  status: [202]
});

/**
 * Gets the status
 * Get the current status of the revalidation
 * 
 * @class message.GetRevalidationStatus
 * @extends connector.Message
 *
 * @param id {Object} The status id
 */
exports.GetRevalidationStatus = Message.create({
  method: 'GET',
  path: '/asset/revalidate/:id',
  status: [200, 202]
});

/**
 * List bucket indexes
 * List all indexes of the given bucket
 * 
 * @class message.ListIndexes
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ListIndexes = Message.create({
  method: 'GET',
  path: '/index/:bucket',
  status: [200]
});

/**
 * Create or drop bucket index
 * Create or drop a index for the given bucket
 * 
 * @class message.CreateDropIndex
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {Object} The massage Content
 */
exports.CreateDropIndex = Message.create({
  method: 'POST',
  path: '/index/:bucket',
  status: [202]
});

/**
 * Drop all indexes
 * Drop all indexes on the given bucket
 * 
 * @class message.DropAllIndexes
 * @extends connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DropAllIndexes = Message.create({
  method: 'DELETE',
  path: '/index/:bucket',
  status: [202]
});

/**
 * Method to register a new device
 * Registers a new devices
 * 
 * @class message.DeviceRegister
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.DeviceRegister = Message.create({
  method: 'POST',
  path: '/db/Device/register',
  status: [204]
});

/**
 * Method to push a message to devices
 * Pushes a message to devices
 * 
 * @class message.DevicePush
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.DevicePush = Message.create({
  method: 'POST',
  path: '/db/Device/push',
  status: [204]
});

/**
 * Check if device is registered
 * Checks if the device is already registered
 * 
 * @class message.DeviceRegistered
 * @extends connector.Message
 *
 */
exports.DeviceRegistered = Message.create({
  method: 'GET',
  path: '/db/Device/registered',
  status: [200]
});

/**
 * Upload APNS certificate
 * Upload APNS certificate
 * 
 * @class message.UploadAPNSCertificate
 * @extends connector.Message
 *
 */
exports.UploadAPNSCertificate = Message.create({
  method: 'POST',
  path: '/config/APNSCert',
  status: [204]
});

/**
 * Set GCM-API-Key
 * Sets the GCM-API-Key
 * 
 * @class message.GCMAKey
 * @extends connector.Message
 *
 * @param body {Object} The massage Content
 */
exports.GCMAKey = Message.create({
  method: 'POST',
  path: '/config/GCMKey',
  status: [204]
});

},{"25":25}],36:[function(_dereq_,module,exports){
"use strict";

var Accessor = _dereq_(7);

/**
 * @alias metamodel.Attribute
 */

var Attribute = function () {
  babelHelpers.createClass(Attribute, [{
    key: 'persistentAttributeType',

    /**
     * Returns the persistent attribute type
     * @type Attribute.PersistentAttributeType
     */
    get: function get() {
      return -1;
    }

    /**
     * @type boolean
     */

  }, {
    key: 'isAssociation',
    get: function get() {
      return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
    }

    /**
     * @type boolean
     */

  }, {
    key: 'isCollection',
    get: function get() {
      return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
    }

    /**
     * @param {string} name The attribute name
     * @param {boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
     */

  }]);

  function Attribute(name, isMetadata) {
    babelHelpers.classCallCheck(this, Attribute);

    /** @type boolean */
    this.isMetadata = !!isMetadata;
    /** @type boolean */
    this.isId = false;
    /** @type boolean */
    this.isVersion = false;
    /** @type boolean */
    this.isAcl = false;

    /** @type string */
    this.name = name;
    /** @type number */
    this.order = null;
    /** @type binding.Accessor */
    this.accessor = null;
    /** @type metamodel.ManagedType */
    this.declaringType = null;
    /** @type Object<string,string>|null */
    this.metadata = null;
  }

  /**
   * @param {metamodel.ManagedType} declaringType The type that owns this attribute
   * @param {number} order Position of the attribute
   */

  Attribute.prototype.init = function init(declaringType, order) {
    if (this.declaringType) throw new Error('The attribute is already initialized.');

    this.order = order;
    this.accessor = new Accessor();
    this.declaringType = declaringType;
  };

  /**
   * @param {Object} entity
   * @returns {*}
   */

  Attribute.prototype.getValue = function getValue(entity) {
    return this.accessor.getValue(entity, this);
  };

  /**
   * @param {Object} entity
   * @param {*} value
   */

  Attribute.prototype.setValue = function setValue(entity, value) {
    this.accessor.setValue(entity, this, value);
  };

  /**
   * Retrieves whether this type has specific metadata
   *
   * @param {string} key
   * @returns {boolean}
   */

  Attribute.prototype.hasMetadata = function hasMetadata(key) {
    return this.metadata && !!this.metadata[key];
  };

  /**
   * Gets some metadata of this type
   *
   * @param {string} key
   * @returns {null|string}
   */

  Attribute.prototype.getMetadata = function getMetadata(key) {
    if (!this.hasMetadata(key)) return null;

    return this.metadata[key];
  };

  /**
   * Gets this attribute value form the object as json
   * @param {util.Metadata} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @param {Object} options additional options which are applied through the conversion
   * @return {*} The converted json value
   * @abstract
   */

  Attribute.prototype.getJsonValue = function getJsonValue(state, object, options) {};

  /**
   * Sets this attribute value from json to the object
   * @param {util.Metadata} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   * @param {Object} options additional options which are applied through the conversion
   * @abstract
   */

  Attribute.prototype.setJsonValue = function setJsonValue(state, object, jsonValue, options) {};

  /**
   * Converts this attribute field to json
   * @returns {json} The attribute description as json
   */

  Attribute.prototype.toJSON = function toJSON() {
    return {
      name: this.name,
      metadata: this.metadata || undefined,
      order: this.order
    };
  };

  return Attribute;
}();

/**
 * @enum {number}
 */

Attribute.PersistentAttributeType = {
  BASIC: 0,
  ELEMENT_COLLECTION: 1,
  EMBEDDED: 2,
  MANY_TO_MANY: 3,
  MANY_TO_ONE: 4,
  ONE_TO_MANY: 5,
  ONE_TO_ONE: 6
};

module.exports = Attribute;

},{"7":7}],37:[function(_dereq_,module,exports){
"use strict";

var Type = _dereq_(50);
var GeoPoint = _dereq_(5);
var File = _dereq_(13);

/**
 * @alias metamodel.BasicType
 * @extends metamodel.Type
 */

var BasicType = function (_Type) {
  babelHelpers.inherits(BasicType, _Type);
  babelHelpers.createClass(BasicType, [{
    key: 'persistenceType',

    /**
     * The persistent type of this type
     * @type number
     */
    get: function get() {
      return Type.PersistenceType.BASIC;
    }

    /**
     * Creates a new instance of a native db type
     * @param {string} ref The db ref of this type
     * @param {Class<*>} typeConstructor The javascript class of this type
     * @param {boolean=} noResolving Indicates if this type is not the main type of the constructor
     */

  }]);

  function BasicType(ref, typeConstructor, noResolving) {
    babelHelpers.classCallCheck(this, BasicType);

    if (ref.indexOf('/db/') != 0) ref = '/db/' + ref;

    /**
     * Indicates if this type is not the main type of the constructor
     * @type {boolean}
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _Type.call(this, ref, typeConstructor));

    _this.noResolving = noResolving;
    return _this;
  }

  /**
   * @inheritDoc
   */

  BasicType.prototype.toJsonValue = function toJsonValue(state, currentValue) {
    return currentValue === null || currentValue === undefined ? null : this.typeConstructor(currentValue);
  };

  /**
   * @inheritDoc
   */

  BasicType.prototype.fromJsonValue = function fromJsonValue(state, jsonValue, currentValue) {
    return jsonValue === null || jsonValue === undefined ? null : jsonValue;
  };

  BasicType.prototype.toString = function toString() {
    return "BasicType(" + this.ref + ")";
  };

  return BasicType;
}(Type);

function dateToJson(value) {
  //remove trailing zeros
  return value instanceof Date ? value.toISOString().replace(/\.?0*Z/, 'Z') : null;
}

function jsonToDate(json, currentValue) {
  var date = typeof json === 'string' ? new Date(json) : null;
  if (currentValue && date) {
    //compare normalized date strings instead of plain strings
    return currentValue.toISOString() == date.toISOString() ? currentValue : date;
  } else {
    return date;
  }
}

Object.assign(BasicType, /** @lends metamodel.BasicType */{
  Boolean: new (function (_BasicType) {
    babelHelpers.inherits(BooleanType, _BasicType);

    function BooleanType() {
      babelHelpers.classCallCheck(this, BooleanType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType.apply(this, arguments));
    }

    BooleanType.prototype.fromJsonValue = function fromJsonValue(state, json, currentValue) {
      return typeof json === 'string' ? json !== "false" : _BasicType.prototype.fromJsonValue.call(this, state, json, currentValue);
    };

    return BooleanType;
  }(BasicType))('Boolean', Boolean),

  Double: new (function (_BasicType2) {
    babelHelpers.inherits(DoubleType, _BasicType2);

    function DoubleType() {
      babelHelpers.classCallCheck(this, DoubleType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType2.apply(this, arguments));
    }

    DoubleType.prototype.fromJsonValue = function fromJsonValue(state, json, currentValue) {
      return typeof json === 'string' ? parseFloat(json) : _BasicType2.prototype.fromJsonValue.call(this, state, json, currentValue);
    };

    return DoubleType;
  }(BasicType))('Double', Number),

  Integer: new (function (_BasicType3) {
    babelHelpers.inherits(IntegerType, _BasicType3);

    function IntegerType() {
      babelHelpers.classCallCheck(this, IntegerType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType3.apply(this, arguments));
    }

    IntegerType.prototype.fromJsonValue = function fromJsonValue(state, json, currentValue) {
      return typeof json === 'string' ? parseInt(json) : _BasicType3.prototype.fromJsonValue.call(this, state, json, currentValue);
    };

    return IntegerType;
  }(BasicType))('Integer', Number),

  String: new (function (_BasicType4) {
    babelHelpers.inherits(StringType, _BasicType4);

    function StringType() {
      babelHelpers.classCallCheck(this, StringType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType4.apply(this, arguments));
    }

    return StringType;
  }(BasicType))('String', String),

  DateTime: new (function (_BasicType5) {
    babelHelpers.inherits(DateTimeType, _BasicType5);

    function DateTimeType() {
      babelHelpers.classCallCheck(this, DateTimeType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType5.apply(this, arguments));
    }

    DateTimeType.prototype.toJsonValue = function toJsonValue(state, value) {
      return dateToJson(value);
    };

    DateTimeType.prototype.fromJsonValue = function fromJsonValue(state, json, currentValue) {
      return jsonToDate(json, currentValue);
    };

    return DateTimeType;
  }(BasicType))('DateTime', Date),

  Date: new (function (_BasicType6) {
    babelHelpers.inherits(DateType, _BasicType6);

    function DateType() {
      babelHelpers.classCallCheck(this, DateType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType6.apply(this, arguments));
    }

    DateType.prototype.toJsonValue = function toJsonValue(state, value) {
      var json = dateToJson(value);
      return json ? json.substring(0, json.indexOf('T')) : null;
    };

    DateType.prototype.fromJsonValue = function fromJsonValue(state, json, currentValue) {
      return jsonToDate(json, currentValue);
    };

    return DateType;
  }(BasicType))('Date', Date),

  Time: new (function (_BasicType7) {
    babelHelpers.inherits(TimeType, _BasicType7);

    function TimeType() {
      babelHelpers.classCallCheck(this, TimeType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType7.apply(this, arguments));
    }

    TimeType.prototype.toJsonValue = function toJsonValue(state, value) {
      var json = dateToJson(value);
      return json ? json.substring(json.indexOf('T') + 1) : null;
    };

    TimeType.prototype.fromJsonValue = function fromJsonValue(state, json, currentValue) {
      return typeof json === 'string' ? jsonToDate('1970-01-01T' + json, currentValue) : json;
    };

    return TimeType;
  }(BasicType))('Time', Date),

  File: new (function (_BasicType8) {
    babelHelpers.inherits(FileType, _BasicType8);

    function FileType() {
      babelHelpers.classCallCheck(this, FileType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType8.apply(this, arguments));
    }

    FileType.prototype.toJsonValue = function toJsonValue(state, value) {
      return value instanceof File ? value.id : null;
    };

    FileType.prototype.fromJsonValue = function fromJsonValue(state, json, currentValue) {
      if (json) {
        return currentValue && currentValue.id == json ? currentValue : new state.db.File(json);
      }
      return null;
    };

    return FileType;
  }(BasicType))('File', File),

  GeoPoint: new (function (_BasicType9) {
    babelHelpers.inherits(GeoPointType, _BasicType9);

    function GeoPointType() {
      babelHelpers.classCallCheck(this, GeoPointType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType9.apply(this, arguments));
    }

    GeoPointType.prototype.toJsonValue = function toJsonValue(state, value) {
      return value instanceof GeoPoint ? value : null;
    };

    GeoPointType.prototype.fromJsonValue = function fromJsonValue(state, json) {
      return json ? new GeoPoint(json) : null;
    };

    return GeoPointType;
  }(BasicType))('GeoPoint', GeoPoint),

  JsonArray: new (function (_BasicType10) {
    babelHelpers.inherits(JsonArrayType, _BasicType10);

    function JsonArrayType() {
      babelHelpers.classCallCheck(this, JsonArrayType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType10.apply(this, arguments));
    }

    JsonArrayType.prototype.init = function init(classFactory) {
      //do not manipulate array properties
      this._enhancer = classFactory;
    };

    JsonArrayType.prototype.toJsonValue = function toJsonValue(state, value) {
      return Array.isArray(value) ? value : null;
    };

    JsonArrayType.prototype.fromJsonValue = function fromJsonValue(state, json) {
      return Array.isArray(json) ? json : null;
    };

    return JsonArrayType;
  }(BasicType))('JsonArray', Array),

  JsonObject: new (function (_BasicType11) {
    babelHelpers.inherits(JsonObjectType, _BasicType11);

    function JsonObjectType() {
      babelHelpers.classCallCheck(this, JsonObjectType);
      return babelHelpers.possibleConstructorReturn(this, _BasicType11.apply(this, arguments));
    }

    JsonObjectType.prototype.init = function init(classFactory) {
      //do not manipulate object properties
      this._enhancer = classFactory;
    };

    JsonObjectType.prototype.toJsonValue = function toJsonValue(state, value) {
      if (value && value.constructor == Object) {
        return value;
      }

      return null;
    };

    return JsonObjectType;
  }(BasicType))('JsonObject', Object)
});

module.exports = BasicType;

},{"13":13,"5":5,"50":50}],38:[function(_dereq_,module,exports){
"use strict";

var PluralAttribute = _dereq_(47);

/**
 * @alias metamodel.CollectionAttribute
 * @extends metamodel.PluralAttribute
 */

var CollectionAttribute = function (_PluralAttribute) {
  babelHelpers.inherits(CollectionAttribute, _PluralAttribute);
  babelHelpers.createClass(CollectionAttribute, [{
    key: "collectionType",

    /**
     * @inheritDoc
     */
    get: function get() {
      return PluralAttribute.CollectionType.COLLECTION;
    }

    /**
     * @param {string} name
     * @param {metamodel.Type} elementType
     */

  }]);

  function CollectionAttribute(name, elementType) {
    babelHelpers.classCallCheck(this, CollectionAttribute);

    var _this = babelHelpers.possibleConstructorReturn(this, _PluralAttribute.call(this, name, elementType));

    _this.typeConstructor = null;
    return _this;
  }

  return CollectionAttribute;
}(PluralAttribute);

module.exports = CollectionAttribute;

},{"47":47}],39:[function(_dereq_,module,exports){
"use strict";
/**
 * Creates a new index instance which is needed to create an
 * database index.
 *
 * @alias metamodel.DbIndex
 */

var DbIndex = function () {

  /**
   * An array of mappings from field to index type which are parts of this index/compound index
   * @name keys
   * @type Array<Object<string,string>>
   * @memberOf metamodel.DbIndex.prototype
   */

  /**
   * @param {string|Object|Array<string>} keys The name of the field which will be used for the index,
   * an object of an field and index type combination or
   * an array of objects to create an compound index
   * @param {boolean=} unique Indicates if the index will be unique
   */
  function DbIndex(keys, unique) {
    babelHelpers.classCallCheck(this, DbIndex);

    if (Object(keys) instanceof String) {
      var key = {};
      key[keys] = DbIndex.ASC;
      this.keys = [key];
    } else if (Object(keys) instanceof Array) {
      this.keys = keys;
    } else if (keys) {
      this.keys = [keys];
    } else {
      throw new Error("The keys parameter must be an String, Object or Array.");
    }

    /** @type boolean */
    this.drop = false;
    this.unique = unique === true;
  }

  /**
   * Indicates if this index is for the given field or includes it in a compound index
   * @param {string} name The name of the field to check for
   * @return {boolean} <code>true</code> if the index contains this field
   */

  DbIndex.prototype.hasKey = function hasKey(name) {
    for (var i = 0; i < this.keys.length; i++) {
      if (this.keys[i][name]) {
        return true;
      }
    }
    return false;
  };

  /**
   * Indicates if this index is a compound index of multiple attributes
   * @type boolean
   */

  /**
   * Returns a JSON representation of the Index object
   *
   * @return {json} A Json of this Index object
   */
  DbIndex.prototype.toJSON = function toJSON() {
    return {
      unique: this.unique,
      keys: this.keys,
      drop: this.drop
    };
  };

  babelHelpers.createClass(DbIndex, [{
    key: "isCompound",
    get: function get() {
      return this.keys.length > 1;
    }

    /**
     * Indicates if this index is an unique index
     * @type boolean
     */

  }, {
    key: "isUnique",
    get: function get() {
      return this.unique;
    }
  }]);
  return DbIndex;
}();

Object.assign(DbIndex, /** @lends metamodel.DbIndex */{
  /**
   * @type string
   */
  ASC: 'asc',

  /**
   * @type string
   */
  DESC: 'desc',

  /**
   * @type string
   */
  GEO: 'geo',

  /**
   * Returns DbIndex Object created from the given JSON
   * @param {json} json
   */
  fromJSON: function fromJSON(json) {
    return new DbIndex(json.keys, json.unique);
  }
});

module.exports = DbIndex;

},{}],40:[function(_dereq_,module,exports){
"use strict";

var ManagedType = _dereq_(43);
var Type = _dereq_(50);
var binding = _dereq_(20);

/**
 * @alias metamodel.EmbeddableType
 * @extends metamodel.ManagedType
 */

var EmbeddableType = function (_ManagedType) {
  babelHelpers.inherits(EmbeddableType, _ManagedType);
  babelHelpers.createClass(EmbeddableType, [{
    key: 'persistenceType',
    get: function get() {
      return Type.PersistenceType.EMBEDDABLE;
    }

    /**
     * @param {string} ref
     * @param {Class<binding.Entity>=} typeConstructor
     */

  }]);

  function EmbeddableType(ref, typeConstructor) {
    babelHelpers.classCallCheck(this, EmbeddableType);
    return babelHelpers.possibleConstructorReturn(this, _ManagedType.call(this, ref, typeConstructor));
  }

  /**
   * {@inheritDoc}
   */

  EmbeddableType.prototype.createProxyClass = function createProxyClass() {
    return this._enhancer.createProxy(binding.Managed);
  };

  /**
   * {@inheritDoc}
   * @param {EntityManager} db {@inheritDoc}
   * @return {binding.ManagedFactory<*>} A factory which creates embeddable objects
   */

  EmbeddableType.prototype.createObjectFactory = function createObjectFactory(db) {
    return binding.ManagedFactory.create(this, db);
  };

  /**
   * @inheritDoc
   */

  EmbeddableType.prototype.toJsonValue = function toJsonValue(state, object, options) {
    if (state._root && object instanceof this.typeConstructor && !object._metadata._root) {
      object._metadata._root = state._root;
    }

    return _ManagedType.prototype.toJsonValue.call(this, state, object, options);
  };

  /**
   * @inheritDoc
   */

  EmbeddableType.prototype.fromJsonValue = function fromJsonValue(state, jsonObject, currentObject, options) {
    if (jsonObject) {
      if (!(currentObject instanceof this.typeConstructor)) currentObject = this.create();

      if (state._root && !currentObject._metadata._root) currentObject._metadata._root = state._root;
    }

    return _ManagedType.prototype.fromJsonValue.call(this, state, jsonObject, currentObject, options);
  };

  EmbeddableType.prototype.toString = function toString() {
    return "EmbeddableType(" + this.ref + ")";
  };

  return EmbeddableType;
}(ManagedType);

module.exports = EmbeddableType;

},{"20":20,"43":43,"50":50}],41:[function(_dereq_,module,exports){
"use strict";

var binding = _dereq_(20);

var SingularAttribute = _dereq_(49);
var BasicType = _dereq_(37);
var Type = _dereq_(50);
var ManagedType = _dereq_(43);
var Permission = _dereq_(68);
var Metadata = _dereq_(66);

/**
 * @alias metamodel.EntityType
 * @extends metamodel.ManagedType
 */

var EntityType = function (_ManagedType) {
  babelHelpers.inherits(EntityType, _ManagedType);
  babelHelpers.createClass(EntityType, [{
    key: 'persistenceType',
    get: function get() {
      return Type.PersistenceType.ENTITY;
    }

    /**
     * @type metamodel.SingularAttribute
     */

  }, {
    key: 'id',
    get: function get() {
      return this.declaredId || this.superType.id;
    }

    /**
     * @type metamodel.SingularAttribute
     */

  }, {
    key: 'version',
    get: function get() {
      return this.declaredVersion || this.superType.version;
    }

    /**
     * @type metamodel.SingularAttribute
     */

  }, {
    key: 'acl',
    get: function get() {
      return this.declaredAcl || this.superType.acl;
    }

    /**
     * @param {string} ref
     * @param {metamodel.EntityType} superType
     * @param {Class<binding.Entity>=} typeConstructor
     */

  }]);

  function EntityType(ref, superType, typeConstructor) {
    babelHelpers.classCallCheck(this, EntityType);

    /** @type metamodel.SingularAttribute */
    var _this = babelHelpers.possibleConstructorReturn(this, _ManagedType.call(this, ref, typeConstructor));

    _this.declaredId = null;
    /** @type metamodel.SingularAttribute */
    _this.declaredVersion = null;
    /** @type metamodel.SingularAttribute */
    _this.declaredAcl = null;
    /** @type metamodel.EntityType */
    _this.superType = superType;

    /** @type util.Permission */
    _this.loadPermission = new Permission();
    /** @type util.Permission */
    _this.updatePermission = new Permission();
    /** @type util.Permission */
    _this.deletePermission = new Permission();
    /** @type util.Permission */
    _this.queryPermission = new Permission();
    /** @type util.Permission */
    _this.schemaSubclassPermission = new Permission();
    /** @type util.Permission */
    _this.insertPermission = new Permission();
    return _this;
  }

  /**
   * {@inheritDoc}
   */

  EntityType.prototype.createProxyClass = function createProxyClass() {
    var Class = this.superType.typeConstructor;
    if (Class === Object) {
      switch (this.name) {
        case 'User':
          Class = binding.User;
          break;
        case 'Role':
          Class = binding.Role;
          break;
        default:
          Class = binding.Entity;
          break;
      }
    }

    return this._enhancer.createProxy(Class);
  };

  /**
   * Gets all on this class referencing attributes
   *
   * @param {EntityManager} db The instances will be found by this EntityManager
   * @param {Object} [options] Some options to pass
   * @param {Array.<string>} [options.classes] An array of class names to filter for, null for no filter
   * @return {Map.<metamodel.ManagedType, Set.<string>>} A map from every referencing class to a set of its referencing attribute names
   */

  EntityType.prototype.getReferencing = function getReferencing(db, options) {
    var opts = Object.assign({}, options);
    var entities = db.metamodel.entities;
    var referencing = new Map();

    for (var _iterator = Object.keys(entities), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var name = _ref;

      // Skip class if not in class filter
      if (opts.classes && opts.classes.indexOf(name) < 0) {
        continue;
      }

      var entity = entities[name];
      for (var _iterator2 = entity.attributes(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var attr = _ref2;

        // Filter only referencing singular and collection attributes
        if (attr.type === this || attr.elementType === this) {
          var typeReferences = referencing.get(attr.declaringType) || new Set();
          typeReferences.add(attr.name);
          referencing.set(attr.declaringType, typeReferences);
        }
      }
    }

    return referencing;
  };

  /**
   * {@inheritDoc}
   * Creates an ObjectFactory for this type and the given EntityManager
   * @return {binding.EntityFactory<binding.Entity>} A factory which creates entity objects
   */

  EntityType.prototype.createObjectFactory = function createObjectFactory(db) {
    switch (this.name) {
      case 'User':
        return binding.UserFactory.create(this, db);
      case 'Device':
        return binding.DeviceFactory.create(this, db);
      case 'Object':
        return undefined;
    }

    return binding.EntityFactory.create(this, db);
  };

  /**
   * @param {util.Metadata} state The root object state, can be <code>null</code> if a currentObject is provided
   * @param {json} jsonObject The json data to merge
   * @param {*} currentObject The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @param {Object=} options The options used to apply the json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent or dirty afterwards
   * @param {boolean} [options.onlyMetadata=false] Indicates if only the metadata should be updated
   * @return {*} The merged entity instance
   */

  EntityType.prototype.fromJsonValue = function fromJsonValue(state, jsonObject, currentObject, options) {
    // handle references
    if (typeof jsonObject === 'string') {
      return state.db.getReference(jsonObject);
    }

    if (!jsonObject || (typeof jsonObject === 'undefined' ? 'undefined' : babelHelpers.typeof(jsonObject)) !== 'object') {
      return null;
    }

    options = Object.assign({
      persisting: false,
      onlyMetadata: false
    }, options);

    var obj = void 0,
        objectState = void 0;
    if (currentObject) {
      var currentObjectState = Metadata.get(currentObject);
      // merge state into the current object if:
      // 1. The provided json does not contains an id and we have an already created object for it
      // 2. The object was created without an id and was later fetched from the server (e.g. User/Role)
      // 3. The provided json has the same id as the current object, they can differ on embedded json for a reference
      if (!jsonObject.id || !currentObjectState.id || jsonObject.id === currentObjectState.id) {
        obj = currentObject;
        objectState = currentObjectState;
      }
    }

    if (!obj) {
      obj = state.db.getReference(this.typeConstructor, jsonObject.id);
      objectState = Metadata.get(obj);
    }

    //deserialize our properties
    objectState.enable(false);
    _ManagedType.prototype.fromJsonValue.call(this, objectState, jsonObject, obj, options);
    objectState.enable(true);

    if (options.persisting) {
      objectState.setPersistent();
    } else if (!options.onlyMetadata) {
      objectState.setDirty();
    }

    return obj;
  };

  /**
   * Converts the given object to json
   * @param {util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @param {Object} [options=false] to json options by default excludes the metadata
   * @param {boolean} [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param {number|boolean} [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @param {boolean} [options.persisting=false] indicates if the current state will be persisted.
   *  Used to update the internal change tracking state of collections and mark the object persistent if its true
   * @returns {json} JSON-Object
   */

  EntityType.prototype.toJsonValue = function toJsonValue(state, object, options) {
    options = Object.assign({
      excludeMetadata: false,
      depth: 0,
      persisting: false
    }, options);

    var isInDepth = options.depth === true || options.depth > -1;

    // check if object is already loaded in state
    var objectState = object && Metadata.get(object);
    if (isInDepth && objectState && objectState.isAvailable) {
      // serialize our properties
      objectState.enable(false);
      var json = _ManagedType.prototype.toJsonValue.call(this, objectState, object, Object.assign({}, options, { depth: options.depth === true ? true : options.depth - 1 }));
      objectState.enable(true);

      return json;
    }

    if (object instanceof this.typeConstructor) {
      object.attach(state.db);
      return object.id;
    }

    return null;
  };

  EntityType.prototype.toString = function toString() {
    return "EntityType(" + this.ref + ")";
  };

  EntityType.prototype.toJSON = function toJSON() {
    var json = _ManagedType.prototype.toJSON.call(this);

    json.acl.schemaSubclass = this.schemaSubclassPermission;
    json.acl.insert = this.insertPermission;
    json.acl.update = this.updatePermission;
    json.acl.delete = this.deletePermission;
    json.acl.query = this.queryPermission;

    return json;
  };

  return EntityType;
}(ManagedType);

/**
 * @alias metamodel.EntityType.Object
 * @extends metamodel.EntityType
 */

var ObjectType = function (_EntityType) {
  babelHelpers.inherits(ObjectType, _EntityType);
  babelHelpers.createClass(ObjectType, null, [{
    key: 'ref',
    get: function get() {
      return '/db/Object';
    }
  }]);

  function ObjectType() {
    babelHelpers.classCallCheck(this, ObjectType);

    var _this2 = babelHelpers.possibleConstructorReturn(this, _EntityType.call(this, EntityType.Object.ref, null, Object));

    _this2.declaredId = new (function (_SingularAttribute) {
      babelHelpers.inherits(_class, _SingularAttribute);

      function _class() {
        babelHelpers.classCallCheck(this, _class);
        return babelHelpers.possibleConstructorReturn(this, _SingularAttribute.call(this, 'id', BasicType.String, true));
      }

      _class.prototype.getJsonValue = function getJsonValue(state, object, options) {
        return state.id || undefined;
      };

      _class.prototype.setJsonValue = function setJsonValue(state, object, jsonValue) {
        if (!this.id) state.id = jsonValue;
      };

      return _class;
    }(SingularAttribute))();
    _this2.declaredId.init(_this2, 0);
    _this2.declaredId.isId = true;

    _this2.declaredVersion = new (function (_SingularAttribute2) {
      babelHelpers.inherits(_class2, _SingularAttribute2);

      function _class2() {
        babelHelpers.classCallCheck(this, _class2);
        return babelHelpers.possibleConstructorReturn(this, _SingularAttribute2.call(this, 'version', BasicType.Integer, true));
      }

      _class2.prototype.getJsonValue = function getJsonValue(state, object, options) {
        return state.version || undefined;
      };

      _class2.prototype.setJsonValue = function setJsonValue(state, object, jsonValue) {
        if (jsonValue) state.version = jsonValue;
      };

      return _class2;
    }(SingularAttribute))();
    _this2.declaredVersion.init(_this2, 1);
    _this2.declaredVersion.isVersion = true;

    _this2.declaredAcl = new (function (_SingularAttribute3) {
      babelHelpers.inherits(_class3, _SingularAttribute3);

      function _class3() {
        babelHelpers.classCallCheck(this, _class3);
        return babelHelpers.possibleConstructorReturn(this, _SingularAttribute3.call(this, 'acl', BasicType.JsonObject, true));
      }

      _class3.prototype.getJsonValue = function getJsonValue(state, object, options) {
        return state.acl.toJSON();
      };

      _class3.prototype.setJsonValue = function setJsonValue(state, object, jsonValue) {
        state.acl.fromJSON(jsonValue || {});
      };

      return _class3;
    }(SingularAttribute))();
    _this2.declaredAcl.init(_this2, 2);
    _this2.declaredAcl.isAcl = true;

    _this2.declaredAttributes = [_this2.declaredId, _this2.declaredVersion, _this2.declaredAcl];
    return _this2;
  }

  return ObjectType;
}(EntityType);

EntityType.Object = ObjectType;

module.exports = EntityType;

},{"20":20,"37":37,"43":43,"49":49,"50":50,"66":66,"68":68}],42:[function(_dereq_,module,exports){
"use strict";

var PluralAttribute = _dereq_(47);

/**
 * @alias metamodel.ListAttribute
 * @extends metamodel.PluralAttribute
 */

var ListAttribute = function (_PluralAttribute) {
  babelHelpers.inherits(ListAttribute, _PluralAttribute);
  babelHelpers.createClass(ListAttribute, [{
    key: 'collectionType',
    get: function get() {
      return PluralAttribute.CollectionType.LIST;
    }

    /**
     * @param {string} name
     * @param {metamodel.Type} elementType
     */

  }], [{
    key: 'ref',
    get: function get() {
      return '/db/collection.List';
    }
  }]);

  function ListAttribute(name, elementType) {
    babelHelpers.classCallCheck(this, ListAttribute);

    var _this = babelHelpers.possibleConstructorReturn(this, _PluralAttribute.call(this, name, elementType));

    _this.typeConstructor = Array;
    return _this;
  }

  /**
   * @inheritDoc
   */

  ListAttribute.prototype.getJsonValue = function getJsonValue(state, object, options) {
    var value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      var len = value.length;
      var persisting = new Array(len),
          persistedState = value.__persistedState__ || [];
      var changed = !value.__persistedState__ || persistedState.length != len;

      var json = new Array(len);
      for (var i = 0; i < len; ++i) {
        var el = value[i];
        json[i] = this.elementType.toJsonValue(state, el, options);
        persisting[i] = el;

        changed |= persistedState[i] !== el;
      }

      if (options.persisting) {
        Object.defineProperty(value, '__persistedState__', { value: persisting, configurable: true });
      }

      if (state.isPersistent && changed) state.setDirty();

      return json;
    } else {
      return null;
    }
  };

  /**
   * {@inheritDoc}
   */

  ListAttribute.prototype.setJsonValue = function setJsonValue(state, obj, json, options) {
    var value = null;

    if (json) {
      value = this.getValue(obj);

      var len = json.length;
      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor(len);
      }

      var persisting = new Array(len),
          persistedState = value.__persistedState__ || [];

      //clear additional items
      if (len < value.length) value.splice(len, value.length - len);

      for (var i = 0; i < len; ++i) {
        var el = this.elementType.fromJsonValue(state, json[i], persistedState[i], options);
        persisting[i] = value[i] = el;
      }

      if (options.persisting) {
        Object.defineProperty(value, '__persistedState__', { value: persisting, configurable: true });
      }
    }

    this.setValue(obj, value);
  };

  /**
   * @inheritDoc
   */

  ListAttribute.prototype.toJSON = function toJSON() {
    return Object.assign({}, _PluralAttribute.prototype.toJSON.call(this), {
      type: ListAttribute.ref + '[' + this.elementType.ref + ']'
    });
  };

  return ListAttribute;
}(PluralAttribute);

module.exports = ListAttribute;

},{"47":47}],43:[function(_dereq_,module,exports){
"use strict";

var Type = _dereq_(50);
var Permission = _dereq_(68);
var Validator = _dereq_(72);
var binding = _dereq_(20);

/**
 * @alias metamodel.ManagedType
 * @extends metamodel.Type
 */

var ManagedType = function (_Type) {
  babelHelpers.inherits(ManagedType, _Type);
  babelHelpers.createClass(ManagedType, [{
    key: 'validationCode',

    /**
     * @type Function
     */
    get: function get() {
      return this._validationCode;
    },
    set: function set(code) {
      if (!code) {
        this._validationCode = null;
      } else {
        this._validationCode = Validator.compile(this, code);
      }
    }

    /**
     * The Managed class
     * @type Class<binding.Managed>
     */

  }, {
    key: 'typeConstructor',
    get: function get() {
      if (!this._typeConstructor) {
        this.typeConstructor = this.createProxyClass();
      }
      return this._typeConstructor;
    }

    /**
     * The Managed class constructor
     * @param {Class<binding.Managed>} typeConstructor The managed class constructor
     */

    , set: function set(typeConstructor) {
      if (this._typeConstructor) {
        throw new Error("Type constructor has already been set.");
      }

      var isEntity = typeConstructor.prototype instanceof binding.Entity;
      if (this.isEntity) {
        if (!isEntity) throw new TypeError("Entity classes must extends the Entity class.");
      } else {
        if (!(typeConstructor.prototype instanceof binding.Managed) || isEntity) throw new TypeError("Embeddable classes must extends the Managed class.");
      }

      this._enhancer.enhance(this, typeConstructor);
      this._typeConstructor = typeConstructor;
    }

    /**
     * @param {string} ref or full class name
     * @param {Class<binding.Managed>=} typeConstructor
     */

  }]);

  function ManagedType(ref, typeConstructor) {
    babelHelpers.classCallCheck(this, ManagedType);

    /** @type binding.Enhancer */
    var _this = babelHelpers.possibleConstructorReturn(this, _Type.call(this, ref.indexOf('/db/') != 0 ? '/db/' + ref : ref, typeConstructor));

    _this._enhancer = null;
    /** @type {metamodel.Attribute[]} */
    _this.declaredAttributes = [];

    /** @type util.Permission */
    _this.schemaAddPermission = new Permission();
    /** @type util.Permission */
    _this.schemaReplacePermission = new Permission();

    /** @type Object<string,string>|null */
    _this.metadata = null;
    return _this;
  }

  /**
   * Initialize this type
   * @param {binding.Enhancer} enhancer The class enhancer
   * used to enhance and instantiate instance of this managed class
   */

  ManagedType.prototype.init = function init(enhancer) {
    this._enhancer = enhancer;

    if (this._typeConstructor && !this._enhancer.getIdentifier(this._typeConstructor)) this._enhancer.setIdentifier(this._typeConstructor, this.ref);
  };

  /**
   * Creates an ProxyClass for this type
   * @return {Class<*>} the crated proxy class for this type
   * @abstract
   */

  ManagedType.prototype.createProxyClass = function createProxyClass() {};

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param {EntityManager} db The created instances will be attached to this EntityManager
   * @return {binding.ManagedFactory<*>} the crated object factory for the given EntityManager
   * @abstract
   */

  ManagedType.prototype.createObjectFactory = function createObjectFactory(db) {};

  /**
   * Creates a new instance of the managed type, without invoking any constructors
   * This method is used to create object instances which are loaded form the backend
   * @returns {Object} The created instance
   */

  ManagedType.prototype.create = function create() {
    var instance = void 0;
    instance = Object.create(this.typeConstructor.prototype);
    binding.Managed.init(instance);

    return instance;
  };

  /**
   * An iterator which returns all attributes declared by this type and inherited form all super types
   * @return {Iterator<metamodel.Attribute>}
   */

  ManagedType.prototype.attributes = function attributes() {
    var _ref;

    var iter = void 0,
        index = 0,
        type = this;
    if (this.superType) {
      iter = this.superType.attributes();
    }

    return _ref = {}, _ref[Symbol.iterator] = function () {
      return this;
    }, _ref.next = function next() {
      if (iter) {
        var item = iter.next();
        if (item.done) {
          iter = null;
        } else {
          return item;
        }
      }

      if (index < type.declaredAttributes.length) {
        return {
          value: type.declaredAttributes[index++],
          done: false
        };
      } else {
        return { done: true };
      }
    }, _ref;
  };

  /**
   * Adds an attribute to this type
   * @param {metamodel.Attribute} attr The attribute to add
   * @param {number=} order Position of the attribute
   */

  ManagedType.prototype.addAttribute = function addAttribute(attr, order) {
    if (this.getAttribute(attr.name)) throw new Error("An attribute with the name " + attr.name + " is already declared.");

    if (attr.order == null) {
      order = typeof order == 'undefined' ? this.declaredAttributes.length : order;
    } else {
      order = attr.order;
    }
    attr.init(this, order);

    this.declaredAttributes.push(attr);
    if (this._typeConstructor && this.name != 'Object') this._enhancer.enhanceProperty(this._typeConstructor, attr);
  };

  /**
   * Removes an attribute from this type
   * @param {string} name The Name of the attribute which will be removed
   */

  ManagedType.prototype.removeAttribute = function removeAttribute(name) {
    var length = this.declaredAttributes.length;
    this.declaredAttributes = this.declaredAttributes.filter(function (val) {
      return val.name != name;
    });

    if (length == this.declaredAttributes.length) throw new Error("An Attribute with the name " + name + " is not declared.");
  };

  /**
   * @param {!string} name
   * @returns {metamodel.Attribute}
   */

  ManagedType.prototype.getAttribute = function getAttribute(name) {
    var attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  };

  /**
   * @param {string|number} val Name or order of the attribute
   * @returns {metamodel.Attribute}
   */

  ManagedType.prototype.getDeclaredAttribute = function getDeclaredAttribute(val) {
    for (var _iterator = this.declaredAttributes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref2 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref2 = _i.value;
      }

      var attr = _ref2;

      if (attr.name === val || attr.order === val) {
        return attr;
      }
    }

    return null;
  };

  /**
   * @inheritDoc
   */

  ManagedType.prototype.fromJsonValue = function fromJsonValue(state, jsonObject, currentObject, options) {
    if (jsonObject) {
      for (var _iterator2 = this.attributes(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref3;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref3 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref3 = _i2.value;
        }

        var attribute = _ref3;

        if (!options.onlyMetadata || attribute.isMetadata) attribute.setJsonValue(state, currentObject, jsonObject[attribute.name], options);
      }
    } else {
      currentObject = null;
    }

    return currentObject;
  };

  /**
   * @inheritDoc
   */

  ManagedType.prototype.toJsonValue = function toJsonValue(state, object, options) {
    var value = null;
    if (object instanceof this.typeConstructor) {
      value = {};
      for (var _iterator3 = this.attributes(), _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref4;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref4 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref4 = _i3.value;
        }

        var attribute = _ref4;

        if (!options.excludeMetadata || !attribute.isMetadata) value[attribute.name] = attribute.getJsonValue(state, object, options);
      }
    }

    return value;
  };

  /**
   * Converts ths type schema to json
   * @returns {json}
   */

  ManagedType.prototype.toJSON = function toJSON() {
    var json = {};
    json['class'] = this.ref;

    if (this.superType) json['superClass'] = this.superType.ref;

    if (this.isEmbeddable) json['embedded'] = true;

    if (this.metadata) json['metadata'] = this.metadata;

    json['acl'] = {
      load: this.loadPermission,
      schemaAdd: this.schemaAddPermission,
      schemaReplace: this.schemaReplacePermission
    };

    var fields = json['fields'] = {};
    for (var _iterator4 = this.declaredAttributes, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      var _ref5;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref5 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref5 = _i4.value;
      }

      var attribute = _ref5;

      if (!attribute.isMetadata) fields[attribute.name] = attribute;
    }

    return json;
  };

  /**
   * Returns iterator to get all referenced entities
   * @return {Iterator<EntityType>}
   */

  ManagedType.prototype.references = function references() {
    var _ref8;

    var attributes = this.attributes();
    var embedded = [];

    return _ref8 = {}, _ref8[Symbol.iterator] = function () {
      return this;
    }, _ref8.next = function next() {
      for (var _iterator5 = attributes, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
        var _ref6;

        if (_isArray5) {
          if (_i5 >= _iterator5.length) break;
          _ref6 = _iterator5[_i5++];
        } else {
          _i5 = _iterator5.next();
          if (_i5.done) break;
          _ref6 = _i5.value;
        }

        var attribute = _ref6;

        var type = attribute.isCollection ? attribute.elementType : attribute.type;
        if (type.isEntity) {
          return { done: false, value: { path: [attribute.name] } };
        } else if (type.isEmbeddable) {
          for (var _iterator6 = type.references(), _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
            var _ref7;

            if (_isArray6) {
              if (_i6 >= _iterator6.length) break;
              _ref7 = _iterator6[_i6++];
            } else {
              _i6 = _iterator6.next();
              if (_i6.done) break;
              _ref7 = _i6.value;
            }

            var emItem = _ref7;

            embedded.push({ done: false, value: { path: [attribute.name].concat(emItem.path) } });
          }
        }
      }

      return embedded.length ? embedded.pop() : { done: true };
    }, _ref8;
  };

  /**
   * Retrieves whether this type has specific metadata
   *
   * @param {string} key
   * @returns {boolean}
   */

  ManagedType.prototype.hasMetadata = function hasMetadata(key) {
    return this.metadata && !!this.metadata[key];
  };

  /**
   * Gets some metadata of this type
   *
   * @param {string} key
   * @returns {null|string}
   */

  ManagedType.prototype.getMetadata = function getMetadata(key) {
    if (!this.hasMetadata(key)) return null;

    return this.metadata[key];
  };

  return ManagedType;
}(Type);

module.exports = ManagedType;

},{"20":20,"50":50,"68":68,"72":72}],44:[function(_dereq_,module,exports){
"use strict";

var PluralAttribute = _dereq_(47);
var PersistentError = _dereq_(31);

/**
 * @alias metamodel.MapAttribute
 * @extends metamodel.PluralAttribute
 */

var MapAttribute = function (_PluralAttribute) {
  babelHelpers.inherits(MapAttribute, _PluralAttribute);
  babelHelpers.createClass(MapAttribute, [{
    key: 'collectionType',
    get: function get() {
      return PluralAttribute.CollectionType.MAP;
    }

    /**
     * @param {string} name
     * @param {metamodel.Type} keyType
     * @param {metamodel.Type} elementType
     * @param {Object=} flags
     */

  }], [{
    key: 'ref',
    get: function get() {
      return '/db/collection.Map';
    }
  }]);

  function MapAttribute(name, keyType, elementType, flags) {
    babelHelpers.classCallCheck(this, MapAttribute);

    /** @type metamodel.Type */
    var _this = babelHelpers.possibleConstructorReturn(this, _PluralAttribute.call(this, name, elementType, flags));

    _this.keyType = keyType;
    _this.typeConstructor = Map;
    return _this;
  }

  /**
   * @inheritDoc
   */

  MapAttribute.prototype.getJsonValue = function getJsonValue(state, object, options) {
    var value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      var persisting = {},
          persistedState = value.__persistedState__ || {};
      var changed = !value.__persistedState__ || value.__persistedSize__ !== value.size;

      var json = {};
      for (var _iterator = value.entries(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var entry = _ref;

        if (entry[0] === null || entry[0] === undefined) throw new PersistentError('Map keys can\'t be null nor undefined.');

        var jsonKey = this.keyType.toJsonValue(state, entry[0], options);
        json[jsonKey] = this.elementType.toJsonValue(state, entry[1], options);

        persisting[jsonKey] = [entry[0], entry[1]];
        changed |= (persistedState[jsonKey] || [])[1] !== entry[1];
      }

      if (options.persisting) {
        Object.defineProperties(value, {
          '__persistedState__': { value: persisting, configurable: true },
          '__persistedSize__': { value: value.size, configurable: true }
        });
      }

      if (state.isPersistent && changed) state.setDirty();

      return json;
    } else {
      return null;
    }
  };

  /**
   * @inheritDoc
   */

  MapAttribute.prototype.setJsonValue = function setJsonValue(state, obj, json, options) {
    var value = null;
    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor();
      }

      var persisting = {},
          persistedState = value.__persistedState__ || {};

      value.clear();
      for (var jsonKey in json) {
        var persistedEntry = persistedState[jsonKey] || [];
        // ensure that "false" keys will be converted to false
        var key = this.keyType.fromJsonValue(state, jsonKey, persistedEntry[0], options);
        var val = this.elementType.fromJsonValue(state, json[jsonKey], persistedEntry[1], options);

        persisting[jsonKey] = [key, val];
        value.set(key, val);
      }

      if (options.persisting) {
        Object.defineProperties(value, {
          '__persistedState__': { value: persisting, configurable: true },
          '__persistedSize__': { value: value.size, configurable: true }
        });
      }
    }

    this.setValue(obj, value);
  };

  /**
   * @inheritDoc
   */

  MapAttribute.prototype.toJSON = function toJSON() {
    return Object.assign({}, _PluralAttribute.prototype.toJSON.call(this), {
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']'
    });
  };

  return MapAttribute;
}(PluralAttribute);

module.exports = MapAttribute;

},{"31":31,"47":47}],45:[function(_dereq_,module,exports){
"use strict";

var BasicType = _dereq_(37);
var ManagedType = _dereq_(43);
var EntityType = _dereq_(41);
var Enhancer = _dereq_(9);
var ModelBuilder = _dereq_(46);
var DbIndex = _dereq_(39);
var Lockable = _dereq_(64);
var StatusCode = _dereq_(25).StatusCode;

var message = _dereq_(35);

/**
 * @alias metamodel.Metamodel
 * @extends util.Lockable
 */

var Metamodel = function (_Lockable) {
  babelHelpers.inherits(Metamodel, _Lockable);

  function Metamodel(entityManagerFactory) {
    babelHelpers.classCallCheck(this, Metamodel);

    /**
     * Defines if the Metamodel has been finalized
     * @type boolean
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _Lockable.call(this));

    _this.isInitialized = false;

    /**
     * @type EntityManagerFactory
     */
    _this.entityManagerFactory = entityManagerFactory;

    /**
     * @type Object<string,metamodel.EntityType>
     */
    _this.entities = null;

    /**
     * @type Object<string,metamodel.EmbeddableType>
     */
    _this.embeddables = null;

    /**
     * @type Object<string,metamodel.BasicType>
     */
    _this.baseTypes = null;

    _this._enhancer = new Enhancer();
    return _this;
  }

  /**
   * Prepare the Metamodel for custom schema creation
   * @param {Object=} jsonMetamodel initialize the metamodel with the serialized json schema
   */

  Metamodel.prototype.init = function init(jsonMetamodel) {
    if (this.isInitialized) {
      throw new Error('Metamodel is already initialized.');
    }

    this.fromJSON(jsonMetamodel || []);
    this.isInitialized = true;
  };

  /**
   * @param {(Class<binding.Managed>|string)} arg
   * @return {string}
   */

  Metamodel.prototype._getRef = function _getRef(arg) {
    var ref = void 0;
    if (Object(arg) instanceof String) {
      ref = arg;

      if (ref.indexOf('/db/') != 0) {
        ref = '/db/' + arg;
      }
    } else {
      ref = this._enhancer.getIdentifier(arg);
    }

    return ref;
  };

  /**
   * Return the metamodel entity type representing the entity.
   *
   * @param {(Class<binding.Entity>|string)} typeConstructor - the type of the represented entity
   * @returns {metamodel.EntityType} the metamodel entity type
   */

  Metamodel.prototype.entity = function entity(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.entities[ref] : null;
  };

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Class<*>|string)} typeConstructor - the type of the represented native class
   * @returns {metamodel.BasicType} the metamodel basic type
   */

  Metamodel.prototype.baseType = function baseType(typeConstructor) {
    var ref = null;
    if (Object(typeConstructor) instanceof String) {
      ref = this._getRef(typeConstructor);
    } else {
      for (var name in this.baseTypes) {
        var type = this.baseTypes[name];
        if (!type.noResolving && type.typeConstructor == typeConstructor) {
          ref = name;
          break;
        }
      }
    }

    return ref ? this.baseTypes[ref] : null;
  };

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param {Class<binding.Managed>|string} typeConstructor - the type of the represented embeddable class
   * @returns {metamodel.EmbeddableType} the metamodel embeddable type
   */

  Metamodel.prototype.embeddable = function embeddable(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.embeddables[ref] : null;
  };

  /**
   * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
   *
   * @param {(Class<binding.Managed>|string)} typeConstructor - the type of the represented managed class
   * @returns {metamodel.Type} the metamodel managed type
   */

  Metamodel.prototype.managedType = function managedType(typeConstructor) {
    return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
  };

  /**
   * @param {metamodel.Type} type
   * @return {metamodel.Type} the added type
   */

  Metamodel.prototype.addType = function addType(type) {
    var types = void 0;

    if (type.isBasic) {
      types = this.baseTypes;
    } else if (type.isEmbeddable) {
      type.init(this._enhancer);
      types = this.embeddables;
    } else if (type.isEntity) {
      type.init(this._enhancer);
      types = this.entities;

      if (type.superType == null && type.ref != EntityType.Object.ref) {
        type.superType = this.entity(EntityType.Object.ref);
      }
    }

    if (types[type.ref]) {
      throw new Error("The type " + type.ref + " is already declared.");
    }

    return types[type.ref] = type;
  };

  /**
   * Load all schema data from the server
   * @returns {Promise<metamodel.Metamodel>}
   */

  Metamodel.prototype.load = function load() {
    var _this2 = this;

    if (!this.isInitialized) {
      return this.withLock(function () {
        var msg = new message.GetAllSchemas();

        return _this2.entityManagerFactory.send(msg).then(function (response) {
          _this2.init(response.entity);
          return _this2;
        });
      });
    } else {
      throw new Error("Metamodel is already initialized.");
    }
  };

  /**
   * Store all local schema data on the server, or the provided one
   *
   * Note: The schema must be initialized, by init or load
   *
   * @param {metamodel.ManagedType=} managedType The specific type to persist, if omitted the complete schema will be updated
   * @returns {Promise<metamodel.Metamodel>}
   */

  Metamodel.prototype.save = function save(managedType) {
    var _this3 = this;

    return this._send(managedType || this.toJSON()).then(function () {
      return _this3;
    });
  };

  /**
   * The provided options object will be forwarded to the UpdateAllSchemas resource.
   * The underlying schema of this Metamodel object will be replaced by the result.
   *
   * @param {json} data The JSON which will be send to the UpdateAllSchemas resource.
   * @returns {Promise<metamodel.Metamodel>}
   */

  Metamodel.prototype.update = function update(data) {
    var _this4 = this;

    return this._send(data).then(function (response) {
      _this4.fromJSON(response.entity);
      return _this4;
    });
  };

  Metamodel.prototype._send = function _send(data) {
    var _this5 = this;

    if (!this.isInitialized) throw new Error("Metamodel is not initialized.");

    return this.withLock(function () {
      var msg = void 0;
      if (data instanceof ManagedType) {
        msg = new message.UpdateSchema(data.name, data.toJSON());
      } else {
        msg = new message.UpdateAllSchemas(data);
      }

      return _this5.entityManagerFactory.send(msg);
    });
  };

  /**
   * Get the current schema types as json
   * @returns {json} the json data
   */

  Metamodel.prototype.toJSON = function toJSON() {
    var json = [];

    for (var ref in this.entities) {
      json.push(this.entities[ref]);
    }

    for (ref in this.embeddables) {
      json.push(this.embeddables[ref]);
    }

    return json;
  };

  /**
   * Replace the current schema by the provided one in json
   * @param {json} json The json schema data
   */

  Metamodel.prototype.fromJSON = function fromJSON(json) {
    var builder = new ModelBuilder();
    var models = builder.buildModels(json);

    this.baseTypes = {};
    this.embeddables = {};
    this.entities = {};

    for (var ref in models) {
      var type = models[ref];
      this.addType(type);
    }
  };

  /**
   * Creates an index
   *
   * @param {string} bucket Name of the Bucket
   * @param {metamodel.DbIndex} index Will be applied for the given bucket
   * @return {Promise<*>}
   */

  Metamodel.prototype.createIndex = function createIndex(bucket, index) {
    index.drop = false;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    return this.entityManagerFactory.send(msg);
  };

  /**
   * Drops an index
   *
   * @param {string} bucket Name of the Bucket
   * @param {metamodel.DbIndex} index Will be dropped for the given bucket
   * @return {Promise<*>}
   */

  Metamodel.prototype.dropIndex = function dropIndex(bucket, index) {
    index.drop = true;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    return this.entityManagerFactory.send(msg);
  };

  /**
   * Drops all indexes
   *
   * @param {string} bucket Indexes will be dropped for the given bucket
   * @returns {Promise<*>}
   */

  Metamodel.prototype.dropAllIndexes = function dropAllIndexes(bucket) {
    var msg = new message.DropAllIndexes(bucket);
    return this.entityManagerFactory.send(msg);
  };

  /**
   * Loads all indexes for the given bucket
   *
   * @param {string} bucket Current indexes will be loaded for the given bucket
   * @returns {Promise<Array<metamodel.DbIndex>>}
   */

  Metamodel.prototype.getIndexes = function getIndexes(bucket) {
    var msg = new message.ListIndexes(bucket);
    return this.entityManagerFactory.send(msg).then(function (response) {
      return response.entity.map(function (el) {
        return new DbIndex(el.keys, el.unique);
      });
    }, function (e) {
      if (e.status == StatusCode.BUCKET_NOT_FOUND || e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  };

  return Metamodel;
}(Lockable);

module.exports = Metamodel;

},{"25":25,"35":35,"37":37,"39":39,"41":41,"43":43,"46":46,"64":64,"9":9}],46:[function(_dereq_,module,exports){
"use strict";

var BasicType = _dereq_(37);
var EntityType = _dereq_(41);
var EmbeddableType = _dereq_(40);

var ListAttribute = _dereq_(42);
var MapAttribute = _dereq_(44);
var SetAttribute = _dereq_(48);
var SingularAttribute = _dereq_(49);

var PersistentError = _dereq_(31);

/**
 * @alias metamodel.ModelBuilder
 */

var ModelBuilder = function () {
  function ModelBuilder() {
    babelHelpers.classCallCheck(this, ModelBuilder);

    /** @type Object<string,metamodel.ManagedType> */
    this.models = {};

    /** @type Object<string,Object> */
    this.modelDescriptors = null;

    for (var _iterator = Object.keys(BasicType), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var typeName = _ref;

      var basicType = BasicType[typeName];
      if (basicType instanceof BasicType) {
        this.models[basicType.ref] = basicType;
      }
    }
  }

  /**
   * @param {string} ref
   * @returns {metamodel.ManagedType}
   */

  ModelBuilder.prototype.getModel = function getModel(ref) {
    if (ref in this.models) {
      return this.models[ref];
    }

    return this.models[ref] = this.buildModel(ref);
  };

  /**
   * @param {Object[]} modelDescriptors
   * @returns {Object<string,metamodel.ManagedType>}
   */

  ModelBuilder.prototype.buildModels = function buildModels(modelDescriptors) {
    this.modelDescriptors = {};
    var i = 0,
        modelDescriptor = void 0;
    for (; modelDescriptor = modelDescriptors[i]; ++i) {
      this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
    }

    for (var ref in this.modelDescriptors) {
      try {
        var model = this.getModel(ref);
        this.buildAttributes(model);
      } catch (e) {
        throw new PersistentError('Can\'t create model for entity class ' + ref, e);
      }
    }

    //ensure at least an object entity
    this.getModel(EntityType.Object.ref);

    return this.models;
  };

  /**
   * @param {string} ref
   * @returns {metamodel.ManagedType}
   */

  ModelBuilder.prototype.buildModel = function buildModel(ref) {
    var modelDescriptor = this.modelDescriptors[ref];
    var type = void 0;
    if (ref === EntityType.Object.ref) {
      type = new EntityType.Object();
    } else if (modelDescriptor) {
      if (modelDescriptor.embedded) {
        type = new EmbeddableType(ref);
      } else {
        var superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.ref;
        type = new EntityType(ref, this.getModel(superTypeIdentifier));
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }

    type.metadata = {};

    if (modelDescriptor) {
      type.metadata = modelDescriptor.metadata || {};
      var permissions = modelDescriptor['acl'];
      for (var permission in permissions) {
        type[permission + 'Permission'].fromJSON(permissions[permission]);
      }
    }

    return type;
  };

  /**
   * @param {metamodel.EntityType} model
   */

  ModelBuilder.prototype.buildAttributes = function buildAttributes(model) {
    var modelDescriptor = this.modelDescriptors[model.ref];
    var fields = modelDescriptor['fields'];

    for (var name in fields) {
      var field = fields[name];
      if (!model.getAttribute(name)) //skip predefined attributes
        model.addAttribute(this.buildAttribute(field), field.order);
    }

    if (modelDescriptor.validationCode) {
      model.validationCode = modelDescriptor.validationCode;
    }
  };

  /**
   * @param {{ name: string, type: string, order: number, metadata: Object<string,string>|undefined, flags: string[]? }} field
   * @returns {metamodel.Attribute}
   */

  ModelBuilder.prototype.buildAttribute = function buildAttribute(field) {
    //TODO: remove readonly if createdAt and updatedAt becomes real metadata fields in the schema
    var isMetadata = field.flags && (field.flags.indexOf('METADATA') != -1 || field.flags.indexOf('READONLY') != -1);
    var name = field.name;
    var ref = field.type;
    if (ref.indexOf('/db/collection.') !== 0) {
      var singularAttribute = new SingularAttribute(name, this.getModel(ref), isMetadata);
      singularAttribute.metadata = field.metadata;
      return singularAttribute;
    }
    var collectionType = ref.substring(0, ref.indexOf('['));
    var elementType = ref.substring(ref.indexOf('[') + 1, ref.indexOf(']')).trim();
    switch (collectionType) {
      case ListAttribute.ref:
        return new ListAttribute(name, this.getModel(elementType));
      case SetAttribute.ref:
        return new SetAttribute(name, this.getModel(elementType));
      case MapAttribute.ref:
        var keyType = elementType.substring(0, elementType.indexOf(',')).trim();
        elementType = elementType.substring(elementType.indexOf(',') + 1).trim();

        return new MapAttribute(name, this.getModel(keyType), this.getModel(elementType));
      default:
        throw new TypeError('No collection available for ' + ref);
    }
  };

  return ModelBuilder;
}();

module.exports = ModelBuilder;

},{"31":31,"37":37,"40":40,"41":41,"42":42,"44":44,"48":48,"49":49}],47:[function(_dereq_,module,exports){
"use strict";

var Attribute = _dereq_(36);

/**
 * @alias metamodel.PluralAttribute
 * @extends metamodel.Attribute
 * @abstract
 */

var PluralAttribute = function (_Attribute) {
  babelHelpers.inherits(PluralAttribute, _Attribute);
  babelHelpers.createClass(PluralAttribute, [{
    key: "persistentAttributeType",

    /**
     * Returns the collection attribute type
     * @type PluralAttribute.CollectionType
     * @name collectionType
     * @memberOf metamodel.PluralAttribute.prototype
     */

    get: function get() {
      return Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
    }

    /**
     * @param {string} name
     * @param {metamodel.Type} elementType
     * @param {Object=} flags
     */

  }]);

  function PluralAttribute(name, elementType, flags) {
    babelHelpers.classCallCheck(this, PluralAttribute);

    /** @type metamodel.Type */
    var _this = babelHelpers.possibleConstructorReturn(this, _Attribute.call(this, name));

    _this.elementType = elementType;
    /** @type Class<*> */
    _this.typeConstructor = null;
    return _this;
  }

  return PluralAttribute;
}(Attribute);

/**
 * @enum {number}
 */

PluralAttribute.CollectionType = {
  COLLECTION: 0,
  LIST: 1,
  MAP: 2,
  SET: 3
};

module.exports = PluralAttribute;

},{"36":36}],48:[function(_dereq_,module,exports){
"use strict";

var PluralAttribute = _dereq_(47);

/**
 * @alias metamodel.SetAttribute
 * @extends metamodel.PluralAttribute
 */

var SetAttribute = function (_PluralAttribute) {
  babelHelpers.inherits(SetAttribute, _PluralAttribute);
  babelHelpers.createClass(SetAttribute, [{
    key: 'collectionType',
    get: function get() {
      return PluralAttribute.CollectionType.SET;
    }

    /**
     * @param {string} name
     * @param {metamodel.Type} elementType
     * @param {Object=} flags
     */

  }], [{
    key: 'ref',
    get: function get() {
      return '/db/collection.Set';
    }
  }]);

  function SetAttribute(name, elementType, flags) {
    babelHelpers.classCallCheck(this, SetAttribute);

    var _this = babelHelpers.possibleConstructorReturn(this, _PluralAttribute.call(this, name, elementType, flags));

    _this.typeConstructor = Set;
    return _this;
  }

  /**
   * @inheritDoc
   */

  SetAttribute.prototype.getJsonValue = function getJsonValue(state, object, options) {
    var value = this.getValue(object);

    if (value instanceof this.typeConstructor) {
      var persisting = {},
          persistedState = value.__persistedState__ || {};
      var changed = !value.__persistedState__ || value.__persistedSize__ !== value.size;

      var json = [];
      for (var _iterator = value, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var el = _ref;

        var jsonValue = this.elementType.toJsonValue(state, el, options);
        json.push(jsonValue);

        persisting[jsonValue] = el;
        changed |= persistedState[jsonValue] !== el;
      }

      if (options.persisting) {
        Object.defineProperties(value, {
          '__persistedState__': { value: persisting, configurable: true },
          '__persistedSize__': { value: value.size, configurable: true }
        });
      }

      if (state.isPersistent && changed) state.setDirty();

      return json;
    } else {
      return null;
    }
  };

  /**
   * {@inheritDoc}
   */

  SetAttribute.prototype.setJsonValue = function setJsonValue(state, obj, json, options) {
    var value = null;

    if (json) {
      value = this.getValue(obj);

      if (!(value instanceof this.typeConstructor)) {
        value = new this.typeConstructor();
      }

      var persisting = {},
          persistedState = value.__persistedState__ || {};

      value.clear();
      for (var i = 0, len = json.length; i < len; ++i) {
        var jsonValue = json[i];
        var id = jsonValue && jsonValue.id ? jsonValue.id : jsonValue;
        var el = this.elementType.fromJsonValue(state, jsonValue, persistedState[id], options);
        value.add(el);

        persisting[id] = el;
      }

      if (options.persisting) {
        Object.defineProperties(value, {
          '__persistedState__': { value: persisting, configurable: true },
          '__persistedSize__': { value: value.size, configurable: true }
        });
      }
    }

    this.setValue(obj, value);
  };

  /**
   * @inheritDoc
   */

  SetAttribute.prototype.toJSON = function toJSON() {
    return Object.assign({}, _PluralAttribute.prototype.toJSON.call(this), {
      type: SetAttribute.ref + '[' + this.elementType.ref + ']'
    });
  };

  return SetAttribute;
}(PluralAttribute);

module.exports = SetAttribute;

},{"47":47}],49:[function(_dereq_,module,exports){
"use strict";

var Attribute = _dereq_(36);
var Type = _dereq_(50);

/**
 * @alias metamodel.SingularAttribute
 * @extends metamodel.Attribute
 */

var SingularAttribute = function (_Attribute) {
  babelHelpers.inherits(SingularAttribute, _Attribute);
  babelHelpers.createClass(SingularAttribute, [{
    key: 'typeConstructor',
    get: function get() {
      return this.type.typeConstructor;
    }
  }, {
    key: 'persistentAttributeType',
    get: function get() {
      switch (this.type.persistenceType) {
        case Type.PersistenceType.BASIC:
          return Attribute.PersistentAttributeType.BASIC;
        case Type.PersistenceType.EMBEDDABLE:
          return Attribute.PersistentAttributeType.EMBEDDED;
        case Type.PersistenceType.ENTITY:
          return Attribute.PersistentAttributeType.ONE_TO_MANY;
      }
    }

    /**
     * @param {string} name
     * @param {metamodel.Type} type
     * @param {boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
     */

  }]);

  function SingularAttribute(name, type, isMetadata) {
    babelHelpers.classCallCheck(this, SingularAttribute);

    /** @type metamodel.Type */
    var _this = babelHelpers.possibleConstructorReturn(this, _Attribute.call(this, name, isMetadata));

    _this.type = type;
    return _this;
  }

  /**
   * @inheritDoc
   */

  SingularAttribute.prototype.getJsonValue = function getJsonValue(state, object, options) {
    return this.type.toJsonValue(state, this.getValue(object), options);
  };

  /**
   * @inheritDoc
   */

  SingularAttribute.prototype.setJsonValue = function setJsonValue(state, object, jsonValue, options) {
    this.setValue(object, this.type.fromJsonValue(state, jsonValue, this.getValue(object), options));
  };

  /**
   * @inheritDoc
   */

  SingularAttribute.prototype.toJSON = function toJSON() {
    return Object.assign({}, _Attribute.prototype.toJSON.call(this), {
      type: this.type.ref
    });
  };

  return SingularAttribute;
}(Attribute);

module.exports = SingularAttribute;

},{"36":36,"50":50}],50:[function(_dereq_,module,exports){
"use strict";

/**
 * @alias metamodel.Type
 */

var Type = function () {
  babelHelpers.createClass(Type, [{
    key: "persistenceType",

    /**
     * The persistent type of this type
     * @type number
     * @abstract
     */
    get: function get() {
      return -1;
    }

    /**
     * @type boolean
     */

  }, {
    key: "isBasic",
    get: function get() {
      return this.persistenceType == Type.PersistenceType.BASIC;
    }

    /**
     * @type boolean
     */

  }, {
    key: "isEmbeddable",
    get: function get() {
      return this.persistenceType == Type.PersistenceType.EMBEDDABLE;
    }

    /**
     * @type boolean
     */

  }, {
    key: "isEntity",
    get: function get() {
      return this.persistenceType == Type.PersistenceType.ENTITY;
    }

    /**
     * @type boolean
     */

  }, {
    key: "isMappedSuperclass",
    get: function get() {
      return this.persistenceType == Type.PersistenceType.MAPPED_SUPERCLASS;
    }

    /**
     * @return {Class<*>}
     */

  }, {
    key: "typeConstructor",
    get: function get() {
      return this._typeConstructor;
    }

    /**
     * @param {Class<*>} typeConstructor
     */

    , set: function set(typeConstructor) {
      if (this._typeConstructor) {
        throw new Error("typeConstructor has already been set.");
      }
      this._typeConstructor = typeConstructor;
    }

    /**
     * @param {string} ref
     * @param {Class<*>=} typeConstructor
     */

  }]);

  function Type(ref, typeConstructor) {
    babelHelpers.classCallCheck(this, Type);

    if (ref.indexOf("/db/") != 0) {
      throw new SyntaxError("Type ref " + ref + " is invalid.");
    }

    /** @type string */
    this.ref = ref;
    /** @type string */
    this.name = ref.substring(4);
    this._typeConstructor = typeConstructor;
  }

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param {util.Metadata} state The root object state
   * @param {json} jsonValue The json data to merge
   * @param {*} currentValue The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @param {Object} options additional options which are applied through the conversion
   * @param {boolean} [options.onlyMetadata=false] Indicates that only the metadata should be updated of the object
   * @return {*} The merged object instance
   * @abstract
   */

  Type.prototype.fromJsonValue = function fromJsonValue(state, jsonValue, currentValue, options) {};

  /**
   * Converts the given object to json
   * @param {util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @param {Object} options additional options which are applied through the conversion
   * @param {boolean} [options.excludeMetadata=false] Indicates that no metadata should be exposed on the generated json
   * @param {number|boolean} [options.depth=0] The object depth to serialize
   * @return {json} The converted object as json
   * @abstract
   */

  Type.prototype.toJsonValue = function toJsonValue(state, object, options) {};

  return Type;
}();

/**
 * @enum {number}
 */

Type.PersistenceType = {
  BASIC: 0,
  EMBEDDABLE: 1,
  ENTITY: 2,
  MAPPED_SUPERCLASS: 3
};

module.exports = Type;

},{}],51:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace metamodel
 */

var Metamodel = _dereq_(45);

Metamodel.prototype.Attribute = _dereq_(36);
Metamodel.prototype.BasicType = _dereq_(37);
Metamodel.prototype.CollectionAttribute = _dereq_(38);
Metamodel.prototype.EmbeddableType = _dereq_(40);
Metamodel.prototype.EntityType = _dereq_(41);
Metamodel.prototype.ListAttribute = _dereq_(42);
Metamodel.prototype.ManagedType = _dereq_(43);
Metamodel.prototype.MapAttribute = _dereq_(44);
Metamodel.prototype.Metamodel = _dereq_(45);
Metamodel.prototype.ModelBuilder = _dereq_(46);
Metamodel.prototype.PluralAttribute = _dereq_(47);
Metamodel.prototype.SetAttribute = _dereq_(48);
Metamodel.prototype.SingularAttribute = _dereq_(49);
Metamodel.prototype.Type = _dereq_(50);
Metamodel.prototype.DbIndex = _dereq_(39);

exports = module.exports = new Metamodel();

},{"36":36,"37":37,"38":38,"39":39,"40":40,"41":41,"42":42,"43":43,"44":44,"45":45,"46":46,"47":47,"48":48,"49":49,"50":50}],52:[function(_dereq_,module,exports){
"use strict";

var PartialUpdateBuilder = _dereq_(53);
var Metadata = _dereq_(66);
var message = _dereq_(35);

/**
 * @alias partialupdate.EntityPartialUpdateBuilder<T>
 * @extends partialupdate.PartialUpdateBuilder<T>
 */

var EntityPartialUpdateBuilder = function (_PartialUpdateBuilder) {
  babelHelpers.inherits(EntityPartialUpdateBuilder, _PartialUpdateBuilder);

  /**
   * @param {binding.Entity} entity
   * @param {json} operations
   */
  function EntityPartialUpdateBuilder(entity, operations) {
    babelHelpers.classCallCheck(this, EntityPartialUpdateBuilder);

    /** @type {binding.Entity} */
    var _this = babelHelpers.possibleConstructorReturn(this, _PartialUpdateBuilder.call(this, operations));

    _this._entity = entity;
    return _this;
  }

  /**
   * @inheritDoc
   */

  EntityPartialUpdateBuilder.prototype.execute = function execute() {
    var _this2 = this;

    var state = Metadata.get(this._entity);
    var body = JSON.stringify(this);
    var msg = new message.UpdatePartially(state.bucket, state.key, body);

    return state.withLock(function () {
      return state.db.send(msg).then(function (response) {
        // Update the entity’s values
        state.setJson(response.entity, true);
        return _this2._entity;
      });
    });
  };

  return EntityPartialUpdateBuilder;
}(PartialUpdateBuilder);

module.exports = EntityPartialUpdateBuilder;

},{"35":35,"53":53,"66":66}],53:[function(_dereq_,module,exports){
"use strict";

var ALLOWED_OPERATIONS = ['$add', '$and', '$currentDate', '$dec', '$inc', '$max', '$min', '$mul', '$or', '$pop', '$push', '$put', '$remove', '$rename', '$replace', '$set', '$shift', '$unshift', '$xor'];

var UpdateOperation = _dereq_(54);

/**
 * @alias partialupdate.PartialUpdateBuilder<T>
 */

var PartialUpdateBuilder = function () {
  /**
   * @param {json} operations
   */
  function PartialUpdateBuilder(operations) {
    babelHelpers.classCallCheck(this, PartialUpdateBuilder);

    /** @type {UpdateOperation[]} */
    this._operations = [];
    if (operations) {
      this._addOperations(operations);
    }
  }

  /**
   * Sets a field to a given value
   *
   * @param {string} field The field to set
   * @param {string|number|Set<*>|Map<string|number, *>|Array<*>} value The value to set to
   * @return {this}
   */

  PartialUpdateBuilder.prototype.set = function set(field, value) {
    if (value instanceof Set) {
      value = Array.from(value);
    } else if (value instanceof Map) {
      var newValue = {};
      value.forEach(function (v, k) {
        newValue[k] = v;
      });
      value = newValue;
    }

    return this._addOperation(field, '$set', value);
  };

  /**
   * Increments a field by a given value
   *
   * @param {string} field The field to increment
   * @param {number=} by The number to increment by, defaults to 1
   * @return {this}
   */

  PartialUpdateBuilder.prototype.inc = function inc(field, by) {
    return this._addOperation(field, '$inc', typeof by === 'number' ? by : 1);
  };

  /**
   * Decrements a field by a given value
   *
   * @param {string} field The field to decrement
   * @param {number=} by The number to decrement by, defaults to 1
   * @return {this}
   */

  PartialUpdateBuilder.prototype.dec = function dec(field, by) {
    return this.increment(field, typeof by === 'number' ? -by : -1);
  };

  /**
   * Multiplies a field by a given number
   *
   * @param {string} field The field to multiply
   * @param {number} multiplicator The number to multiply by
   * @return {this}
   */

  PartialUpdateBuilder.prototype.mul = function mul(field, multiplicator) {
    if (typeof multiplicator !== 'number') {
      throw new Error('Multiplicator must be a number.');
    }

    return this._addOperation(field, '$mul', multiplicator);
  };

  /**
   * Divides a field by a given number
   *
   * @param {string} field The field to divide
   * @param {number} divisor The number to divide by
   * @return {this}
   */

  PartialUpdateBuilder.prototype.div = function div(field, divisor) {
    if (typeof divisor !== 'number') {
      throw new Error('Divisor must be a number.');
    }

    return this._addOperation(field, '$mul', 1 / divisor);
  };

  /**
   * Sets the highest possible value of a field
   *
   * @param {string} field The field to compare with
   * @param {number} value The highest possible value
   * @return {this}
   */

  PartialUpdateBuilder.prototype.min = function min(field, value) {
    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }

    return this._addOperation(field, '$min', value);
  };

  /**
   * Sets the smallest possible value of a field
   *
   * @param {string} field The field to compare with
   * @param {number} value The smalles possible value
   * @return {this}
   */

  PartialUpdateBuilder.prototype.max = function max(field, value) {
    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }

    return this._addOperation(field, '$max', value);
  };

  /**
   * Removes an item from an array or map
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */

  PartialUpdateBuilder.prototype.remove = function remove(field, item) {
    return this._addOperation(field, '$remove', item);
  };

  /**
   * Puts an item from an array or map
   *
   * @param {string} field The field to perform the operation on
   * @param {string|object} key The map key to put the value to or an object of arguments
   * @param {*} [value] The value to put if a key was used
   * @return {this}
   */

  PartialUpdateBuilder.prototype.put = function put(field, key, value) {
    var obj = {};
    if (typeof key === 'string' || typeof key === 'number') {
      obj[key] = value;
    } else if ((typeof key === 'undefined' ? 'undefined' : babelHelpers.typeof(key)) === 'object') {
      Object.assign(obj, key);
    }

    return this._addOperation(field, '$put', obj);
  };

  /**
   * Pushes an item into a list
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */

  PartialUpdateBuilder.prototype.push = function push(field, item) {
    return this._addOperation(field, '$push', item);
  };

  /**
   * Unshifts an item into a list
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */

  PartialUpdateBuilder.prototype.unshift = function unshift(field, item) {
    return this._addOperation(field, '$unshift', item);
  };

  /**
   * Pops the last item out of a list
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */

  PartialUpdateBuilder.prototype.pop = function pop(field) {
    return this._addOperation(field, '$pop');
  };

  /**
   * Shifts the first item out of a list
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */

  PartialUpdateBuilder.prototype.shift = function shift(field) {
    return this._addOperation(field, '$shift');
  };

  /**
   * Adds an item to a set
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */

  PartialUpdateBuilder.prototype.add = function add(field, item) {
    return this._addOperation(field, '$add', item);
  };

  /**
   * Replaces an item at a given index
   *
   * @param {string} path The path to perform the operation on
   * @param {number} index The index where the item will be replaced
   * @param {*} item The item to replace with
   * @return {this}
   */

  PartialUpdateBuilder.prototype.replace = function replace(path, index, item) {
    if (this._hasOperationOnPath(path)) throw new Error('You cannot update ' + path + ' multiple times');

    return this._addOperation(path + '.' + index, '$replace', item);
  };

  /**
   * Sets a datetime field to the current moment
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */

  PartialUpdateBuilder.prototype.currentDate = function currentDate(field) {
    return this._addOperation(field, '$currentDate');
  };

  /**
   * Performs a bitwise AND on a path
   *
   * @param {string} path The path to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */

  PartialUpdateBuilder.prototype.and = function and(path, bitmask) {
    return this._addOperation(path, '$and', bitmask);
  };

  /**
   * Performs a bitwise OR on a path
   *
   * @param {string} path The path to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */

  PartialUpdateBuilder.prototype.or = function or(path, bitmask) {
    return this._addOperation(path, '$or', bitmask);
  };

  /**
   * Performs a bitwise XOR on a path
   *
   * @param {string} path The path to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */

  PartialUpdateBuilder.prototype.xor = function xor(path, bitmask) {
    return this._addOperation(path, '$xor', bitmask);
  };

  /**
   * Renames a field
   *
   * @param {string} oldPath The old field name
   * @param {string} newPath The new field name
   * @return {this}
   */

  PartialUpdateBuilder.prototype.rename = function rename(oldPath, newPath) {
    return this._addOperation(oldPath, '$rename', newPath);
  };

  /**
   * Returns a JSON representation of this partial update
   *
   * @return {json}
   */

  PartialUpdateBuilder.prototype.toJSON = function toJSON() {
    return this._operations.reduce(function (json, operation) {
      var obj = {};
      obj[operation.path] = operation.value;

      json[operation.name] = Object.assign({}, json[operation.name], obj);

      return json;
    }, {});
  };

  /**
   * Executes the partial update
   *
   * @return {Promise<T>} The promise resolves when the partial update has been executed successfully
   * @abstract
   */

  PartialUpdateBuilder.prototype.execute = function execute() {
    throw new Error('Cannot call "execute" on abstract PartialUpdateBuilder');
  };

  /**
   * Adds an update operation on the partial update
   *
   * @param {string} path The path which gets modified by the operation
   * @param {string} operator The operator of the operation to add
   * @param {*} [value] The value used to execute the operation
   * @return {this}
   * @private
   */

  PartialUpdateBuilder.prototype._addOperation = function _addOperation(path, operator, value) {
    if (typeof path !== 'string') {
      throw new Error('Path must be a string');
    }

    if (ALLOWED_OPERATIONS.indexOf(operator) === -1) {
      throw new Error('Operation invalid: ' + operator);
    }

    if (this._hasOperationOnPath(path)) {
      throw new Error('You cannot update ' + path + ' multiple times');
    }

    // Add the new operation
    this._operations.push(new UpdateOperation(operator, path, value || null));

    return this;
  };

  /**
   * Adds initial operations
   *
   * @param {json} json
   * @private
   */

  PartialUpdateBuilder.prototype._addOperations = function _addOperations(json) {
    var _this = this;

    Object.keys(json).forEach(function (key) {
      var pathValueDictionary = json[key];
      Object.keys(pathValueDictionary).forEach(function (path) {
        var value = pathValueDictionary[path];
        _this._operations.push(new UpdateOperation(key, path, value));
      });
    });
  };

  /**
   * Checks whether an operation on the field exists already
   *
   * @param {string} path The path where the operation is executed on
   * @return {boolean} True, if the operation does exist
   * @private
   */

  PartialUpdateBuilder.prototype._hasOperationOnPath = function _hasOperationOnPath(path) {
    return this._operations.some(function (op) {
      return op.path === path;
    });
  };

  return PartialUpdateBuilder;
}();

// aliases


Object.assign(PartialUpdateBuilder.prototype, /** @lends partialupdate.PartialUpdateBuilder<T>.prototype */{
  /**
   * Increments a field by a given value
   *
   * @method
   * @param {string} field The field to increment
   * @param {number=} by The number to increment by, defaults to 1
   * @return {this}
   */
  increment: PartialUpdateBuilder.prototype.inc,

  /**
   * Decrements a field by a given value
   *
   * @method
   * @param {string} field The field to decrement
   * @param {number=} by The number to decrement by, defaults to 1
   * @return {this}
   */
  decrement: PartialUpdateBuilder.prototype.dec,

  /**
   * Multiplies a field by a given number
   *
   * @method
   * @param {string} field The field to multiply
   * @param {number} multiplicator The number to multiply by
   * @return {this}
   */
  multiply: PartialUpdateBuilder.prototype.mul,

  /**
   * Divides a field by a given number
   *
   * @method
   * @param {string} field The field to divide
   * @param {number} divisor The number to divide by
   * @return {this}
   */
  divide: PartialUpdateBuilder.prototype.div,

  /**
   * Sets the highest possible value of a field
   *
   * @method
   * @param {string} field The field to compare with
   * @param {number} value The highest possible value
   * @return {this}
   */
  atMost: PartialUpdateBuilder.prototype.min,

  /**
   * Sets the smallest possible value of a field
   *
   * @method
   * @param {string} field The field to compare with
   * @param {number} value The smalles possible value
   * @return {this}
   */
  atLeast: PartialUpdateBuilder.prototype.max,

  /**
   * Sets a datetime field to the current moment
   *
   * @method
   * @param {string} field The field to perform the operation on
   * @return {this}
   */
  toNow: PartialUpdateBuilder.prototype.currentDate
});

module.exports = PartialUpdateBuilder;

},{"54":54}],54:[function(_dereq_,module,exports){
"use strict";

/**
 * @alias partialupdate.UpdateOperation
 */

var UpdateOperation =

/**
 * @param {string} operationName
 * @param {string} path
 * @param {*} [value]
 */
function UpdateOperation(operationName, path, value) {
  babelHelpers.classCallCheck(this, UpdateOperation);

  this.name = operationName;
  this.path = path;
  this.value = value;
};

module.exports = UpdateOperation;

},{}],55:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace partialupdate
 */

exports.EntityPartialUpdateBuilder = _dereq_(52);
exports.PartialUpdateBuilder = _dereq_(53);

},{"52":52,"53":53}],56:[function(_dereq_,module,exports){
"use strict";

var Filter = _dereq_(58);
var Condition = _dereq_(57);
var Operator = _dereq_(60);
var Query = _dereq_(61);
var varargs = Query.varargs;

/**
 * @alias query.Builder<T>
 * @extends query.Query<T>
 * @extends query.Condition<T>
 */

var Builder = function (_Query) {
  babelHelpers.inherits(Builder, _Query);

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   */
  function Builder(entityManager, resultClass) {
    babelHelpers.classCallCheck(this, Builder);
    return babelHelpers.possibleConstructorReturn(this, _Query.call(this, entityManager, resultClass));
  }

  /**
   * Joins the conditions by an logical AND
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical AND
   */

  Builder.prototype.and = function and(args) {
    return this._addOperator('$and', varargs(0, arguments));
  };

  /**
   * Joins the conditions by an logical OR
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical OR
   */

  Builder.prototype.or = function or(args) {
    return this._addOperator('$or', varargs(0, arguments));
  };

  /**
   * Joins the conditions by an logical NOR
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical NOR
   */

  Builder.prototype.nor = function nor(args) {
    return this._addOperator('$nor', varargs(0, arguments));
  };

  /**
   * @inheritDoc
   */

  Builder.prototype.eventStream = function eventStream(options, onNext, onError, onComplete) {
    return this.where({}).eventStream(options, onNext, onError, onComplete);
  };

  /**
   * @inheritDoc
   */

  Builder.prototype.resultStream = function resultStream(options, onNext, onError, onComplete) {
    return this.where({}).resultStream(options, onNext, onError, onComplete);
  };

  /**
   * @inheritDoc
   */

  Builder.prototype.resultList = function resultList(options, doneCallback, failCallback) {
    return this.where({}).resultList(options, doneCallback, failCallback);
  };

  /**
   * @inheritDoc
   */

  Builder.prototype.singleResult = function singleResult(options, doneCallback, failCallback) {
    return this.where({}).singleResult(options, doneCallback, failCallback);
  };

  /**
   * @inheritDoc
   */

  Builder.prototype.count = function count(doneCallback, failCallback) {
    return this.where({}).count(doneCallback, failCallback);
  };

  Builder.prototype._addOperator = function _addOperator(operator, args) {
    if (args.length < 2) {
      throw new Error('Only two or more queries can be joined with an ' + operator + ' operator.');
    }

    args.forEach(function (arg, index) {
      if (!(arg instanceof Query)) {
        throw new Error('Argument at index ' + index + ' is not a query.');
      }
    });

    return new Operator(this.entityManager, this.resultClass, operator, args);
  };

  Builder.prototype._addOrder = function _addOrder(fieldOrSort, order) {
    return new Filter(this.entityManager, this.resultClass)._addOrder(fieldOrSort, order);
  };

  Builder.prototype._addFilter = function _addFilter(field, filter, value) {
    return new Filter(this.entityManager, this.resultClass)._addFilter(field, filter, value);
  };

  Builder.prototype._addOffset = function _addOffset(offset) {
    return new Filter(this.entityManager, this.resultClass)._addOffset(offset);
  };

  Builder.prototype._addLimit = function _addLimit(limit) {
    return new Filter(this.entityManager, this.resultClass)._addLimit(limit);
  };

  return Builder;
}(Query);

Object.assign(Builder.prototype, Condition);

module.exports = Builder;

},{"57":57,"58":58,"60":60,"61":61}],57:[function(_dereq_,module,exports){
"use strict";

var varargs = _dereq_(61).varargs;

/**
 * @class query.Condition<T>
 */
var Condition = {};

Object.assign(Condition, /** @lends query.Condition<T>.prototype */{

  /**
   * An object, that contains filter rules which will be merged with the current filters of this query.
   * @param {json} conditions - Additional filters for this query
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  where: function where(conditions) {
    return this._addFilter(null, null, conditions);
  },

  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  equal: function equal(field, value) {
    return this._addFilter(field, null, value);
  },

  /**
   * Adds a not equal filter to the field.
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/ne/
   */
  notEqual: function notEqual(field, value) {
    return this._addFilter(field, "$ne", value);
  },

  /**
   * Adds a greater than filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  greaterThan: function greaterThan(field, value) {
    return this._addFilter(field, "$gt", value);
  },

  /**
   * Adds a greater than or equal to filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  greaterThanOrEqualTo: function greaterThanOrEqualTo(field, value) {
    return this._addFilter(field, "$gte", value);
  },

  /**
   * Adds a less than filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lessThan: function lessThan(field, value) {
    return this._addFilter(field, "$lt", value);
  },

  /**
   * Adds a less than or equal to filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  lessThanOrEqualTo: function lessThanOrEqualTo(field, value) {
    return this._addFilter(field, "$lte", value);
  },

  /**
   * Adds a between filter to the field. This is a shorthand for an less than and greater than filter.
   * @param {string} field The field to filter
   * @param {number|string|Date} lessValue The field value must be greater than this value
   * @param {number|string|Date} greaterValue The field value must be less than this value
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  between: function between(field, lessValue, greaterValue) {
    return this._addFilter(field, "$gt", lessValue)._addFilter(field, "$lt", greaterValue);
  },

  /**
   * Adds a in filter to the field. The field value must be equal to one of the given values
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  'in': function _in(field, args) {
    return this._addFilter(field, "$in", varargs(1, arguments));
  },

  /**
   * Adds a in filter to the field. The field value must be equal to one of the given values
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   * @memberOf query.Condition<T>.prototype
   * @name in
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */

  /**
   * Adds a not in filter to the field. The field value must not be equal to any of the given values
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notIn: function notIn(field, args) {
    return this._addFilter(field, "$nin", varargs(1, arguments));
  },

  /**
   * Adds a null filter to the field. The field value must be null
   * @param {string} field The field to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  isNull: function isNull(field) {
    return this.equal(field, null);
  },

  /**
   * Adds a not null filter to the field. The field value must not be null
   * @param {string} field The field to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  isNotNull: function isNotNull(field) {
    return this._addFilter(field, "$exists", true)._addFilter(field, "$ne", null);
  },

  /**
   * Adds a contains all filter to the collection field. The collection must contain all the given values.
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/all/
   */
  containsAll: function containsAll(field, args) {
    return this._addFilter(field, "$all", varargs(1, arguments));
  },

  /**
   * Adds a modulo filter to the field. The field value divided by divisor must be equal to the remainder.
   * @param {string} field The field to filter
   * @param {number} divisor The divisor of the modulo filter
   * @param {number} remainder The remainder of the modulo filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/mod/
   */
  mod: function mod(field, divisor, remainder) {
    return this._addFilter(field, "$mod", [divisor, remainder]);
  },

  /**
   * Adds a regular expression filter to the field. The field value must matches the regular expression.
   * <p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p>
   * @param {string} field The field to filter
   * @param {string|RegExp} regExp The regular expression of the filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/regex/
   */
  matches: function matches(field, regExp) {
    if (!(Object(regExp) instanceof RegExp)) {
      regExp = new RegExp(regExp);
    }

    if (regExp.ignoreCase) {
      throw new Error('RegExp.ignoreCase flag is not supported.');
    }

    if (regExp.global) {
      throw new Error('RegExp.global flag is not supported.');
    }

    if (regExp.source.indexOf('^') != 0) {
      throw new Error('regExp must be an anchored expression, i.e. it must be started with a ^.');
    }

    var result = this._addFilter(field, '$regex', regExp.source);
    if (regExp.multiline) {
      result._addFilter(field, '$options', 'm');
    }

    return result;
  },

  /**
   * Adds a size filter to the collection field. The collection must have exactly size members.
   * @param {string} field The field to filter
   * @param {number} size The collections size to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/size/
   */
  size: function size(field, _size) {
    return this._addFilter(field, "$size", _size);
  },

  /**
   * Adds a geopoint based near filter to the GeoPoint field. The GeoPoint must be within the maximum distance
   * to the given GeoPoint. Returns from nearest to farthest.
   * @param {string} field The field to filter
   * @param {GeoPoint} geoPoint The GeoPoint to filter
   * @param {number} maxDistance Tha maximum distance to filter in meters
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nearSphere/
   */
  near: function near(field, geoPoint, maxDistance) {
    return this._addFilter(field, "$nearSphere", {
      $geometry: {
        type: "Point",
        coordinates: [geoPoint.longitude, geoPoint.latitude]
      },
      $maxDistance: maxDistance
    });
  },

  /**
   * Adds a GeoPoint based polygon filter to the GeoPoint field. The GeoPoint must be contained within the polygon.
   * @param {string} field The field to filter
   * @param {...(GeoPoint|Array<GeoPoint>)} geoPoints The geoPoints that describes the polygon of the filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/geoWithin/
   */
  withinPolygon: function withinPolygon(field, geoPoints) {
    geoPoints = varargs(1, arguments);
    return this._addFilter(field, "$geoWithin", {
      $geometry: {
        type: "Polygon",
        coordinates: [geoPoints.map(function (geoPoint) {
          return [geoPoint.longitude, geoPoint.latitude];
        })]
      }
    });
  }
});

// aliases
Object.assign(Condition, /** @lends query.Condition<T>.prototype */{
  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @method
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   */
  eq: Condition.equal,

  /**
   * Adds a not equal filter to the field.
   * @method
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/ne/
   */
  ne: Condition.notEqual,

  /**
   * Adds a less than filter to the field. Shorthand for {@link query.Condition#lessThan}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lt: Condition.lessThan,

  /**
   * Adds a less than or equal to filter to the field. Shorthand for {@link query.Condition#lessThanOrEqualTo}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  le: Condition.lessThanOrEqualTo,

  /**
   * Adds a greater than filter to the field. Shorthand for {@link query.Condition#greaterThan}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  gt: Condition.greaterThan,

  /**
   * Adds a greater than or equal to filter to the field. Shorthand for {@link query.Condition#greaterThanOrEqualTo}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  ge: Condition.greaterThanOrEqualTo,

  /**
   * Adds a contains any filter to the collection field. The collection must contains one the given values.
   * Alias for {@link query.Condition#in}
   * @method
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  containsAny: Condition.in
});

module.exports = Condition;

},{"61":61}],58:[function(_dereq_,module,exports){
"use strict";

var Node = _dereq_(59);
var Condition = _dereq_(57);

/**
 * @alias query.Filter<T>
 * @extends query.Node<T>
 * @extends query.Condition<T>
 */

var Filter = function (_Node) {
  babelHelpers.inherits(Filter, _Node);

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   */
  function Filter(entityManager, resultClass) {
    babelHelpers.classCallCheck(this, Filter);

    /**
     * The actual filters of this node
     * @type Object
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _Node.call(this, entityManager, resultClass));

    _this._filter = {};
    return _this;
  }

  Filter.prototype._addFilter = function _addFilter(field, filter, value) {
    if (field !== null) {
      if (!(Object(field) instanceof String)) throw new Error('Field must be a string.');

      if (filter) {
        var fieldFilter = this._filter[field];
        if (!(fieldFilter instanceof Object) || Object.getPrototypeOf(fieldFilter) != Object.prototype) {
          this._filter[field] = fieldFilter = {};
        }

        fieldFilter[filter] = value;
      } else {
        this._filter[field] = value;
      }
    } else {
      Object.assign(this._filter, value);
    }

    return this;
  };

  Filter.prototype.toJSON = function toJSON() {
    return this._filter;
  };

  return Filter;
}(Node);

Object.assign(Filter.prototype, Condition);
module.exports = Filter;

},{"57":57,"59":59}],59:[function(_dereq_,module,exports){
"use strict";

var Query = _dereq_(61);
var message = _dereq_(35);
var Metadata = _dereq_(66);
var Entity = _dereq_(10);

/**
 * @alias query.Node<T>
 * @extends query.Query<T>
 */

var Node = function (_Query) {
  babelHelpers.inherits(Node, _Query);

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   */
  function Node(entityManager, resultClass) {
    babelHelpers.classCallCheck(this, Node);

    /**
     * The offset how many results should be skipped
     * @type number
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _Query.call(this, entityManager, resultClass));

    _this.firstResult = 0;

    /**
     * The limit how many objects should be returned
     * @type number
     */
    _this.maxResults = -1;

    _this._sort = {};
    return _this;
  }

  /**
   * @inheritDoc
   */

  Node.prototype.eventStream = function eventStream() {
    throw new Error('Streaming features not available! Please use Streaming SDK!');
  };

  /**
   * @inheritDoc
   */

  Node.prototype.resultStream = function resultStream() {
    throw new Error('Streaming features not available! Please use Streaming SDK!');
  };

  /**
   * @inheritDoc
   */

  Node.prototype.resultList = function resultList(options, doneCallback, failCallback) {
    var _this2 = this;

    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    var query = this._serializeQuery();
    var sort = this._serializeSort();

    var uriSize = this.entityManager._connector.host.length + query.length + sort.length;
    var msg = void 0;
    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, this.firstResult, this.maxResults, sort).entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, this.maxResults, sort);
    }

    return this.entityManager.send(msg).then(function (response) {
      return _this2._createResultList(response.entity, options);
    }).then(doneCallback, failCallback);
  };

  /**
   * @inheritDoc
   */

  Node.prototype.singleResult = function singleResult(options, doneCallback, failCallback) {
    var _this3 = this;

    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    var query = this._serializeQuery();
    var sort = this._serializeSort();

    var uriSize = this.entityManager._connector.host.length + query.length;
    var msg = void 0;
    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, query, this.firstResult, 1, sort).entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, 1, sort);
    }

    return this.entityManager.send(msg).then(function (response) {
      return _this3._createResultList(response.entity, options);
    }).then(function (list) {
      return list.length ? list[0] : null;
    }).then(doneCallback, failCallback);
  };

  /**
   * @inheritDoc
   */

  Node.prototype.count = function count(doneCallback, failCallback) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    var query = this._serializeQuery();

    var uriSize = this.entityManager._connector.host.length + query.length;
    var msg = void 0;
    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocCountQueryPOST(type.name).entity(query, 'text');
    } else {
      msg = new message.AdhocCountQuery(type.name, query);
    }

    return this.entityManager.send(msg).then(function (response) {
      return response.entity.count;
    }).then(doneCallback, failCallback);
  };

  Node.prototype._serializeQuery = function _serializeQuery() {
    return JSON.stringify(this, function (k, v) {
      var typedValue = this[k];
      if (Object(typedValue) instanceof Date) {
        return { $date: v };
      } else if (typedValue instanceof Entity) {
        return typedValue.id;
      } else {
        return v;
      }
    });
  };

  Node.prototype._serializeSort = function _serializeSort() {
    return JSON.stringify(this._sort);
  };

  Node.prototype._createResultList = function _createResultList(result, options) {
    if (result.length) {
      return Promise.all(result.map(function (el) {
        if (el.id) {
          var entity = this.entityManager.getReference(this.resultClass, el.id);
          var metadata = Metadata.get(entity);
          metadata.setJson(el, { persisting: true });
          return this.entityManager.resolveDepth(entity, options);
        } else {
          return this.entityManager.load(Object.keys(el)[0]);
        }
      }, this)).then(function (result) {
        return result.filter(function (val) {
          return !!val;
        });
      });
    } else {
      return Promise.resolve([]);
    }
  };

  Node.prototype._addOrder = function _addOrder(fieldOrSort, order) {
    if (order) {
      this._sort[fieldOrSort] = order;
    } else {
      this._sort = fieldOrSort;
    }
    return this;
  };

  Node.prototype._addOffset = function _addOffset(offset) {
    this.firstResult = offset;
    return this;
  };

  Node.prototype._addLimit = function _addLimit(limit) {
    this.maxResults = limit;
    return this;
  };

  return Node;
}(Query);

module.exports = Node;

},{"10":10,"35":35,"61":61,"66":66}],60:[function(_dereq_,module,exports){
"use strict";

var Node = _dereq_(59);

/**
 * @alias query.Operator<T>
 * @extends query.Node<T>
 */

var Operator = function (_Node) {
  babelHelpers.inherits(Operator, _Node);

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   * @param {string} operator The operator used to join the childs
   * @param {Array<query.Node<T>>} childs The childs to join
   */
  function Operator(entityManager, resultClass, operator, childs) {
    babelHelpers.classCallCheck(this, Operator);

    /**
     * The operator used to join the child queries
     * @type string
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _Node.call(this, entityManager, resultClass));

    _this._operator = operator;
    /**
     * The child Node of this query, it is always one
     * @type Array<query.Node>
     */
    _this._childs = childs;
    return _this;
  }

  Operator.prototype.toJSON = function toJSON() {
    var json = {};
    json[this._operator] = this._childs;
    return json;
  };

  return Operator;
}(Node);

module.exports = Operator;

},{"59":59}],61:[function(_dereq_,module,exports){
"use strict";

/**
 * @alias query.Query<T>
 */

var Query = function () {
  function Query(entityManager, resultClass) {
    babelHelpers.classCallCheck(this, Query);

    /**
     * The owning EntityManager of this query
     * @type EntityManager
     */
    this.entityManager = entityManager;

    /**
     * The result class of this query
     * @type Class<T>
     */
    this.resultClass = resultClass;
  }

  /**
   * Add an ascending sort for the specified field to this query
   * @param {string} field The field to sort
   * @return {query.Query<T>} The resulting Query
   */

  Query.prototype.ascending = function ascending(field) {
    return this._addOrder(field, 1);
  };

  /**
   * Add an decending sort for the specified field to this query
   * @param {string} field The field to sort
   * @return {query.Query<T>} The resulting Query
   */

  Query.prototype.descending = function descending(field) {
    return this._addOrder(field, -1);
  };

  /**
   * Sets the sort of the query and discard all existing paramaters
   * @param {Object} sort The new sort of the query
   * @return {query.Query<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   */

  Query.prototype.sort = function sort(_sort) {
    if (!(_sort instanceof Object) || Object.getPrototypeOf(_sort) != Object.prototype) throw new Error('sort must be an object.');

    return this._addOrder(_sort);
  };

  /**
   * Sets the offset of the query, i.e. how many elements should be skipped
   * @param {number} offset The offset of this query
   * @return {query.Query<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.skip/
   */

  Query.prototype.offset = function offset(_offset) {
    if (_offset < 0) throw new Error("The offset can't be nagative.");

    return this._addOffset(_offset);
  };

  /**
   * Sets the limit of this query, i.e hox many objects should be returnd
   * @param {number} limit The limit of this query
   * @return {query.Query<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.limit/
   */

  Query.prototype.limit = function limit(_limit) {
    if (_limit < 0) throw new Error("The limit can't be nagative.");

    return this._addLimit(_limit);
  };

  /**
   * Execute the query and return the query results as a List.
   * Note: All local unsaved changes on matching objects, will be discarded.
   * @param {Object} [options] The query options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * objects, <code>true</code> loads the objects by reachability.
   * @param {query.Query~resultListCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<Array<T>>} A promise that will be resolved with the query result as a list
   */

  Query.prototype.resultList = function resultList(options, doneCallback, failCallback) {};

  /**
   * Execute the query and return the query results as a List.
   * Note: All local unsaved changes on matching objects, will be discarded.
   * @param {query.Query~resultListCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<Array<T>>} A promise that will be resolved with the query result as a list
   * @name resultList
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Execute the query that returns a single result.
   * Note: All local unsaved changes on the matched object, will be discarded.
   * @param {Object} [options] The query options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * object, <code>true</code> loads the objects by reachability.
   * @param {query.Query~singleResultCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A promise that will be resolved with the query result as a single result
   */

  Query.prototype.singleResult = function singleResult(options, doneCallback, failCallback) {};

  /**
   * Execute the query that returns a single result.
   * Note: All local unsaved changes on the matched object, will be discarded.
   * @param {query.Query~singleResultCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A promise that will be resolved with the query result as a single result
   * @name singleResult
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Returns an observable that receives change events for a real-time query. Multiple subscriptions can be created on top of this observable:
   *
   <pre><code>
   var query = DB.Todo.find();
   var options = { ... };
   var stream = query.eventStream(options);
   var sub = stream.subscribe(onNext, onError, onComplete);
   var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);
   </code></pre>
   *
   * @param {Object} [options] options to narrow down the events you will receive
   * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the entities matching the query at subscription time)
   * @param {(string|Array<string>)} [options.matchTypes=['all']] the match types you are interested in; accepts the default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
   * @param {(string|Array<string>)} [options.operations=['any']] the operations you are interested in; accepts the default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
   * @return {Observable<RealtimeEvent<T>>} an observable
   */

  Query.prototype.eventStream = function eventStream(options) {};

  /**
   * Returns a subscription that handles change events for a real-time query.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #eventStream(options)}).
    * @param {Object} [options] options to narrow down the events you will receive
   * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the entities matching the query at subscription time)
   * @param {(string|Array<string>)} [options.matchTypes=['all']] the match types you are interested in; accepts the default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
   * @param {(string|Array<string>)} [options.operations=['any']] the operations you are interested in; accepts the default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
   * @param {query.Query~nextEventCallback=} onNext Called when an event is received
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @param {query.Query~completeCallback=} onComplete Called when the network connection is closed (e.g. because of lost Wi-Fi connection)
   * @return {Subscription} a real-time query subscription
   * @name eventStream
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Returns a subscription that handles change events for a real-time query.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #eventStream(options)}).
    * @param {query.Query~nextEventCallback=} onNext Called when an event is received
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @param {query.Query~completeCallback=} onComplete Called when the network connection is closed (e.g. because of lost Wi-Fi connection)
   * @return {Subscription} a real-time query subscription
   * @name eventStream
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Returns an observable that receives the complete real-time query result. The full result is received initially (i.e. on subscription) and on every change.
   *Will
   var query = DB.Todo.find();
   var stream = query.resultStream();
   var sub = stream.subscribe(onNext, onError, onComplete);
   var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);
   </code></pre>
   *
   * @param {Object} [options] additional options
   * @param {number} [options.reconnects=-1] the number of times that a real-time query subscription should be renewed after connection loss, before it is downgraded to a regular query that does not maintain itself; negative numbers represent infinite reconnection attempts
   * @return {Observable<Array<T>>} an observable on which multiple subscriptions can be created on
   */

  Query.prototype.resultStream = function resultStream(options) {};

  /**
   * Returns a subscription that handles the complete real-time query result. The full result is received initially (i.e. on subscription) and on every change.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #resultStream(options)}).
   *
   * @param {Object} [options] additional options
   * @param {number} [options.reconnects=-1] the number of times that a real-time query subscription should be renewed after connection loss, before it is downgraded to a regular query that does not maintain itself; negative numbers represent infinite reconnection attempts
   * @param {query.Query~nextResultCallback=} onNext Called when the query result changes in any way
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @param {query.Query~completeCallback=} onComplete Called when the network connection is closed (e.g. because of network timeout or lost Wi-Fi connection) and the specified number of reconnects have been exhausted; will never be called when infinite reconnects are configured (default)
   * @return {Subscription} a real-time query subscription handling complete query results.
   * @name resultStream
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Returns a subscription that handles the complete real-time query result. The full result is received initially (i.e. on subscription) and on every change.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #resultStream(options)}).
   *
   * As the real-time query will reconnect infinitely often, there is no onComplete callback. (In other words, the observable will never complete.)
   *
   * @param {query.Query~nextResultCallback=} onNext Called when the query result changes in any way
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @return {Subscription} a real-time query subscription handling complete query results.
   * @name resultStream
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Execute the query that returns the matching objects count.
   * @param {query.Query~countCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when there is a server-side error
   * @return {Promise<number>} The total number of matched objects
   */

  Query.prototype.count = function count(doneCallback, failCallback) {};

  return Query;
}();

Query.MAX_URI_SIZE = 2000;

Query.varargs = function varargs(offset, args) {
  return Array.prototype.concat.apply([], Array.prototype.slice.call(args, offset));
};

module.exports = Query;

/**
 * The resultList callback is called, when the asynchronous query operation completes successfully
 * @callback query.Query~resultListCallback
 * @param {Array<T>} result The query result list, an empty list if no match was found
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The singleResult callback is called, when the asynchronous query operation completes successfully
 * @callback query.Query~singleResultCallback
 * @param {T} entity The matching object or null id no matching object was found
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The count callback is called, when the asynchronous query operation completes successfully
 * @callback query.Query~countCallback
 * @param {number} count the matching object count
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous query operation is rejected by an error
 * @callback query.Query~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * This callback is called whenever the result of the real-time query changes. The received event contains information on how the query result changed.
 * @callback query.Query~nextEventCallback
 * @param {RealtimeEvent<T>} event The real-time query event
 */

/**
 * This callback is called whenever the result of the real-time query changes. The full result set is received.
 * @callback query.Query~nextResultCallback
 * @param {Array<T>} result The updated real-time query result
 */

/**
 * This callback is called when the network connection is closed (e.g. because of network timeout or lost Wi-Fi connection)
 * @callback query.Query~completeCallback
 */

},{}],62:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace query
 */

exports.Builder = _dereq_(56);
exports.Condition = _dereq_(57);
exports.Filter = _dereq_(58);
exports.Node = _dereq_(59);
exports.Operator = _dereq_(60);
exports.Query = _dereq_(61);

},{"56":56,"57":57,"58":58,"59":59,"60":60,"61":61}],63:[function(_dereq_,module,exports){
"use strict";

var message = _dereq_(35);
var StatusCode = _dereq_(25).StatusCode;

/**
 * @alias util.Code
 * @param {metamodel.Metamodel} metamodel
 */

var Code = function () {
  function Code(metamodel, entityManagerFactory) {
    babelHelpers.classCallCheck(this, Code);

    /**
     * @private
     * @type metamodel.Metamodel
     */
    this._metamodel = metamodel;
    /** @type EntityManagerFactory */
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Converts the given function to a string
   * @param {Function} fn The JavaScript function to serialize
   * @return {string} The serialized function
   */

  Code.prototype.functionToString = function functionToString(fn) {
    if (!fn) return "";

    var str = fn.toString();
    str = str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
    if (str.charAt(0) == '\n') str = str.substring(1);

    if (str.charAt(str.length - 1) == '\n') str = str.substring(0, str.length - 1);

    return str;
  };

  /**
   * Converts the given string to a module wrapper function
   * @param {Array<string>} signature The expected parameters of the function
   * @param {string} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */

  Code.prototype.stringToFunction = function stringToFunction(signature, code) {
    return new Function(signature, code);
  };

  /**
   * Loads a list of all available modules
   * Does not include handlers
   *
   * @returns {Promise<Array<string>>}
   */

  Code.prototype.loadModules = function loadModules() {
    var msg = new message.GetAllModules();
    return this.entityManagerFactory.send(msg).then(function (response) {
      return response.entity;
    });
  };

  /**
   * Loads Baqend code which will be identified by the given bucket and code codeType
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @param {boolean} [asFunction=false] set it to <code>true</code>, to parse the code as a function and return it
   * instead of a string
   * @returns {Promise<string|Function>} The code as string or as a parsed function
   */

  Code.prototype.loadCode = function loadCode(type, codeType, asFunction) {
    var _this = this;

    var bucket = Object(type) instanceof String ? type : type.name;
    var msg = new message.GetBaqendCode(bucket, codeType).responseType('text');

    return this.entityManagerFactory.send(msg).then(function (response) {
      return _this._parseCode(bucket, codeType, asFunction, response.entity);
    }, function (e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) return null;

      throw e;
    });
  };

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @param {string|Function} fn Baqend code as a string or function
   * @return {Promise<string|Function>} The stored code as a string or as a parsed function
   */

  Code.prototype.saveCode = function saveCode(type, codeType, fn) {
    var _this2 = this;

    var bucket = Object(type) instanceof String ? type : type.name;
    var asFunction = fn instanceof Function;

    var msg = new message.SetBaqendCode(bucket, codeType).entity(asFunction ? this.functionToString(fn) : fn, 'text').responseType('text');

    return this.entityManagerFactory.send(msg).then(function (response) {
      return _this2._parseCode(bucket, codeType, asFunction, response.entity);
    });
  };

  /**
   * Deletes Baqend code identified by the given bucket and code type
   *
   * @param {metamodel.ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @returns {Promise<*>} succeed if the code was deleted
   */

  Code.prototype.deleteCode = function deleteCode(type, codeType) {
    var _this3 = this;

    var bucket = Object(type) instanceof String ? type : type.name;
    var msg = new message.DeleteBaqendCode(bucket, codeType);
    return this.entityManagerFactory.send(msg).then(function () {
      return _this3._parseCode(bucket, codeType, false, null);
    });
  };

  Code.prototype._parseCode = function _parseCode(bucket, codeType, asFunction, code) {
    if (codeType == 'validate') {
      var type = this._metamodel.entity(bucket);
      type.validationCode = code;
      return asFunction ? type.validationCode : code;
    } else {
      return asFunction ? this.stringToFunction(['module', 'exports'], code) : code;
    }
  };

  return Code;
}();

module.exports = Code;

},{"25":25,"35":35}],64:[function(_dereq_,module,exports){
"use strict";

/**
 * This base class provides an lock interface to execute exclusive operations
 * @alias util.Lockable
 */

var Lockable = function () {
  function Lockable() {
    babelHelpers.classCallCheck(this, Lockable);

    /**
     * Indicates if there is currently an onging exclusive operation
     * @type boolean
     * @private
     */
    this._isLocked = false;

    /**
     * A promise which represents the state of the least exclusive operation
     * @type Promise
     * @private
     */
    this._readyPromise = Promise.resolve(this);

    /**
     * A deferred used to explicit lock and unlock this instance
     * @private
     */
    this._deferred = null;
  }

  /**
   * Indicates if there is currently no exclusive operation executed
   * <code>true</code> If no exclusive lock is hold
   * @type {boolean}
   */

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {util.Lockable~doneCallback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @param {util.Lockable~failCallback=} failCallback When the lock can't be released caused by a none
   * recoverable error
   * @return {Promise<this>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  Lockable.prototype.ready = function ready(doneCallback, failCallback) {
    return this._readyPromise.then(doneCallback, failCallback);
  };

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param {util.Lockable~callback} callback The exclusive operation to execute
   * @param {boolean} [critical=false] Indicates if the operation is critical. If the operation is critical and the
   * operation fails, then the lock will not be released
   * @return {Promise<T>} A promise
   * @throws {Error} If the lock can't be aquired
   * @alias util.Lockable.prototype.withLock<T>
   * @protected
   */

  Lockable.prototype.withLock = function withLock(callback, critical) {
    var _this = this;

    if (this._isLocked) throw new Error('Current operation has not been finished.');

    try {
      this._isLocked = true;
      var result = callback().then(function (result) {
        _this._isLocked = false;
        return result;
      }, function (e) {
        if (!critical) _this._isLocked = false;
        throw e;
      });

      this._readyPromise = result.then(function () {
        return _this;
      }, function (e) {
        if (!critical) return _this;
        throw e;
      });

      return result;
    } catch (e) {
      if (critical) {
        this._readyPromise = Promise.reject(e);
      } else {
        this._isLocked = false;
      }
      throw e;
    }
  };

  babelHelpers.createClass(Lockable, [{
    key: "isReady",
    get: function get() {
      return !this._isLocked;
    }
  }]);
  return Lockable;
}();

module.exports = Lockable;

/**
 * The operation callback is used by the {@link util.Lockable#withLock} method,
 * to perform an exclusive operation on the 
 * @callback util.Lockable~callback
 * @return {Promise<T>} A Promise, which reflects the result of the operation
 */

/**
 * The done callback is called, when the last operation on this object completes
 * @callback util.Lockable~doneCallback
 * @param {this} entity This entity instance
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the last critical operation on this object fails
 * @callback util.Lockable~failCallback
 * @param {Error} error The error which reject the operation
 * @return {Promise<*>|*} A Promise, result or undefined
 */

},{}],65:[function(_dereq_,module,exports){
"use strict";

var message = _dereq_(35);
var StatusCode = _dereq_(25).StatusCode;

/**
 * @alias util.Logger
 */

var Logger = function () {
  function Logger() {
    babelHelpers.classCallCheck(this, Logger);
  }

  Logger.create = function create(entityManager) {
    var proto = this.prototype;

    function Logger() {
      proto.log.apply(Logger, arguments);
    }

    for (var _iterator = Object.getOwnPropertyNames(proto), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var key = _ref;

      Object.defineProperty(Logger, key, Object.getOwnPropertyDescriptor(proto, key));
    }Logger._init(entityManager);

    return Logger;
  };

  /**
   * The log level which will be logged
   *
   * The log level can be one of 'trace', 'debug', 'info', 'warn', 'error'
   * @type string
   */

  /**
   * Logs a message in the default level 'info'
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   *
   * @name log
   * @memberOf util.Logger.prototype
   * @function
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Logs a message in the default level 'info'
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   *
   * @name log
   * @memberOf util.Logger.prototype
   * @function
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Logs a message with the given log level
   * @param {string} level The level used to log the message
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @name log
   * @memberOf util.Logger.prototype
   * @function
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Logs a message with the given log level
   * @param {string} level The level used to log the message
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  Logger.prototype.log = function log(level, message, data) {
    var args = Array.prototype.slice.call(arguments);

    if (Logger.LEVELS.indexOf(args[0]) == -1) {
      level = 'info';
    } else {
      level = args.shift();
    }

    if (this.levelIndex > Logger.LEVELS.indexOf(level)) return;

    message = typeof args[0] === 'string' ? this._format(args.shift(), args) : '[no message]';
    data = null;
    if (args.length && babelHelpers.typeof(args[args.length - 1]) === 'object') {
      data = args.pop();
      if (Array.isArray(data)) data = { data: data };
    }

    if (args.length) {
      message += ", " + args.join(", ");
    }

    return this._log({
      date: new Date(),
      message: message,
      level: level,
      user: this.entityManager.me && this.entityManager.me.id,
      data: data
    });
  };

  Logger.prototype._format = function _format(f, args) {
    if (args.length == 0) return f;

    var str = String(f).replace(Logger.FORMAT_REGEXP, function (x) {
      if (x === '%%') return '%';
      if (!args.length) return x;
      switch (x) {
        case '%s':
          return String(args.shift());
        case '%d':
          return Number(args.shift());
        case '%j':
          try {
            return JSON.stringify(args.shift());
          } catch (_) {
            return '[Circular]';
          }
        default:
          return x;
      }
    });

    return str;
  };

  Logger.prototype._init = function _init(entityManager) {
    var _this = this;

    /** @type EntityManager */
    this.entityManager = entityManager;
    this.levelIndex = 2;

    Logger.LEVELS.forEach(function (level) {
      _this[level] = _this.log.bind(_this, level);
    });
  };

  Logger.prototype._log = function _log(json) {
    if (!this.entityManager.isReady) {
      return this.entityManager.ready(this._log.bind(this, json));
    } else {
      return this.entityManager.send(new message.CreateObject('logs.AppLog', json));
    }
  };

  /**
   * Log message at trace level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @function trace
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at trace level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @function trace
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at debug level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @function debug
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at debug level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @function debug
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at info level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @function info
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at info level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @function info
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at warn level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @function warn
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at warn level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @function warn
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at error level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @function error
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at error level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @function error
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  babelHelpers.createClass(Logger, [{
    key: 'level',
    get: function get() {
      return Logger.LEVELS[this.levelIndex];
    }

    /**
     * Sets the log level which will be logged
     * @param {string} value
     */

    , set: function set(value) {
      var index = Logger.LEVELS.indexOf(value);
      if (index == -1) throw new Error("Unknown logging level " + value);

      this.levelIndex = index;
    }
  }]);
  return Logger;
}();

Object.assign(Logger, {
  LEVELS: ['trace', 'debug', 'info', 'warn', 'error'],
  FORMAT_REGEXP: /%[sdj%]/g
});

module.exports = Logger;

},{"25":25,"35":35}],66:[function(_dereq_,module,exports){
"use strict";

var error = _dereq_(33);
var Acl = _dereq_(1);
var Lockable = _dereq_(64);
var binding = _dereq_(20);

/**
 * @alias util.Metadata
 * @extends util.Lockable
 */

var Metadata = function (_Lockable) {
  babelHelpers.inherits(Metadata, _Lockable);

  Metadata.create = function create(type, object) {
    var metadata = void 0;
    if (type.isEntity) {
      metadata = new Metadata(object, type);
    } else if (type.isEmbeddable) {
      metadata = {
        type: type,
        readAccess: function readAccess() {
          var metadata = this._root && this._root._metadata;
          if (metadata) metadata.readAccess();
        },
        writeAccess: function writeAccess() {
          var metadata = this._root && this._root._metadata;
          if (metadata) metadata.writeAccess();
        }
      };
    } else {
      throw new Error('Illegal type ' + type);
    }

    return metadata;
  };

  /**
   * Returns the metadata of the managed object
   * @param {binding.Managed} managed
   * @return {util.Metadata}
   */

  Metadata.get = function get(managed) {
    return managed._metadata;
  };

  /**
   * @type EntityManager
   */

  babelHelpers.createClass(Metadata, [{
    key: 'db',
    get: function get() {
      if (this._db) return this._db;

      return this._db = _dereq_(6);
    }

    /**
     * @param db {EntityManager}
     */

    , set: function set(db) {
      if (!this._db) {
        this._db = db;
      } else {
        throw new Error("DB has already been set.");
      }
    }

    /**
     * @type string
     */

  }, {
    key: 'bucket',
    get: function get() {
      return this.type.name;
    }

    /**
     * @type string
     */

  }, {
    key: 'key',
    get: function get() {
      if (!this._key && this.id) {
        var index = this.id.lastIndexOf('/');
        this._key = decodeURIComponent(this.id.substring(index + 1));
      }
      return this._key;
    }

    /**
     * @param {string} value
     */

    , set: function set(value) {
      value += '';

      if (this.id) throw new Error('The id can\'t be set twice.');

      this.id = '/db/' + this.bucket + '/' + encodeURIComponent(value);
      this._key = value;
    }

    /**
     * Indicates if this object already belongs to an db
     * <code>true</code> if this object belongs already to an db otherwise <code>false</code>
     * @type boolean
     */

  }, {
    key: 'isAttached',
    get: function get() {
      return !!this._db;
    }

    /**
     * Indicates if this object is represents a db object, but was not loaded up to now
     * @type boolean
     */

  }, {
    key: 'isAvailable',
    get: function get() {
      return this._state > Metadata.Type.UNAVAILABLE;
    }

    /**
     * Indicates if this object represents the state of the db and was not modified in any manner
     * @type boolean
     */

  }, {
    key: 'isPersistent',
    get: function get() {
      return this._state == Metadata.Type.PERSISTENT;
    }

    /**
     * Indicates that this object was modified and the object was not written back to the db
     * @type boolean
     */

  }, {
    key: 'isDirty',
    get: function get() {
      return this._state == Metadata.Type.DIRTY;
    }

    /**
     * @param {binding.Entity} entity
     * @param {metamodel.ManagedType} type
     */

  }]);

  function Metadata(entity, type) {
    babelHelpers.classCallCheck(this, Metadata);

    /**
     * @type binding.Entity
     * @private
     */
    var _this = babelHelpers.possibleConstructorReturn(this, _Lockable.call(this));

    _this._root = entity;
    _this._state = Metadata.Type.DIRTY;
    _this._enabled = true;
    /** @type string */
    _this.id = null;
    /** @type number */
    _this.version = null;
    /** @type metamodel.ManagedType */
    _this.type = type;
    /** @type Acl */
    _this.acl = new Acl(_this);
    return _this;
  }

  /**
   * Enable/Disable state change tracking of this object
   * @param {boolean} newStateTrackingState The new change tracking state
   */

  Metadata.prototype.enable = function enable(newStateTrackingState) {
    this._enabled = newStateTrackingState;
  };

  /**
   * Signals that the object will be access by a read access
   * Ensures that the object was loaded already
   */

  Metadata.prototype.readAccess = function readAccess() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new error.PersistentError('This object ' + this.id + ' is not available.');
      }
    }
  };

  /**
   * Signals that the object will be access by a write access
   * Ensures that the object was loaded already and marks the object as dirty
   */

  Metadata.prototype.writeAccess = function writeAccess() {
    if (this._enabled) {
      if (!this.isAvailable) {
        throw new error.PersistentError('This object ' + this.id + ' is not available.');
      }

      this.setDirty();
    }
  };

  /**
   * Indicates that the associated object isn't available
   */

  Metadata.prototype.setUnavailable = function setUnavailable() {
    this._state = Metadata.Type.UNAVAILABLE;
  };

  /**
   * Indicates that the associated object isn't stale, i.e.
   * the object correlate the database state and is not modified by the user
   */

  Metadata.prototype.setPersistent = function setPersistent() {
    this._state = Metadata.Type.PERSISTENT;
  };

  /**
   * Indicates the the object is modified by the user
   */

  Metadata.prototype.setDirty = function setDirty() {
    this._state = Metadata.Type.DIRTY;
  };

  /**
   * Indicates the the object is removed
   */

  Metadata.prototype.setRemoved = function setRemoved() {
    //mark the object only as dirty if it was already available
    if (this.isAvailable) {
      this.setDirty();
      this.version = null;
    }
  };

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

  Metadata.prototype.getJson = function getJson(options) {
    return this.type.toJsonValue(this, this._root, options);
  };

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

  Metadata.prototype.setJson = function setJson(json, options) {
    this.type.fromJsonValue(this, json, this._root, options);
  };

  return Metadata;
}(Lockable);

/**
 * @enum {number}
 */

Metadata.Type = {
  UNAVAILABLE: -1,
  PERSISTENT: 0,
  DIRTY: 1
};

module.exports = Metadata;

},{"1":1,"20":20,"33":33,"6":6,"64":64}],67:[function(_dereq_,module,exports){
"use strict";

var message = _dereq_(35);

/**
 * @alias util.Modules
 */

var Modules = function () {

  /**
   * @param {EntityManager} entityManager
   * @param {connector.Connector} connector
   */
  function Modules(entityManager, connector) {
    babelHelpers.classCallCheck(this, Modules);

    /**
     * @type EntityManager
     */
    this._entityManager = entityManager;
    /**
     * The connector used for requests
     * @type connector.Connector
     */
    this._connector = connector;
  }

  /**
   * Calls the module, which is identified by the given bucket.
   * The optional query parameter will be attached as GET-parameters.
   *
   * @param {string} bucket Name of the module
   * @param {(Object|string)=} query GET-Parameter as key-value-pairs or query string
   * @param {Object=} options Additional request options
   * @param {string=} options.responseType The type used to provide the response data, defaults to text oder json depends
   *    on the received data, can be one of arraybuffer, blob, json, text, base64, data-url
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<*>}
   */

  Modules.prototype.get = function get(bucket, query, options, doneCallback, failCallback) {
    if (query instanceof Function) {
      failCallback = options;
      doneCallback = query;
      options = {};
      query = null;
    }

    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    options = options || {};

    var msg = new message.GetBaqendModule(bucket).addQueryString(query).responseType(options.responseType || null);

    return this._send(msg, doneCallback, failCallback);
  };

  /**
   * Calls the module, which is identified by the given bucket.
   *
   * @param {string} bucket Name of the module
   * @param body {(string|Blob|File|ArrayBuffer|FormData|json)=} The POST-body data to send
   * @param {Object=} options Additional request options
   * @param {string=} options.requestType A optional type hint used to correctly interpret the provided data, can be one of
   *    arraybuffer, blob, json, text, base64, data-url, form
   * @param {string=} options.mimeType The mimType of the body. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} options.responseType The type used to provide the response data, defaults to text oder json depends
   *    on the received data, can be one of arraybuffer, blob, json, text, base64, data-url
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<*>}
   */

  Modules.prototype.post = function post(bucket, body, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    options = options || {};

    var msg = new message.PostBaqendModule(bucket).entity(body, options.requestType).mimeType(options.mimeType || null).responseType(options.responseType || null);

    return this._send(msg, doneCallback, failCallback);
  };

  Modules.prototype._send = function _send(msg, doneCallback, failCallback) {
    return this._entityManager.send(msg).then(function (response) {
      return response.entity;
    }).then(doneCallback, failCallback);
  };

  return Modules;
}();

module.exports = Modules;

},{"35":35}],68:[function(_dereq_,module,exports){
"use strict";

/**
 * @alias util.Permission
 */

var Permission = function () {

  /**
   * Creates a new Permission object, with an empty rule set
   * @param {util.Metadata} metadata The metadata of the object
   */
  function Permission(metadata) {
    babelHelpers.classCallCheck(this, Permission);

    /** @type {Object.<string, string>} */
    this._rules = {};
    /** @type util.Metadata */
    this._metadata = metadata;
  }

  /**
   * Returns a list of user and role references of all rules
   * @return {Array<string>} a list of references
   */

  Permission.prototype.allRules = function allRules() {
    return Object.keys(this._rules);
  };

  /**
   * Removes all rules from this permission object
   */

  Permission.prototype.clear = function clear() {
    this._metadata && this._metadata.writeAccess();
    this._rules = {};
  };

  /**
   * Copies permissions from another permission object
   * @param {util.Permission} permission The permission to copy from
   * @return {util.Permission}
   */

  Permission.prototype.copy = function copy(permission) {
    this._metadata && this._metadata.writeAccess();
    this._rules = Object.assign({}, permission._rules);
    return this;
  };

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */

  Permission.prototype.isPublicAllowed = function isPublicAllowed() {
    if ('*' in this._rules) return false;

    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        return false;
      }
    }

    return true;
  };

  /**
   * Sets whenever all users and roles should have the permission to perform the operation.
   * Note: All other allow rules will be removed.
   */

  Permission.prototype.setPublicAllowed = function setPublicAllowed() {
    this._metadata && this._metadata.writeAccess();
    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        delete this._rules[ref];
      }
    }
  };

  /**
   * Returns the actual rule of the given user or role.
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   * @return {string} The actual access rule or undefined if no rule was found
   */

  Permission.prototype.getRule = function getRule(userOrRole) {
    return this._rules[this._getRef(userOrRole)];
  };

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   */

  Permission.prototype.isAllowed = function isAllowed(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'allow';
  };

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param {model.User|model.Role|string} userOrRole The user or role to check for
   */

  Permission.prototype.isDenied = function isDenied(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'deny';
  };

  /**
   * Allows the given users or rules to perform the operation
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to allow
   * @return {util.Permission} this permission object
   */

  Permission.prototype.allowAccess = function allowAccess(userOrRole) {
    var rules = arguments;
    this._metadata && this._metadata.writeAccess();
    for (var i = 0; i < rules.length; i++) {
      this._rules[this._getRef(rules[i])] = 'allow';
    }
    return this;
  };

  /**
   * Denies the given users or rules to perform the operation
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to deny
   * @return {util.Permission} this permission object
   */

  Permission.prototype.denyAccess = function denyAccess(userOrRole) {
    var rules = arguments;
    this._metadata && this._metadata.writeAccess();
    for (var i = 0; i < rules.length; i++) {
      this._rules[this._getRef(rules[i])] = 'deny';
    }
    return this;
  };

  /**
   * Deletes any allow/deny rules for the given users or roles
   * @param {...(model.User|model.Role|string)} userOrRole The users or roles to delete rules for
   * @return {util.Permission} this permission object
   */

  Permission.prototype.deleteAccess = function deleteAccess(userOrRole) {
    var rules = arguments;
    this._metadata && this._metadata.writeAccess();
    for (var i = 0; i < rules.length; i++) {
      delete this._rules[this._getRef(rules[i])];
    }
    return this;
  };

  /**
   * A Json representation of the set of rules
   * @return {json}
   */

  Permission.prototype.toJSON = function toJSON() {
    return Object.assign({}, this._rules);
  };

  /**
   * Sets the permission rules from json
   * @param {json} json The permission json representation
   */

  Permission.prototype.fromJSON = function fromJSON(json) {
    this._rules = json;
  };

  /**
   * Creates a permission from the given rules.
   * @param {json} json The rules.
   * @return {util.Permission} The permission.
   */

  Permission.fromJSON = function fromJSON(json) {
    var permission = new this();
    permission.fromJSON(json);
    return permission;
  };

  /**
   * Resolves user and role references and validate given references
   * @param {model.User|model.Role|string} userOrRole The user, role or reference
   * @return {string} The resolved and validated reference
   * @private
   */

  Permission.prototype._getRef = function _getRef(userOrRole) {
    if (typeof userOrRole !== 'string') {
      userOrRole = userOrRole._metadata.id;
    }

    if (userOrRole.indexOf('/db/User/') == 0 || userOrRole.indexOf('/db/Role/') == 0) {
      return userOrRole;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  };

  return Permission;
}();

Permission.BASE_PERMISSIONS = ['load', 'update', 'delete', 'query', 'insert'];
module.exports = Permission;

},{}],69:[function(_dereq_,module,exports){
"use strict";

var Entity = _dereq_(10);

/**
 * @alias util.PushMessage
 */

var PushMessage = function () {

  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Set<binding.Entity>|Array<binding.Entity>} [devices] The Set of device references which
   * will receive this push notification.
   * @param {string=} message The message of the push notification.
   * @param {string=} subject The subject of the push notification.
   * @param {string=} sound The file reference of the sound file as a string. The device uses this file as the
   * notification sound.
   * @param {number=} badge The badge count.
   * @param {Object=} data The data object which can contain additional information.
   */
  function PushMessage(devices, message, subject, sound, badge, data) {
    babelHelpers.classCallCheck(this, PushMessage);

    /**
     * Set of devices
     * @type Set<binding.Entity>
     */
    this.devices = null;

    if (devices instanceof Set) {
      this.devices = devices;
    } else if (!devices || devices[Symbol.iterator]) {
      this.devices = new Set(devices);
    } else if (devices instanceof Entity) {
      this.devices = new Set();
      this.devices.add(devices);
    } else {
      throw new Error("Only Sets, Lists and Arrays can be used as devices.");
    }

    /**
     * push notification message
     * @type string
     */
    this.message = message;

    /**
     * push notification subject
     * @type string
     */
    this.subject = subject;

    /**
     * push notification sound
     * @type string
     */
    this.sound = sound;

    /**
     * badge count
     * @type number
     */
    this.badge = badge;

    /**
     * data object
     * @type json
     */
    this.data = data;
  }

  /**
   * Adds a new object to the set of devices
   *
   * @param {binding.Entity} device will be added to the device set to receive the push notification
   */

  PushMessage.prototype.addDevice = function addDevice(device) {
    if (!this.devices) {
      this.devices = new Set();
    }

    this.devices.add(device);
  };

  PushMessage.prototype.toJSON = function toJSON() {
    if (!this.devices || !this.devices.size) throw new Error("Set of devices is empty.");

    return Object.assign({}, this, {
      devices: Array.from(this.devices, function (device) {
        return device.id;
      })
    });
  };

  return PushMessage;
}();

module.exports = PushMessage;

},{"10":10}],70:[function(_dereq_,module,exports){
"use strict";

var hmac = _dereq_(74).hmac;

/**
 * @interface util.TokenStorageFactory
 */

/**
 * Creates a new tokenStorage which persist tokens for the given origin
 * @param {string} origin The origin where the token contains to
 * @return {Promise<TokenStorage>} The initialized token storage
 * @name create
 * @memberOf util.TokenStorageFactory.prototype
 * @method
 */

/**
 * @alias util.TokenStorage
 */

var TokenStorage = function () {
  /**
   * Parse a token string in its components
   * @param {string} token The token string to parse, time values are returned as timestamps
   * @return {{data: string, createdAt: int, expireAt: int, sig: string}}
   */
  TokenStorage.parse = function parse(token) {
    return {
      val: token,
      createdAt: parseInt(token.substring(0, 8), 16) * 1000,
      expireAt: parseInt(token.substring(8, 16), 16) * 1000,
      sig: token.substring(token.length - 40),
      data: token.substring(0, token.length - 40)
    };
  };

  /**
   * Get the stored token
   * @returns {string} The token or undefined, if no token is available
   */

  TokenStorage.create = function create(origin) {
    return Promise.resolve(new TokenStorage(origin));
  };

  /**
   * @param {string} origin The origin where the token belongs to
   * @param {string} token The initial token
   * @param {boolean=} temporary If the token should be saved temporary or permanently
   */

  babelHelpers.createClass(TokenStorage, [{
    key: 'token',
    get: function get() {
      return this._token ? this._token.val : null;
    }
  }]);

  function TokenStorage(origin, token, temporary) {
    babelHelpers.classCallCheck(this, TokenStorage);

    /**
     * The actual stored token
     */
    this._token = token ? TokenStorage.parse(token) : null;
    this._origin = origin;
    /**
     * Indicates if the token should keep temporary only or should be persisted for later sessions
     * @type boolean
     */
    this.temporary = temporary;
  }

  /**
   * Use the underlying storage implementation to save the token
   * @param {string} origin The origin where the token belongs to
   * @param {string} token The initial token
   * @param {boolean} temporary If the token should be saved temporary or permanently
   * @protected
   * @abstract
   */

  TokenStorage.prototype._saveToken = function _saveToken(origin, token, temporary) {};

  /**
   * Update the token for the givin origin, the operation may be asynchronous
   * @param {String} token The token to store or <code>null</code> to remove the token
   */

  TokenStorage.prototype.update = function update(token) {
    var t = token ? TokenStorage.parse(token) : null;
    if (this._token && t && this._token.expireAt > t.expireAt) {
      //an older token was fetched from the cache, so ignore it
      return;
    }

    this._token = t;
    this._saveToken(this._origin, token, this.temporary);
  };

  /**
   * Derived a resource token from the the stored origin token for the resource and signs the resource with the
   * generated resource token
   * @param {string} resource The resource which will be accessible with the returned token
   * @returns {string} A resource token which can only be used to access the specified resource
   */

  TokenStorage.prototype.signPath = function signPath(resource) {
    if (this._token) {
      var path = resource.split('/').map(encodeURIComponent).join('/');
      return path + '?BAT=' + (this._token.data + hmac(resource + this._token.data, this._token.sig));
    }
    return resource;
  };

  return TokenStorage;
}();

var tokens = {};
/**
 * @ignore
 */

var GlobalStorage = function (_TokenStorage) {
  babelHelpers.inherits(GlobalStorage, _TokenStorage);

  function GlobalStorage() {
    babelHelpers.classCallCheck(this, GlobalStorage);
    return babelHelpers.possibleConstructorReturn(this, _TokenStorage.apply(this, arguments));
  }

  GlobalStorage.create = function create(origin) {
    return Promise.resolve(new GlobalStorage(origin, tokens[origin]));
  };

  /**
   * @inheritDoc
   */

  GlobalStorage.prototype._saveToken = function _saveToken(origin, token, temporary) {
    if (!temporary) {
      if (token) {
        tokens[origin] = token;
      } else {
        delete tokens[origin];
      }
    }
  };

  return GlobalStorage;
}(TokenStorage);

/**
 * @alias util.TokenStorage.GLOBAL
 * @type {util.TokenStorageFactory}
 */

TokenStorage.GLOBAL = GlobalStorage;

/**
 * @ignore
 */

var WebStorage = function (_TokenStorage2) {
  babelHelpers.inherits(WebStorage, _TokenStorage2);

  function WebStorage() {
    babelHelpers.classCallCheck(this, WebStorage);
    return babelHelpers.possibleConstructorReturn(this, _TokenStorage2.apply(this, arguments));
  }

  WebStorage.isAvailable = function isAvailable() {
    try {
      //firefox throws an exception if cookies are disabled
      if (typeof localStorage === 'undefined') {
        return false;
      }

      localStorage.setItem('bq_webstorage_test', 'bq');
      localStorage.removeItem('bq_webstorage_test');
      return true;
    } catch (e) {}
    return false;
  };

  WebStorage.create = function create(origin) {
    var temporary = false;
    var token = localStorage.getItem('BAT:' + origin);

    if (!token && typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem('BAT:' + origin);
      temporary = !!token;
    }

    return Promise.resolve(new WebStorage(origin, token, temporary));
  };

  /**
   * @inheritDoc
   */

  WebStorage.prototype._saveToken = function _saveToken(origin, token, temporary) {
    var webStorage = temporary ? sessionStorage : localStorage;
    if (token) {
      webStorage.setItem('BAT:' + origin, token);
    } else {
      webStorage.removeItem('BAT:' + origin);
    }
  };

  return WebStorage;
}(TokenStorage);

if (WebStorage.isAvailable()) {
  /**
   * @alias util.TokenStorage.WEB_STORAGE
   * @type {util.TokenStorageFactory}
   */
  TokenStorage.WEB_STORAGE = WebStorage;
}

module.exports = TokenStorage;

},{"74":74}],71:[function(_dereq_,module,exports){
"use strict";

/**
 * @alias util.ValidationResult
 */

var ValidationResult = function () {
  babelHelpers.createClass(ValidationResult, [{
    key: "isValid",
    get: function get() {
      for (var key in this.fields) {
        if (!this.fields[key].isValid) {
          return false;
        }
      }
      return true;
    }
  }]);

  function ValidationResult() {
    babelHelpers.classCallCheck(this, ValidationResult);

    this.fields = {};
  }

  ValidationResult.prototype.toJSON = function toJSON() {
    var json = {};
    for (var key in this.fields) {
      json[key] = this.fields[key].toJSON();
    }
    return json;
  };

  return ValidationResult;
}();

module.exports = ValidationResult;

},{}],72:[function(_dereq_,module,exports){
"use strict";

var valLib = _dereq_(174);
var ValidationResult = _dereq_(71);

/**
 * @alias util.Validator
 */

var Validator = function () {

  /**
   * Compiles the given validation code for the managedType
   * @param {metamodel.ManagedType} managedType The managedType of the code
   * @param {string} validationCode The validation code
   */
  Validator.compile = function compile(managedType, validationCode) {
    var keys = [];
    for (var _iterator = managedType.attributes(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var attr = _ref;

      keys.push(attr.name);
    }

    var fn = new Function(keys, validationCode);
    return function onValidate(argObj) {
      var args = keys.map(function (name) {
        return argObj[name];
      });

      return fn.apply({}, args);
    };
  };

  /**
   * Gets the value of the attribute
   * @return {*} Value
   */

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @name is
   * @memberOf util.Validator.prototype
   * @function
   * @param {Function} fn will be used to validate the value
   * @returns {util.Validator}
   */

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param {string} error The error message which will be used if the value is invalid
   * @param {Function} fn will be used to validate the value
   * @returns {util.Validator}
   */
  Validator.prototype.is = function is(error, fn) {
    if (error instanceof Function) {
      fn = error;
      error = 'is';
    }
    if (fn(this.value, valLib) === false) {
      this.errors.push(error);
    }
    return this;
  };

  babelHelpers.createClass(Validator, [{
    key: 'value',
    get: function get() {
      return this._entity[this.key];
    }

    /**
     * Checks if the attribute is valid
     * @return {boolean}
     */

  }, {
    key: 'isValid',
    get: function get() {
      return this.errors.length == 0;
    }
  }]);

  function Validator(key, entity) {
    babelHelpers.classCallCheck(this, Validator);

    /**
     * Name of the attribute
     * @type string
     */
    this.key = key;

    /**
     * Entity to get the value of the attribute
     * @type {binding.Entity}
     * @private
     */
    this._entity = entity;

    /**
     * Entity to get the value of the attribute
     * @type {binding.Entity}
     * @private
     */
    this.errors = [];
  }

  Validator.prototype._callMethod = function _callMethod(method, error, args) {
    args = args || [];
    args.unshift(this.value);
    if (valLib[method].apply(this, args) === false) {
      this.errors.push(error);
    }
    return this;
  };

  Validator.prototype.toString = function toString() {
    return this.value;
  };

  Validator.prototype.toJSON = function toJSON() {
    return {
      isValid: this.isValid,
      errors: this.errors
    };
  };

  return Validator;
}();

Object.keys(valLib).forEach(function (name) {
  if (typeof valLib[name] == 'function' && name !== 'toString' && name !== 'toDate' && name !== 'extend' && name !== 'init') {

    /**
     * @ignore
     */
    Validator.prototype[name] = function (error) {
      //noinspection JSPotentiallyInvalidUsageOfThis
      return this._callMethod(name, error || name, Array.prototype.slice.call(arguments, error ? 1 : 0));
    };
  }
});

module.exports = Validator;

},{"174":174,"71":71}],73:[function(_dereq_,module,exports){
"use strict";

exports.atob = atob;

},{}],74:[function(_dereq_,module,exports){
'use strict';

exports.hmac = _dereq_(167);

},{"167":167}],75:[function(_dereq_,module,exports){
'use strict';

/**
 * @namespace util
 */

exports.isNode = _dereq_(76).isNode;
exports.atob = _dereq_(73).atob;
exports.hmac = _dereq_(74).hmac;
exports.Metadata = _dereq_(66);
exports.Permission = _dereq_(68);
exports.Validator = _dereq_(72);
exports.ValidationResult = _dereq_(71);
exports.Code = _dereq_(63);
exports.Modules = _dereq_(67);
exports.Lockable = _dereq_(64);
exports.Logger = _dereq_(65);
exports.PushMessage = _dereq_(69);
exports.TokenStorage = _dereq_(70);
exports.uuid = _dereq_(77).uuid;

},{"63":63,"64":64,"65":65,"66":66,"67":67,"68":68,"69":69,"70":70,"71":71,"72":72,"73":73,"74":74,"76":76,"77":77}],76:[function(_dereq_,module,exports){
"use strict";

exports.isNode = false;

},{}],77:[function(_dereq_,module,exports){
'use strict';

/**
 * @function
 * @name uuid
 * @memberOf util.prototype
 * @return {string} A generated version 4 UUID.
 */

exports.uuid = _dereq_(173);

},{"173":173}],78:[function(_dereq_,module,exports){
"use strict";

},{}],79:[function(_dereq_,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],80:[function(_dereq_,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = _dereq_(154)('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) _dereq_(101)(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};

},{"101":101,"154":154}],81:[function(_dereq_,module,exports){
module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};

},{}],82:[function(_dereq_,module,exports){
var isObject = _dereq_(109);
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"109":109}],83:[function(_dereq_,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = _dereq_(146);
var toLength = _dereq_(147);
var toAbsoluteIndex = _dereq_(144);
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"144":144,"146":146,"147":147}],84:[function(_dereq_,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = _dereq_(85);
var TAG = _dereq_(154)('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"154":154,"85":85}],85:[function(_dereq_,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],86:[function(_dereq_,module,exports){
'use strict';
var dP = _dereq_(122).f;
var create = _dereq_(121);
var redefineAll = _dereq_(135);
var ctx = _dereq_(90);
var anInstance = _dereq_(81);
var forOf = _dereq_(98);
var $iterDefine = _dereq_(112);
var step = _dereq_(114);
var setSpecies = _dereq_(138);
var DESCRIPTORS = _dereq_(92);
var fastKey = _dereq_(117).fastKey;
var validate = _dereq_(151);
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};

},{"112":112,"114":114,"117":117,"121":121,"122":122,"135":135,"138":138,"151":151,"81":81,"90":90,"92":92,"98":98}],87:[function(_dereq_,module,exports){
'use strict';
var global = _dereq_(99);
var $export = _dereq_(96);
var redefine = _dereq_(136);
var redefineAll = _dereq_(135);
var meta = _dereq_(117);
var forOf = _dereq_(98);
var anInstance = _dereq_(81);
var isObject = _dereq_(109);
var fails = _dereq_(97);
var $iterDetect = _dereq_(113);
var setToStringTag = _dereq_(139);
var inheritIfRequired = _dereq_(104);

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  var fixMethod = function (KEY) {
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function (a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a) {
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a) { fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b) { fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if (typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance = new C();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    var ACCEPT_ITERABLES = $iterDetect(function (iter) { new C(iter); }); // eslint-disable-line no-new
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new C();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });
    if (!ACCEPT_ITERABLES) {
      C = wrapper(function (target, iterable) {
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base(), target, C);
        if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);
    // weak collections should not contains .clear method
    if (IS_WEAK && proto.clear) delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};

},{"104":104,"109":109,"113":113,"117":117,"135":135,"136":136,"139":139,"81":81,"96":96,"97":97,"98":98,"99":99}],88:[function(_dereq_,module,exports){
var core = module.exports = { version: '2.5.1' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],89:[function(_dereq_,module,exports){
'use strict';
var $defineProperty = _dereq_(122);
var createDesc = _dereq_(134);

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};

},{"122":122,"134":134}],90:[function(_dereq_,module,exports){
// optional / simple context binding
var aFunction = _dereq_(79);
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"79":79}],91:[function(_dereq_,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],92:[function(_dereq_,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !_dereq_(97)(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"97":97}],93:[function(_dereq_,module,exports){
var isObject = _dereq_(109);
var document = _dereq_(99).document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"109":109,"99":99}],94:[function(_dereq_,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],95:[function(_dereq_,module,exports){
// all enumerable object keys, includes symbols
var getKeys = _dereq_(130);
var gOPS = _dereq_(127);
var pIE = _dereq_(131);
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};

},{"127":127,"130":130,"131":131}],96:[function(_dereq_,module,exports){
var global = _dereq_(99);
var core = _dereq_(88);
var hide = _dereq_(101);
var redefine = _dereq_(136);
var ctx = _dereq_(90);
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"101":101,"136":136,"88":88,"90":90,"99":99}],97:[function(_dereq_,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],98:[function(_dereq_,module,exports){
var ctx = _dereq_(90);
var call = _dereq_(110);
var isArrayIter = _dereq_(107);
var anObject = _dereq_(82);
var toLength = _dereq_(147);
var getIterFn = _dereq_(155);
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;

},{"107":107,"110":110,"147":147,"155":155,"82":82,"90":90}],99:[function(_dereq_,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],100:[function(_dereq_,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],101:[function(_dereq_,module,exports){
var dP = _dereq_(122);
var createDesc = _dereq_(134);
module.exports = _dereq_(92) ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"122":122,"134":134,"92":92}],102:[function(_dereq_,module,exports){
var document = _dereq_(99).document;
module.exports = document && document.documentElement;

},{"99":99}],103:[function(_dereq_,module,exports){
module.exports = !_dereq_(92) && !_dereq_(97)(function () {
  return Object.defineProperty(_dereq_(93)('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"92":92,"93":93,"97":97}],104:[function(_dereq_,module,exports){
var isObject = _dereq_(109);
var setPrototypeOf = _dereq_(137).set;
module.exports = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};

},{"109":109,"137":137}],105:[function(_dereq_,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function (fn, args, that) {
  var un = that === undefined;
  switch (args.length) {
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return fn.apply(that, args);
};

},{}],106:[function(_dereq_,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = _dereq_(85);
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"85":85}],107:[function(_dereq_,module,exports){
// check on default Array iterator
var Iterators = _dereq_(115);
var ITERATOR = _dereq_(154)('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};

},{"115":115,"154":154}],108:[function(_dereq_,module,exports){
// 7.2.2 IsArray(argument)
var cof = _dereq_(85);
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"85":85}],109:[function(_dereq_,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],110:[function(_dereq_,module,exports){
// call something on iterator step with safe closing on error
var anObject = _dereq_(82);
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};

},{"82":82}],111:[function(_dereq_,module,exports){
'use strict';
var create = _dereq_(121);
var descriptor = _dereq_(134);
var setToStringTag = _dereq_(139);
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_dereq_(101)(IteratorPrototype, _dereq_(154)('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"101":101,"121":121,"134":134,"139":139,"154":154}],112:[function(_dereq_,module,exports){
'use strict';
var LIBRARY = _dereq_(116);
var $export = _dereq_(96);
var redefine = _dereq_(136);
var hide = _dereq_(101);
var has = _dereq_(100);
var Iterators = _dereq_(115);
var $iterCreate = _dereq_(111);
var setToStringTag = _dereq_(139);
var getPrototypeOf = _dereq_(128);
var ITERATOR = _dereq_(154)('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"100":100,"101":101,"111":111,"115":115,"116":116,"128":128,"136":136,"139":139,"154":154,"96":96}],113:[function(_dereq_,module,exports){
var ITERATOR = _dereq_(154)('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};

},{"154":154}],114:[function(_dereq_,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],115:[function(_dereq_,module,exports){
module.exports = {};

},{}],116:[function(_dereq_,module,exports){
module.exports = false;

},{}],117:[function(_dereq_,module,exports){
var META = _dereq_(150)('meta');
var isObject = _dereq_(109);
var has = _dereq_(100);
var setDesc = _dereq_(122).f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !_dereq_(97)(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};

},{"100":100,"109":109,"122":122,"150":150,"97":97}],118:[function(_dereq_,module,exports){
var global = _dereq_(99);
var macrotask = _dereq_(143).set;
var Observer = global.MutationObserver || global.WebKitMutationObserver;
var process = global.process;
var Promise = global.Promise;
var isNode = _dereq_(85)(process) == 'process';

module.exports = function () {
  var head, last, notify;

  var flush = function () {
    var parent, fn;
    if (isNode && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (e) {
        if (head) notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (isNode) {
    notify = function () {
      process.nextTick(flush);
    };
  // browsers with MutationObserver
  } else if (Observer) {
    var toggle = true;
    var node = document.createTextNode('');
    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    var promise = Promise.resolve();
    notify = function () {
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function (fn) {
    var task = { fn: fn, next: undefined };
    if (last) last.next = task;
    if (!head) {
      head = task;
      notify();
    } last = task;
  };
};

},{"143":143,"85":85,"99":99}],119:[function(_dereq_,module,exports){
'use strict';
// 25.4.1.5 NewPromiseCapability(C)
var aFunction = _dereq_(79);

function PromiseCapability(C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
}

module.exports.f = function (C) {
  return new PromiseCapability(C);
};

},{"79":79}],120:[function(_dereq_,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys = _dereq_(130);
var gOPS = _dereq_(127);
var pIE = _dereq_(131);
var toObject = _dereq_(148);
var IObject = _dereq_(106);
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || _dereq_(97)(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
  } return T;
} : $assign;

},{"106":106,"127":127,"130":130,"131":131,"148":148,"97":97}],121:[function(_dereq_,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = _dereq_(82);
var dPs = _dereq_(123);
var enumBugKeys = _dereq_(94);
var IE_PROTO = _dereq_(140)('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = _dereq_(93)('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  _dereq_(102).appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"102":102,"123":123,"140":140,"82":82,"93":93,"94":94}],122:[function(_dereq_,module,exports){
var anObject = _dereq_(82);
var IE8_DOM_DEFINE = _dereq_(103);
var toPrimitive = _dereq_(149);
var dP = Object.defineProperty;

exports.f = _dereq_(92) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"103":103,"149":149,"82":82,"92":92}],123:[function(_dereq_,module,exports){
var dP = _dereq_(122);
var anObject = _dereq_(82);
var getKeys = _dereq_(130);

module.exports = _dereq_(92) ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"122":122,"130":130,"82":82,"92":92}],124:[function(_dereq_,module,exports){
var pIE = _dereq_(131);
var createDesc = _dereq_(134);
var toIObject = _dereq_(146);
var toPrimitive = _dereq_(149);
var has = _dereq_(100);
var IE8_DOM_DEFINE = _dereq_(103);
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = _dereq_(92) ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};

},{"100":100,"103":103,"131":131,"134":134,"146":146,"149":149,"92":92}],125:[function(_dereq_,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = _dereq_(146);
var gOPN = _dereq_(126).f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"126":126,"146":146}],126:[function(_dereq_,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = _dereq_(129);
var hiddenKeys = _dereq_(94).concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};

},{"129":129,"94":94}],127:[function(_dereq_,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],128:[function(_dereq_,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = _dereq_(100);
var toObject = _dereq_(148);
var IE_PROTO = _dereq_(140)('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"100":100,"140":140,"148":148}],129:[function(_dereq_,module,exports){
var has = _dereq_(100);
var toIObject = _dereq_(146);
var arrayIndexOf = _dereq_(83)(false);
var IE_PROTO = _dereq_(140)('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"100":100,"140":140,"146":146,"83":83}],130:[function(_dereq_,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = _dereq_(129);
var enumBugKeys = _dereq_(94);

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"129":129,"94":94}],131:[function(_dereq_,module,exports){
exports.f = {}.propertyIsEnumerable;

},{}],132:[function(_dereq_,module,exports){
module.exports = function (exec) {
  try {
    return { e: false, v: exec() };
  } catch (e) {
    return { e: true, v: e };
  }
};

},{}],133:[function(_dereq_,module,exports){
var anObject = _dereq_(82);
var isObject = _dereq_(109);
var newPromiseCapability = _dereq_(119);

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

},{"109":109,"119":119,"82":82}],134:[function(_dereq_,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],135:[function(_dereq_,module,exports){
var redefine = _dereq_(136);
module.exports = function (target, src, safe) {
  for (var key in src) redefine(target, key, src[key], safe);
  return target;
};

},{"136":136}],136:[function(_dereq_,module,exports){
var global = _dereq_(99);
var hide = _dereq_(101);
var has = _dereq_(100);
var SRC = _dereq_(150)('src');
var TO_STRING = 'toString';
var $toString = Function[TO_STRING];
var TPL = ('' + $toString).split(TO_STRING);

_dereq_(88).inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});

},{"100":100,"101":101,"150":150,"88":88,"99":99}],137:[function(_dereq_,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = _dereq_(109);
var anObject = _dereq_(82);
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = _dereq_(90)(Function.call, _dereq_(124).f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};

},{"109":109,"124":124,"82":82,"90":90}],138:[function(_dereq_,module,exports){
'use strict';
var global = _dereq_(99);
var dP = _dereq_(122);
var DESCRIPTORS = _dereq_(92);
var SPECIES = _dereq_(154)('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};

},{"122":122,"154":154,"92":92,"99":99}],139:[function(_dereq_,module,exports){
var def = _dereq_(122).f;
var has = _dereq_(100);
var TAG = _dereq_(154)('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"100":100,"122":122,"154":154}],140:[function(_dereq_,module,exports){
var shared = _dereq_(141)('keys');
var uid = _dereq_(150);
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"141":141,"150":150}],141:[function(_dereq_,module,exports){
var global = _dereq_(99);
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};

},{"99":99}],142:[function(_dereq_,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject = _dereq_(82);
var aFunction = _dereq_(79);
var SPECIES = _dereq_(154)('species');
module.exports = function (O, D) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};

},{"154":154,"79":79,"82":82}],143:[function(_dereq_,module,exports){
var ctx = _dereq_(90);
var invoke = _dereq_(105);
var html = _dereq_(102);
var cel = _dereq_(93);
var global = _dereq_(99);
var process = global.process;
var setTask = global.setImmediate;
var clearTask = global.clearImmediate;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;
var run = function () {
  var id = +this;
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function (event) {
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!setTask || !clearTask) {
  setTask = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (_dereq_(85)(process) == 'process') {
    defer = function (id) {
      process.nextTick(ctx(run, id, 1));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if (MessageChannel) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
    defer = function (id) {
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in cel('script')) {
    defer = function (id) {
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set: setTask,
  clear: clearTask
};

},{"102":102,"105":105,"85":85,"90":90,"93":93,"99":99}],144:[function(_dereq_,module,exports){
var toInteger = _dereq_(145);
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"145":145}],145:[function(_dereq_,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],146:[function(_dereq_,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = _dereq_(106);
var defined = _dereq_(91);
module.exports = function (it) {
  return IObject(defined(it));
};

},{"106":106,"91":91}],147:[function(_dereq_,module,exports){
// 7.1.15 ToLength
var toInteger = _dereq_(145);
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"145":145}],148:[function(_dereq_,module,exports){
// 7.1.13 ToObject(argument)
var defined = _dereq_(91);
module.exports = function (it) {
  return Object(defined(it));
};

},{"91":91}],149:[function(_dereq_,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = _dereq_(109);
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"109":109}],150:[function(_dereq_,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],151:[function(_dereq_,module,exports){
var isObject = _dereq_(109);
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};

},{"109":109}],152:[function(_dereq_,module,exports){
var global = _dereq_(99);
var core = _dereq_(88);
var LIBRARY = _dereq_(116);
var wksExt = _dereq_(153);
var defineProperty = _dereq_(122).f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};

},{"116":116,"122":122,"153":153,"88":88,"99":99}],153:[function(_dereq_,module,exports){
exports.f = _dereq_(154);

},{"154":154}],154:[function(_dereq_,module,exports){
var store = _dereq_(141)('wks');
var uid = _dereq_(150);
var Symbol = _dereq_(99).Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"141":141,"150":150,"99":99}],155:[function(_dereq_,module,exports){
var classof = _dereq_(84);
var ITERATOR = _dereq_(154)('iterator');
var Iterators = _dereq_(115);
module.exports = _dereq_(88).getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"115":115,"154":154,"84":84,"88":88}],156:[function(_dereq_,module,exports){
'use strict';
var ctx = _dereq_(90);
var $export = _dereq_(96);
var toObject = _dereq_(148);
var call = _dereq_(110);
var isArrayIter = _dereq_(107);
var toLength = _dereq_(147);
var createProperty = _dereq_(89);
var getIterFn = _dereq_(155);

$export($export.S + $export.F * !_dereq_(113)(function (iter) { Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = getIterFn(O);
    var length, result, step, iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"107":107,"110":110,"113":113,"147":147,"148":148,"155":155,"89":89,"90":90,"96":96}],157:[function(_dereq_,module,exports){
'use strict';
var addToUnscopables = _dereq_(80);
var step = _dereq_(114);
var Iterators = _dereq_(115);
var toIObject = _dereq_(146);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = _dereq_(112)(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"112":112,"114":114,"115":115,"146":146,"80":80}],158:[function(_dereq_,module,exports){
'use strict';
var strong = _dereq_(86);
var validate = _dereq_(151);
var MAP = 'Map';

// 23.1 Map Objects
module.exports = _dereq_(87)(MAP, function (get) {
  return function Map() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key) {
    var entry = strong.getEntry(validate(this, MAP), key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value) {
    return strong.def(validate(this, MAP), key === 0 ? 0 : key, value);
  }
}, strong, true);

},{"151":151,"86":86,"87":87}],159:[function(_dereq_,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = _dereq_(96);

$export($export.S + $export.F, 'Object', { assign: _dereq_(120) });

},{"120":120,"96":96}],160:[function(_dereq_,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = _dereq_(96);
$export($export.S, 'Object', { setPrototypeOf: _dereq_(137).set });

},{"137":137,"96":96}],161:[function(_dereq_,module,exports){
'use strict';
var LIBRARY = _dereq_(116);
var global = _dereq_(99);
var ctx = _dereq_(90);
var classof = _dereq_(84);
var $export = _dereq_(96);
var isObject = _dereq_(109);
var aFunction = _dereq_(79);
var anInstance = _dereq_(81);
var forOf = _dereq_(98);
var speciesConstructor = _dereq_(142);
var task = _dereq_(143).set;
var microtask = _dereq_(118)();
var newPromiseCapabilityModule = _dereq_(119);
var perform = _dereq_(132);
var promiseResolve = _dereq_(133);
var PROMISE = 'Promise';
var TypeError = global.TypeError;
var process = global.process;
var $Promise = global[PROMISE];
var isNode = classof(process) == 'process';
var empty = function () { /* empty */ };
var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
var newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;

var USE_NATIVE = !!function () {
  try {
    // correct subclassing with @@species support
    var promise = $Promise.resolve(1);
    var FakePromise = (promise.constructor = {})[_dereq_(154)('species')] = function (exec) {
      exec(empty, empty);
    };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
  } catch (e) { /* empty */ }
}();

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function (promise, isReject) {
  if (promise._n) return;
  promise._n = true;
  var chain = promise._c;
  microtask(function () {
    var value = promise._v;
    var ok = promise._s == 1;
    var i = 0;
    var run = function (reaction) {
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then;
      try {
        if (handler) {
          if (!ok) {
            if (promise._h == 2) onHandleUnhandled(promise);
            promise._h = 1;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value);
            if (domain) domain.exit();
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (e) {
        reject(e);
      }
    };
    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if (isReject && !promise._h) onUnhandled(promise);
  });
};
var onUnhandled = function (promise) {
  task.call(global, function () {
    var value = promise._v;
    var unhandled = isUnhandled(promise);
    var result, handler, console;
    if (unhandled) {
      result = perform(function () {
        if (isNode) {
          process.emit('unhandledRejection', value, promise);
        } else if (handler = global.onunhandledrejection) {
          handler({ promise: promise, reason: value });
        } else if ((console = global.console) && console.error) {
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if (unhandled && result.e) throw result.v;
  });
};
var isUnhandled = function (promise) {
  if (promise._h == 1) return false;
  var chain = promise._a || promise._c;
  var i = 0;
  var reaction;
  while (chain.length > i) {
    reaction = chain[i++];
    if (reaction.fail || !isUnhandled(reaction.promise)) return false;
  } return true;
};
var onHandleUnhandled = function (promise) {
  task.call(global, function () {
    var handler;
    if (isNode) {
      process.emit('rejectionHandled', promise);
    } else if (handler = global.onrejectionhandled) {
      handler({ promise: promise, reason: promise._v });
    }
  });
};
var $reject = function (value) {
  var promise = this;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if (!promise._a) promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function (value) {
  var promise = this;
  var then;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if (promise === value) throw TypeError("Promise can't be resolved itself");
    if (then = isThenable(value)) {
      microtask(function () {
        var wrapper = { _w: promise, _d: false }; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch (e) {
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch (e) {
    $reject.call({ _w: promise, _d: false }, e); // wrap
  }
};

// constructor polyfill
if (!USE_NATIVE) {
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor) {
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch (err) {
      $reject.call(this, err);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = _dereq_(135)($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected) {
      var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if (this._a) this._a.push(reaction);
      if (this._s) notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject = ctx($reject, promise, 1);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === $Promise || C === Wrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
_dereq_(139)($Promise, PROMISE);
_dereq_(138)(PROMISE);
Wrapper = _dereq_(88)[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    var $$reject = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x) {
    return promiseResolve(LIBRARY && this === Wrapper ? $Promise : this, x);
  }
});
$export($export.S + $export.F * !(USE_NATIVE && _dereq_(113)(function (iter) {
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var values = [];
      var index = 0;
      var remaining = 1;
      forOf(iterable, false, function (promise) {
        var $index = index++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.e) reject(result.v);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      forOf(iterable, false, function (promise) {
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if (result.e) reject(result.v);
    return capability.promise;
  }
});

},{"109":109,"113":113,"116":116,"118":118,"119":119,"132":132,"133":133,"135":135,"138":138,"139":139,"142":142,"143":143,"154":154,"79":79,"81":81,"84":84,"88":88,"90":90,"96":96,"98":98,"99":99}],162:[function(_dereq_,module,exports){
'use strict';
var strong = _dereq_(86);
var validate = _dereq_(151);
var SET = 'Set';

// 23.2 Set Objects
module.exports = _dereq_(87)(SET, function (get) {
  return function Set() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value) {
    return strong.def(validate(this, SET), value = value === 0 ? 0 : value, value);
  }
}, strong);

},{"151":151,"86":86,"87":87}],163:[function(_dereq_,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global = _dereq_(99);
var has = _dereq_(100);
var DESCRIPTORS = _dereq_(92);
var $export = _dereq_(96);
var redefine = _dereq_(136);
var META = _dereq_(117).KEY;
var $fails = _dereq_(97);
var shared = _dereq_(141);
var setToStringTag = _dereq_(139);
var uid = _dereq_(150);
var wks = _dereq_(154);
var wksExt = _dereq_(153);
var wksDefine = _dereq_(152);
var enumKeys = _dereq_(95);
var isArray = _dereq_(108);
var anObject = _dereq_(82);
var toIObject = _dereq_(146);
var toPrimitive = _dereq_(149);
var createDesc = _dereq_(134);
var _create = _dereq_(121);
var gOPNExt = _dereq_(125);
var $GOPD = _dereq_(124);
var $DP = _dereq_(122);
var $keys = _dereq_(130);
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function';
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  _dereq_(126).f = gOPNExt.f = $getOwnPropertyNames;
  _dereq_(131).f = $propertyIsEnumerable;
  _dereq_(127).f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !_dereq_(116)) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    if (it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    replacer = args[1];
    if (typeof replacer == 'function') $replacer = replacer;
    if ($replacer || !isArray(replacer)) replacer = function (key, value) {
      if ($replacer) value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || _dereq_(101)($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);

},{"100":100,"101":101,"108":108,"116":116,"117":117,"121":121,"122":122,"124":124,"125":125,"126":126,"127":127,"130":130,"131":131,"134":134,"136":136,"139":139,"141":141,"146":146,"149":149,"150":150,"152":152,"153":153,"154":154,"82":82,"92":92,"95":95,"96":96,"97":97,"99":99}],164:[function(_dereq_,module,exports){
'use strict';
// https://github.com/zenparsing/es-observable
var $export = _dereq_(96);
var global = _dereq_(99);
var core = _dereq_(88);
var microtask = _dereq_(118)();
var OBSERVABLE = _dereq_(154)('observable');
var aFunction = _dereq_(79);
var anObject = _dereq_(82);
var anInstance = _dereq_(81);
var redefineAll = _dereq_(135);
var hide = _dereq_(101);
var forOf = _dereq_(98);
var RETURN = forOf.RETURN;

var getMethod = function (fn) {
  return fn == null ? undefined : aFunction(fn);
};

var cleanupSubscription = function (subscription) {
  var cleanup = subscription._c;
  if (cleanup) {
    subscription._c = undefined;
    cleanup();
  }
};

var subscriptionClosed = function (subscription) {
  return subscription._o === undefined;
};

var closeSubscription = function (subscription) {
  if (!subscriptionClosed(subscription)) {
    subscription._o = undefined;
    cleanupSubscription(subscription);
  }
};

var Subscription = function (observer, subscriber) {
  anObject(observer);
  this._c = undefined;
  this._o = observer;
  observer = new SubscriptionObserver(this);
  try {
    var cleanup = subscriber(observer);
    var subscription = cleanup;
    if (cleanup != null) {
      if (typeof cleanup.unsubscribe === 'function') cleanup = function () { subscription.unsubscribe(); };
      else aFunction(cleanup);
      this._c = cleanup;
    }
  } catch (e) {
    observer.error(e);
    return;
  } if (subscriptionClosed(this)) cleanupSubscription(this);
};

Subscription.prototype = redefineAll({}, {
  unsubscribe: function unsubscribe() { closeSubscription(this); }
});

var SubscriptionObserver = function (subscription) {
  this._s = subscription;
};

SubscriptionObserver.prototype = redefineAll({}, {
  next: function next(value) {
    var subscription = this._s;
    if (!subscriptionClosed(subscription)) {
      var observer = subscription._o;
      try {
        var m = getMethod(observer.next);
        if (m) return m.call(observer, value);
      } catch (e) {
        try {
          closeSubscription(subscription);
        } finally {
          throw e;
        }
      }
    }
  },
  error: function error(value) {
    var subscription = this._s;
    if (subscriptionClosed(subscription)) throw value;
    var observer = subscription._o;
    subscription._o = undefined;
    try {
      var m = getMethod(observer.error);
      if (!m) throw value;
      value = m.call(observer, value);
    } catch (e) {
      try {
        cleanupSubscription(subscription);
      } finally {
        throw e;
      }
    } cleanupSubscription(subscription);
    return value;
  },
  complete: function complete(value) {
    var subscription = this._s;
    if (!subscriptionClosed(subscription)) {
      var observer = subscription._o;
      subscription._o = undefined;
      try {
        var m = getMethod(observer.complete);
        value = m ? m.call(observer, value) : undefined;
      } catch (e) {
        try {
          cleanupSubscription(subscription);
        } finally {
          throw e;
        }
      } cleanupSubscription(subscription);
      return value;
    }
  }
});

var $Observable = function Observable(subscriber) {
  anInstance(this, $Observable, 'Observable', '_f')._f = aFunction(subscriber);
};

redefineAll($Observable.prototype, {
  subscribe: function subscribe(observer) {
    return new Subscription(observer, this._f);
  },
  forEach: function forEach(fn) {
    var that = this;
    return new (core.Promise || global.Promise)(function (resolve, reject) {
      aFunction(fn);
      var subscription = that.subscribe({
        next: function (value) {
          try {
            return fn(value);
          } catch (e) {
            reject(e);
            subscription.unsubscribe();
          }
        },
        error: reject,
        complete: resolve
      });
    });
  }
});

redefineAll($Observable, {
  from: function from(x) {
    var C = typeof this === 'function' ? this : $Observable;
    var method = getMethod(anObject(x)[OBSERVABLE]);
    if (method) {
      var observable = anObject(method.call(x));
      return observable.constructor === C ? observable : new C(function (observer) {
        return observable.subscribe(observer);
      });
    }
    return new C(function (observer) {
      var done = false;
      microtask(function () {
        if (!done) {
          try {
            if (forOf(x, false, function (it) {
              observer.next(it);
              if (done) return RETURN;
            }) === RETURN) return;
          } catch (e) {
            if (done) throw e;
            observer.error(e);
            return;
          } observer.complete();
        }
      });
      return function () { done = true; };
    });
  },
  of: function of() {
    for (var i = 0, l = arguments.length, items = Array(l); i < l;) items[i] = arguments[i++];
    return new (typeof this === 'function' ? this : $Observable)(function (observer) {
      var done = false;
      microtask(function () {
        if (!done) {
          for (var j = 0; j < items.length; ++j) {
            observer.next(items[j]);
            if (done) return;
          } observer.complete();
        }
      });
      return function () { done = true; };
    });
  }
});

hide($Observable.prototype, OBSERVABLE, function () { return this; });

$export($export.G, { Observable: $Observable });

_dereq_(138)('Observable');

},{"101":101,"118":118,"135":135,"138":138,"154":154,"79":79,"81":81,"82":82,"88":88,"96":96,"98":98,"99":99}],165:[function(_dereq_,module,exports){
_dereq_(152)('observable');

},{"152":152}],166:[function(_dereq_,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory();
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define([], factory);
	}
	else {
		// Global (browser)
		root.CryptoJS = factory();
	}
}(this, function () {

	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = CryptoJS || (function (Math, undefined) {
	    /*
	     * Local polyfil of Object.create
	     */
	    var create = Object.create || (function () {
	        function F() {};

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }())

	    /**
	     * CryptoJS namespace.
	     */
	    var C = {};

	    /**
	     * Library namespace.
	     */
	    var C_lib = C.lib = {};

	    /**
	     * Base object for prototypal inheritance.
	     */
	    var Base = C_lib.Base = (function () {


	        return {
	            /**
	             * Creates a new object that inherits from this object.
	             *
	             * @param {Object} overrides Properties to copy into the new object.
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         field: 'value',
	             *
	             *         method: function () {
	             *         }
	             *     });
	             */
	            extend: function (overrides) {
	                // Spawn
	                var subtype = create(this);

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                // Initializer's prototype is the subtype object
	                subtype.init.prototype = subtype;

	                // Reference supertype
	                subtype.$super = this;

	                return subtype;
	            },

	            /**
	             * Extends this object and runs the init method.
	             * Arguments to create() will be passed to init().
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var instance = MyType.create();
	             */
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            /**
	             * Initializes a newly created object.
	             * Override this method to add some logic when your objects are created.
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         init: function () {
	             *             // ...
	             *         }
	             *     });
	             */
	            init: function () {
	            },

	            /**
	             * Copies properties into this object.
	             *
	             * @param {Object} properties The properties to mix in.
	             *
	             * @example
	             *
	             *     MyType.mixIn({
	             *         field: 'value'
	             *     });
	             */
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                // IE won't copy toString using the loop above
	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            /**
	             * Creates a copy of this object.
	             *
	             * @return {Object} The clone.
	             *
	             * @example
	             *
	             *     var clone = instance.clone();
	             */
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    /**
	     * An array of 32-bit words.
	     *
	     * @property {Array} words The array of 32-bit words.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var WordArray = C_lib.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of 32-bit words.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.create();
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        /**
	         * Converts this word array to a string.
	         *
	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
	         *
	         * @return {string} The stringified word array.
	         *
	         * @example
	         *
	         *     var string = wordArray + '';
	         *     var string = wordArray.toString();
	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
	         */
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        /**
	         * Concatenates a word array to this word array.
	         *
	         * @param {WordArray} wordArray The word array to append.
	         *
	         * @return {WordArray} This word array.
	         *
	         * @example
	         *
	         *     wordArray1.concat(wordArray2);
	         */
	        concat: function (wordArray) {
	            // Shortcuts
	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            // Clamp excess bits
	            this.clamp();

	            // Concat
	            if (thisSigBytes % 4) {
	                // Copy one byte at a time
	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {
	                // Copy one word at a time
	                for (var i = 0; i < thatSigBytes; i += 4) {
	                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            // Chainable
	            return this;
	        },

	        /**
	         * Removes insignificant bits.
	         *
	         * @example
	         *
	         *     wordArray.clamp();
	         */
	        clamp: function () {
	            // Shortcuts
	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            // Clamp
	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = wordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        /**
	         * Creates a word array filled with random bytes.
	         *
	         * @param {number} nBytes The number of random bytes to generate.
	         *
	         * @return {WordArray} The random word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
	         */
	        random: function (nBytes) {
	            var words = [];

	            var r = (function (m_w) {
	                var m_w = m_w;
	                var m_z = 0x3ade68b1;
	                var mask = 0xffffffff;

	                return function () {
	                    m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
	                    m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
	                    var result = ((m_z << 0x10) + m_w) & mask;
	                    result /= 0x100000000;
	                    result += 0.5;
	                    return result * (Math.random() > .5 ? 1 : -1);
	                }
	            });

	            for (var i = 0, rcache; i < nBytes; i += 4) {
	                var _r = r((rcache || Math.random()) * 0x100000000);

	                rcache = _r() * 0x3ade67b7;
	                words.push((_r() * 0x100000000) | 0);
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    /**
	     * Encoder namespace.
	     */
	    var C_enc = C.enc = {};

	    /**
	     * Hex encoding strategy.
	     */
	    var Hex = C_enc.Hex = {
	        /**
	         * Converts a word array to a hex string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The hex string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        /**
	         * Converts a hex string to a word array.
	         *
	         * @param {string} hexStr The hex string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
	         */
	        parse: function (hexStr) {
	            // Shortcut
	            var hexStrLength = hexStr.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    /**
	     * Latin1 encoding strategy.
	     */
	    var Latin1 = C_enc.Latin1 = {
	        /**
	         * Converts a word array to a Latin1 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Latin1 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        /**
	         * Converts a Latin1 string to a word array.
	         *
	         * @param {string} latin1Str The Latin1 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
	         */
	        parse: function (latin1Str) {
	            // Shortcut
	            var latin1StrLength = latin1Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    /**
	     * UTF-8 encoding strategy.
	     */
	    var Utf8 = C_enc.Utf8 = {
	        /**
	         * Converts a word array to a UTF-8 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-8 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        /**
	         * Converts a UTF-8 string to a word array.
	         *
	         * @param {string} utf8Str The UTF-8 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
	         */
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    /**
	     * Abstract buffered block algorithm template.
	     *
	     * The property blockSize must be implemented in a concrete subtype.
	     *
	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
	     */
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        /**
	         * Resets this block algorithm's data buffer to its initial state.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm.reset();
	         */
	        reset: function () {
	            // Initial values
	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        /**
	         * Adds new data to this block algorithm's buffer.
	         *
	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm._append('data');
	         *     bufferedBlockAlgorithm._append(wordArray);
	         */
	        _append: function (data) {
	            // Convert string to WordArray, else assume WordArray already
	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            // Append
	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        /**
	         * Processes available data blocks.
	         *
	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
	         *
	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
	         *
	         * @return {WordArray} The processed data.
	         *
	         * @example
	         *
	         *     var processedData = bufferedBlockAlgorithm._process();
	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
	         */
	        _process: function (doFlush) {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            // Count blocks ready
	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {
	                // Round up to include partial blocks
	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {
	                // Round down to include only full blocks,
	                // less the number of blocks that must remain in the buffer
	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            // Count words ready
	            var nWordsReady = nBlocksReady * blockSize;

	            // Count bytes ready
	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            // Process blocks
	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
	                    // Perform concrete-algorithm logic
	                    this._doProcessBlock(dataWords, offset);
	                }

	                // Remove processed words
	                var processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            // Return processed words
	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        /**
	         * Creates a copy of this object.
	         *
	         * @return {Object} The clone.
	         *
	         * @example
	         *
	         *     var clone = bufferedBlockAlgorithm.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    /**
	     * Abstract hasher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
	     */
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         */
	        cfg: Base.extend(),

	        /**
	         * Initializes a newly created hasher.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
	         *
	         * @example
	         *
	         *     var hasher = CryptoJS.algo.SHA256.create();
	         */
	        init: function (cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this hasher to its initial state.
	         *
	         * @example
	         *
	         *     hasher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-hasher logic
	            this._doReset();
	        },

	        /**
	         * Updates this hasher with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {Hasher} This hasher.
	         *
	         * @example
	         *
	         *     hasher.update('message');
	         *     hasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            // Append
	            this._append(messageUpdate);

	            // Update the hash
	            this._process();

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the hash computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The hash.
	         *
	         * @example
	         *
	         *     var hash = hasher.finalize();
	         *     var hash = hasher.finalize('message');
	         *     var hash = hasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Final message update
	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            // Perform concrete-hasher logic
	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        /**
	         * Creates a shortcut function to a hasher's object interface.
	         *
	         * @param {Hasher} hasher The hasher to create a helper for.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
	         */
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        /**
	         * Creates a shortcut function to the HMAC's object interface.
	         *
	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
	         */
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    /**
	     * Algorithm namespace.
	     */
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	return CryptoJS;

}));
},{}],167:[function(_dereq_,module,exports){
;(function (root, factory, undef) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(_dereq_(166), _dereq_(169), _dereq_(168));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core", "./sha1", "./hmac"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	return CryptoJS.HmacSHA1;

}));
},{"166":166,"168":168,"169":169}],168:[function(_dereq_,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(_dereq_(166));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var C_algo = C.algo;

	    /**
	     * HMAC algorithm.
	     */
	    var HMAC = C_algo.HMAC = Base.extend({
	        /**
	         * Initializes a newly created HMAC.
	         *
	         * @param {Hasher} hasher The hash algorithm to use.
	         * @param {WordArray|string} key The secret key.
	         *
	         * @example
	         *
	         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
	         */
	        init: function (hasher, key) {
	            // Init hasher
	            hasher = this._hasher = new hasher.init();

	            // Convert string to WordArray, else assume WordArray already
	            if (typeof key == 'string') {
	                key = Utf8.parse(key);
	            }

	            // Shortcuts
	            var hasherBlockSize = hasher.blockSize;
	            var hasherBlockSizeBytes = hasherBlockSize * 4;

	            // Allow arbitrary length keys
	            if (key.sigBytes > hasherBlockSizeBytes) {
	                key = hasher.finalize(key);
	            }

	            // Clamp excess bits
	            key.clamp();

	            // Clone key for inner and outer pads
	            var oKey = this._oKey = key.clone();
	            var iKey = this._iKey = key.clone();

	            // Shortcuts
	            var oKeyWords = oKey.words;
	            var iKeyWords = iKey.words;

	            // XOR keys with pad constants
	            for (var i = 0; i < hasherBlockSize; i++) {
	                oKeyWords[i] ^= 0x5c5c5c5c;
	                iKeyWords[i] ^= 0x36363636;
	            }
	            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this HMAC to its initial state.
	         *
	         * @example
	         *
	         *     hmacHasher.reset();
	         */
	        reset: function () {
	            // Shortcut
	            var hasher = this._hasher;

	            // Reset
	            hasher.reset();
	            hasher.update(this._iKey);
	        },

	        /**
	         * Updates this HMAC with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {HMAC} This HMAC instance.
	         *
	         * @example
	         *
	         *     hmacHasher.update('message');
	         *     hmacHasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            this._hasher.update(messageUpdate);

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the HMAC computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The HMAC.
	         *
	         * @example
	         *
	         *     var hmac = hmacHasher.finalize();
	         *     var hmac = hmacHasher.finalize('message');
	         *     var hmac = hmacHasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Shortcut
	            var hasher = this._hasher;

	            // Compute HMAC
	            var innerHash = hasher.finalize(messageUpdate);
	            hasher.reset();
	            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

	            return hmac;
	        }
	    });
	}());


}));
},{"166":166}],169:[function(_dereq_,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(_dereq_(166));
	}
	else if (typeof define === "function" && define.amd) {
		// AMD
		define(["./core"], factory);
	}
	else {
		// Global (browser)
		factory(root.CryptoJS);
	}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Reusable object
	    var W = [];

	    /**
	     * SHA-1 hash algorithm.
	     */
	    var SHA1 = C_algo.SHA1 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476,
	                0xc3d2e1f0
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var H = this._hash.words;

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];

	            // Computation
	            for (var i = 0; i < 80; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
	                    W[i] = (n << 1) | (n >>> 31);
	                }

	                var t = ((a << 5) | (a >>> 27)) + e + W[i];
	                if (i < 20) {
	                    t += ((b & c) | (~b & d)) + 0x5a827999;
	                } else if (i < 40) {
	                    t += (b ^ c ^ d) + 0x6ed9eba1;
	                } else if (i < 60) {
	                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
	                } else /* if (i < 80) */ {
	                    t += (b ^ c ^ d) - 0x359d3e2a;
	                }

	                e = d;
	                d = c;
	                c = (b << 30) | (b >>> 2);
	                b = a;
	                a = t;
	            }

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Return final computed hash
	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA1('message');
	     *     var hash = CryptoJS.SHA1(wordArray);
	     */
	    C.SHA1 = Hasher._createHelper(SHA1);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA1(message, key);
	     */
	    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
	}());


	return CryptoJS.SHA1;

}));
},{"166":166}],170:[function(_dereq_,module,exports){
/*!
 * depd
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 * @public
 */

module.exports = depd

/**
 * Create deprecate for namespace in caller.
 */

function depd(namespace) {
  if (!namespace) {
    throw new TypeError('argument namespace is required')
  }

  function deprecate(message) {
    // no-op in browser
  }

  deprecate._file = undefined
  deprecate._ignored = true
  deprecate._namespace = namespace
  deprecate._traced = false
  deprecate._warned = Object.create(null)

  deprecate.function = wrapfunction
  deprecate.property = wrapproperty

  return deprecate
}

/**
 * Return a wrapped function in a deprecation message.
 *
 * This is a no-op version of the wrapper, which does nothing but call
 * validation.
 */

function wrapfunction(fn, message) {
  if (typeof fn !== 'function') {
    throw new TypeError('argument fn must be a function')
  }

  return fn
}

/**
 * Wrap property in a deprecation message.
 *
 * This is a no-op version of the wrapper, which does nothing but call
 * validation.
 */

function wrapproperty(obj, prop, message) {
  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
    throw new TypeError('argument obj must be object')
  }

  var descriptor = Object.getOwnPropertyDescriptor(obj, prop)

  if (!descriptor) {
    throw new TypeError('must call property on owner object')
  }

  if (!descriptor.configurable) {
    throw new TypeError('property must be configurable')
  }

  return
}

},{}],171:[function(_dereq_,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],172:[function(_dereq_,module,exports){
(function (global){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef
  rng = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

module.exports = rng;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],173:[function(_dereq_,module,exports){
var rng = _dereq_(172);
var bytesToUuid = _dereq_(171);

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"171":171,"172":172}],174:[function(_dereq_,module,exports){
/*!
 * Copyright (c) 2015 Chris O'Hara <cohara87@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function (name, definition) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else if (typeof define === 'function' && typeof define.petal === 'object') {
        define(name, [], definition);
    } else {
        this[name] = definition();
    }
})('validator', function (validator) {

    'use strict';

    validator = { version: '4.9.0', coerce: true };

    var emailUserPart = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~]+$/i;
    var quotedEmailUser = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i;

    var emailUserUtf8Part = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;
    var quotedEmailUserUtf8 = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*$/i;

    var displayName = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\.\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\.\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\s]*<(.+)>$/i;

    var creditCard = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;

    var isin = /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/;

    var isbn10Maybe = /^(?:[0-9]{9}X|[0-9]{10})$/
      , isbn13Maybe = /^(?:[0-9]{13})$/;

    var macAddress = /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/;

    var ipv4Maybe = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
      , ipv6Block = /^[0-9A-F]{1,4}$/i;

    var uuid = {
        '3': /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i
      , '4': /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      , '5': /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      , all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
    };

    var alpha = {
        'en-US': /^[A-Z]+$/i,
        'de-DE': /^[A-ZÄÖÜß]+$/i,
        'es-ES': /^[A-ZÁÉÍÑÓÚÜ]+$/i,
        'fr-FR': /^[A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
        'nl-NL': /^[A-ZÉËÏÓÖÜ]+$/i,
        'pt-PT': /^[A-ZÃÁÀÂÇÉÊÍÕÓÔÚÜ]+$/i,
        'ru-RU': /^[А-ЯЁа-яё]+$/i
      }
      , alphanumeric = {
        'en-US': /^[0-9A-Z]+$/i,
        'de-DE': /^[0-9A-ZÄÖÜß]+$/i,
        'es-ES': /^[0-9A-ZÁÉÍÑÓÚÜ]+$/i,
        'fr-FR': /^[0-9A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
        'nl-NL': /^[0-9A-ZÉËÏÓÖÜ]+$/i,
        'pt-PT': /^[0-9A-ZÃÁÀÂÇÉÊÍÕÓÔÚÜ]+$/i,
        'ru-RU': /^[0-9А-ЯЁа-яё]+$/i
      };

    var englishLocales = ['AU', 'GB', 'HK', 'IN', 'NZ', 'ZA', 'ZM'];
    for (var locale, i = 0; i < englishLocales.length; i++) {
        locale = 'en-' + englishLocales[i];
        alpha[locale] = alpha['en-US'];
        alphanumeric[locale] = alphanumeric['en-US'];
    }

    var numeric = /^[-+]?[0-9]+$/
      , int = /^(?:[-+]?(?:0|[1-9][0-9]*))$/
      , float = /^(?:[-+]?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/
      , hexadecimal = /^[0-9A-F]+$/i
      , decimal = /^[-+]?([0-9]+|\.[0-9]+|[0-9]+\.[0-9]+)$/
      , hexcolor = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i;

    var ascii = /^[\x00-\x7F]+$/
      , multibyte = /[^\x00-\x7F]/
      , fullWidth = /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/
      , halfWidth = /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;

    var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;

    var base64 = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;

    var phones = {
      'en-US': /^(\+?1)?[2-9]\d{2}[2-9](?!11)\d{6}$/,
      'de-DE': /^(\+?49[ \.\-])?([\(]{1}[0-9]{1,6}[\)])?([0-9 \.\-\/]{3,20})((x|ext|extension)[ ]?[0-9]{1,4})?$/,
      'el-GR': /^(\+?30)?(69\d{8})$/,
      'en-AU': /^(\+?61|0)4\d{8}$/,
      'en-GB': /^(\+?44|0)7\d{9}$/,
      'en-HK': /^(\+?852\-?)?[569]\d{3}\-?\d{4}$/,
      'en-IN': /^(\+?91|0)?[789]\d{9}$/,
      'en-NZ': /^(\+?64|0)2\d{7,9}$/,
      'en-ZA': /^(\+?27|0)\d{9}$/,
      'en-ZM': /^(\+?26)?09[567]\d{7}$/,
      'es-ES': /^(\+?34)?(6\d{1}|7[1234])\d{7}$/,
      'fi-FI': /^(\+?358|0)\s?(4(0|1|2|4|5)?|50)\s?(\d\s?){4,8}\d$/,
      'fr-FR': /^(\+?33|0)[67]\d{8}$/,
      'nb-NO': /^(\+?47)?[49]\d{7}$/,
      'nn-NO': /^(\+?47)?[49]\d{7}$/,
      'pt-BR': /^(\+?55|0)\-?[1-9]{2}\-?[2-9]{1}\d{3,4}\-?\d{4}$/,
      'pt-PT': /^(\+?351)?9[1236]\d{7}$/,
      'ru-RU': /^(\+?7|8)?9\d{9}$/,
      'vi-VN': /^(\+?84|0)?((1(2([0-9])|6([2-9])|88|99))|(9((?!5)[0-9])))([0-9]{7})$/,
      'zh-CN': /^(\+?0?86\-?)?((13\d|14[57]|15[^4,\D]|17[678]|18\d)\d{8}|170[059]\d{7})$/,
      'zh-TW': /^(\+?886\-?|0)?9\d{8}$/
    };

    // from http://goo.gl/0ejHHW
    var iso8601 = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;

    validator.extend = function (name, fn) {
        validator[name] = function () {
            var args = Array.prototype.slice.call(arguments);
            args[0] = validator.toString(args[0]);
            return fn.apply(validator, args);
        };
    };

    //Right before exporting the validator object, pass each of the builtins
    //through extend() so that their first argument is coerced to a string
    validator.init = function () {
        for (var name in validator) {
            if (typeof validator[name] !== 'function' || name === 'toString' ||
                    name === 'toDate' || name === 'extend' || name === 'init' ||
                    name === 'isServerSide') {
                continue;
            }
            validator.extend(name, validator[name]);
        }
    };

    validator.isServerSide = function () {
        return typeof module === 'object' && module &&
            typeof module.exports === 'object' &&
            typeof process === 'object' &&
            typeof _dereq_ === 'function';
    };

    var depd = null;
    validator.deprecation = function (msg) {
        if (depd === null) {
            if (!validator.isServerSide()) {
                return;
            }
            depd = _dereq_(170)('validator');
        }
        depd(msg);
    };

    validator.toString = function (input) {
        if (typeof input !== 'string') {
            // The library validates strings only. Currently it coerces all input to a string, but this
            // will go away in an upcoming major version change. Print a deprecation notice for now
            if (!validator.coerce) {
                throw new Error('this library validates strings only');
            }
            validator.deprecation('you tried to validate a ' + typeof input + ' but this library ' +
                    '(validator.js) validates strings only. Please update your code as this will ' +
                    'be an error soon.');
        }
        if (typeof input === 'object' && input !== null) {
            if (typeof input.toString === 'function') {
                input = input.toString();
            } else {
                input = '[object Object]';
            }
        } else if (input === null || typeof input === 'undefined' || (isNaN(input) && !input.length)) {
            input = '';
        }
        return '' + input;
    };

    validator.toDate = function (date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date;
        }
        date = Date.parse(date);
        return !isNaN(date) ? new Date(date) : null;
    };

    validator.toFloat = function (str) {
        return parseFloat(str);
    };

    validator.toInt = function (str, radix) {
        return parseInt(str, radix || 10);
    };

    validator.toBoolean = function (str, strict) {
        if (strict) {
            return str === '1' || str === 'true';
        }
        return str !== '0' && str !== 'false' && str !== '';
    };

    validator.equals = function (str, comparison) {
        return str === validator.toString(comparison);
    };

    validator.contains = function (str, elem) {
        return str.indexOf(validator.toString(elem)) >= 0;
    };

    validator.matches = function (str, pattern, modifiers) {
        if (Object.prototype.toString.call(pattern) !== '[object RegExp]') {
            pattern = new RegExp(pattern, modifiers);
        }
        return pattern.test(str);
    };

    var default_email_options = {
        allow_display_name: false,
        allow_utf8_local_part: true,
        require_tld: true
    };

    validator.isEmail = function (str, options) {
        options = merge(options, default_email_options);

        if (options.allow_display_name) {
            var display_email = str.match(displayName);
            if (display_email) {
                str = display_email[1];
            }
        }

        var parts = str.split('@')
          , domain = parts.pop()
          , user = parts.join('@');

        var lower_domain = domain.toLowerCase();
        if (lower_domain === 'gmail.com' || lower_domain === 'googlemail.com') {
            user = user.replace(/\./g, '').toLowerCase();
        }

        if (!validator.isByteLength(user, {max: 64}) ||
                !validator.isByteLength(domain, {max: 256})) {
            return false;
        }

        if (!validator.isFQDN(domain, {require_tld: options.require_tld})) {
            return false;
        }

        if (user[0] === '"') {
            user = user.slice(1, user.length - 1);
            return options.allow_utf8_local_part ?
                quotedEmailUserUtf8.test(user) :
                quotedEmailUser.test(user);
        }

        var pattern = options.allow_utf8_local_part ?
            emailUserUtf8Part : emailUserPart;

        var user_parts = user.split('.');
        for (var i = 0; i < user_parts.length; i++) {
            if (!pattern.test(user_parts[i])) {
                return false;
            }
        }

        return true;
    };

    var default_url_options = {
        protocols: [ 'http', 'https', 'ftp' ]
      , require_tld: true
      , require_protocol: false
      , require_valid_protocol: true
      , allow_underscores: false
      , allow_trailing_dot: false
      , allow_protocol_relative_urls: false
    };

    validator.isURL = function (url, options) {
        if (!url || url.length >= 2083 || /\s/.test(url)) {
            return false;
        }
        if (url.indexOf('mailto:') === 0) {
            return false;
        }
        options = merge(options, default_url_options);
        var protocol, auth, host, hostname, port,
            port_str, split;
        split = url.split('://');
        if (split.length > 1) {
            protocol = split.shift();
            if (options.require_valid_protocol && options.protocols.indexOf(protocol) === -1) {
                return false;
            }
        } else if (options.require_protocol) {
            return false;
        }  else if (options.allow_protocol_relative_urls && url.substr(0, 2) === '//') {
            split[0] = url.substr(2);
        }
        url = split.join('://');
        split = url.split('#');
        url = split.shift();

        split = url.split('?');
        url = split.shift();

        split = url.split('/');
        url = split.shift();
        split = url.split('@');
        if (split.length > 1) {
            auth = split.shift();
            if (auth.indexOf(':') >= 0 && auth.split(':').length > 2) {
                return false;
            }
        }
        hostname = split.join('@');
        split = hostname.split(':');
        host = split.shift();
        if (split.length) {
            port_str = split.join(':');
            port = parseInt(port_str, 10);
            if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) {
                return false;
            }
        }
        if (!validator.isIP(host) && !validator.isFQDN(host, options) &&
                host !== 'localhost') {
            return false;
        }
        if (options.host_whitelist &&
                options.host_whitelist.indexOf(host) === -1) {
            return false;
        }
        if (options.host_blacklist &&
                options.host_blacklist.indexOf(host) !== -1) {
            return false;
        }
        return true;
    };

    validator.isMACAddress = function (str) {
        return macAddress.test(str);
    };

    validator.isIP = function (str, version) {
        version = version ? version + '' : '';
        if (!version) {
            return validator.isIP(str, 4) || validator.isIP(str, 6);
        } else if (version === '4') {
            if (!ipv4Maybe.test(str)) {
                return false;
            }
            var parts = str.split('.').sort(function (a, b) {
                return a - b;
            });
            return parts[3] <= 255;
        } else if (version === '6') {
            var blocks = str.split(':');
            var foundOmissionBlock = false; // marker to indicate ::

            // At least some OS accept the last 32 bits of an IPv6 address
            // (i.e. 2 of the blocks) in IPv4 notation, and RFC 3493 says
            // that '::ffff:a.b.c.d' is valid for IPv4-mapped IPv6 addresses,
            // and '::a.b.c.d' is deprecated, but also valid.
            var foundIPv4TransitionBlock = validator.isIP(blocks[blocks.length - 1], 4);
            var expectedNumberOfBlocks = foundIPv4TransitionBlock ? 7 : 8;

            if (blocks.length > expectedNumberOfBlocks)
                return false;

            // initial or final ::
            if (str === '::') {
                return true;
            } else if (str.substr(0, 2) === '::') {
                blocks.shift();
                blocks.shift();
                foundOmissionBlock = true;
            } else if (str.substr(str.length - 2) === '::') {
                blocks.pop();
                blocks.pop();
                foundOmissionBlock = true;
            }

            for (var i = 0; i < blocks.length; ++i) {
                // test for a :: which can not be at the string start/end
                // since those cases have been handled above
                if (blocks[i] === '' && i > 0 && i < blocks.length -1) {
                    if (foundOmissionBlock)
                        return false; // multiple :: in address
                    foundOmissionBlock = true;
                } else if (foundIPv4TransitionBlock && i == blocks.length - 1) {
                    // it has been checked before that the last
                    // block is a valid IPv4 address
                } else if (!ipv6Block.test(blocks[i])) {
                    return false;
                }
            }

            if (foundOmissionBlock) {
                return blocks.length >= 1;
            } else {
                return blocks.length === expectedNumberOfBlocks;
            }
        }
        return false;
    };

    var default_fqdn_options = {
        require_tld: true
      , allow_underscores: false
      , allow_trailing_dot: false
    };

    validator.isFQDN = function (str, options) {
        options = merge(options, default_fqdn_options);

        /* Remove the optional trailing dot before checking validity */
        if (options.allow_trailing_dot && str[str.length - 1] === '.') {
            str = str.substring(0, str.length - 1);
        }
        var parts = str.split('.');
        if (options.require_tld) {
            var tld = parts.pop();
            if (!parts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
                return false;
            }
        }
        for (var part, i = 0; i < parts.length; i++) {
            part = parts[i];
            if (options.allow_underscores) {
                if (part.indexOf('__') >= 0) {
                    return false;
                }
                part = part.replace(/_/g, '');
            }
            if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
                return false;
            }
            if (/[\uff01-\uff5e]/.test(part)) {
                // disallow full-width chars
                return false;
            }
            if (part[0] === '-' || part[part.length - 1] === '-') {
                return false;
            }
        }
        return true;
    };

    validator.isBoolean = function(str) {
        return (['true', 'false', '1', '0'].indexOf(str) >= 0);
    };

    validator.isAlpha = function (str, locale) {
        locale = locale || 'en-US';
        if (locale in alpha) {
            return alpha[locale].test(str);
        }
        throw new Error('Invalid locale \'' + locale + '\'');
    };

    validator.isAlphanumeric = function (str, locale) {
        locale = locale || 'en-US';
        if (locale in alphanumeric) {
            return alphanumeric[locale].test(str);
        }
        throw new Error('Invalid locale \'' + locale + '\'');
    };

    validator.isNumeric = function (str) {
        return numeric.test(str);
    };

    validator.isDecimal = function (str) {
        return str !== '' && decimal.test(str);
    };

    validator.isHexadecimal = function (str) {
        return hexadecimal.test(str);
    };

    validator.isHexColor = function (str) {
        return hexcolor.test(str);
    };

    validator.isLowercase = function (str) {
        return str === str.toLowerCase();
    };

    validator.isUppercase = function (str) {
        return str === str.toUpperCase();
    };

    validator.isInt = function (str, options) {
        options = options || {};
        return int.test(str) && (!options.hasOwnProperty('min') || str >= options.min) && (!options.hasOwnProperty('max') || str <= options.max);
    };

    validator.isFloat = function (str, options) {
        options = options || {};
        if (str === '' || str === '.') {
            return false;
        }
        return float.test(str) && (!options.hasOwnProperty('min') || str >= options.min) && (!options.hasOwnProperty('max') || str <= options.max);
    };

    validator.isDivisibleBy = function (str, num) {
        return validator.toFloat(str) % parseInt(num, 10) === 0;
    };

    validator.isNull = function (str) {
        return str.length === 0;
    };

    validator.isLength = function (str, options) {
        var min, max;
        if (typeof(options) === 'object') {
            min = options.min || 0;
            max = options.max;
        } else { // backwards compatibility: isLength(str, min [, max])
            min = arguments[1];
            max = arguments[2];
        }
        var surrogatePairs = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
        var len = str.length - surrogatePairs.length;
        return len >= min && (typeof max === 'undefined' || len <= max);
    };
    validator.isByteLength = function (str, options) {
        var min, max;
        if (typeof(options) === 'object') {
            min = options.min || 0;
            max = options.max;
        } else { // backwards compatibility: isByteLength(str, min [, max])
            min = arguments[1];
            max = arguments[2];
        }
        var len = encodeURI(str).split(/%..|./).length - 1;
        return len >= min && (typeof max === 'undefined' || len <= max);
    };

    validator.isUUID = function (str, version) {
        var pattern = uuid[version ? version : 'all'];
        return pattern && pattern.test(str);
    };

    function getTimezoneOffset(str) {
        var iso8601Parts = str.match(iso8601)
          , timezone, sign, hours, minutes;
        if (!iso8601Parts) {
            str = str.toLowerCase();
            timezone = str.match(/(?:\s|gmt\s*)(-|\+)(\d{1,4})(\s|$)/);
            if (!timezone) {
                return str.indexOf('gmt') !== -1 ? 0 : null;
            }
            sign = timezone[1];
            var offset = timezone[2];
            if (offset.length === 3) {
                offset = '0' + offset;
            }
            if (offset.length <= 2) {
                hours = 0;
                minutes = parseInt(offset);
            } else {
                hours = parseInt(offset.slice(0, 2));
                minutes = parseInt(offset.slice(2, 4));
            }
        } else {
            timezone = iso8601Parts[21];
            if (!timezone) {
                // if no hour/minute was provided, the date is GMT
                return !iso8601Parts[12] ? 0 : null;
            }
            if (timezone === 'z' || timezone === 'Z') {
                return 0;
            }
            sign = iso8601Parts[22];
            if (timezone.indexOf(':') !== -1) {
                hours = parseInt(iso8601Parts[23]);
                minutes = parseInt(iso8601Parts[24]);
            } else {
                hours = 0;
                minutes = parseInt(iso8601Parts[23]);
            }
        }
        return (hours * 60 + minutes) * (sign === '-' ? 1 : -1);
    }

    validator.isDate = function (str) {
        var normalizedDate = new Date(Date.parse(str));
        if (isNaN(normalizedDate)) {
            return false;
        }

        // normalizedDate is in the user's timezone. Apply the input
        // timezone offset to the date so that the year and day match
        // the input
        var timezoneOffset = getTimezoneOffset(str);
        if (timezoneOffset !== null) {
            var timezoneDifference = normalizedDate.getTimezoneOffset() -
                timezoneOffset;
            normalizedDate = new Date(normalizedDate.getTime() +
                60000 * timezoneDifference);
        }

        var day = String(normalizedDate.getDate());
        var dayOrYear, dayOrYearMatches, year;
        //check for valid double digits that could be late days
        //check for all matches since a string like '12/23' is a valid date
        //ignore everything with nearby colons
        dayOrYearMatches = str.match(/(^|[^:\d])[23]\d([^:\d]|$)/g);
        if (!dayOrYearMatches) {
            return true;
        }
        dayOrYear = dayOrYearMatches.map(function(digitString) {
            return digitString.match(/\d+/g)[0];
        }).join('/');

        year = String(normalizedDate.getFullYear()).slice(-2);
        if (dayOrYear === day || dayOrYear === year) {
            return true;
        } else if ((dayOrYear === (day + '/' + year)) || (dayOrYear === (year + '/' + day))) {
            return true;
        }
        return false;
    };

    validator.isAfter = function (str, date) {
        var comparison = validator.toDate(date || new Date())
          , original = validator.toDate(str);
        return !!(original && comparison && original > comparison);
    };

    validator.isBefore = function (str, date) {
        var comparison = validator.toDate(date || new Date())
          , original = validator.toDate(str);
        return !!(original && comparison && original < comparison);
    };

    validator.isIn = function (str, options) {
        var i;
        if (Object.prototype.toString.call(options) === '[object Array]') {
            var array = [];
            for (i in options) {
                array[i] = validator.toString(options[i]);
            }
            return array.indexOf(str) >= 0;
        } else if (typeof options === 'object') {
            return options.hasOwnProperty(str);
        } else if (options && typeof options.indexOf === 'function') {
            return options.indexOf(str) >= 0;
        }
        return false;
    };

    validator.isWhitelisted = function (str, chars) {
        for (var i = str.length - 1; i >= 0; i--) {
            if (chars.indexOf(str[i]) === -1) {
                return false;
            }
        }

        return true;
    };

    validator.isCreditCard = function (str) {
        var sanitized = str.replace(/[^0-9]+/g, '');
        if (!creditCard.test(sanitized)) {
            return false;
        }
        var sum = 0, digit, tmpNum, shouldDouble;
        for (var i = sanitized.length - 1; i >= 0; i--) {
            digit = sanitized.substring(i, (i + 1));
            tmpNum = parseInt(digit, 10);
            if (shouldDouble) {
                tmpNum *= 2;
                if (tmpNum >= 10) {
                    sum += ((tmpNum % 10) + 1);
                } else {
                    sum += tmpNum;
                }
            } else {
                sum += tmpNum;
            }
            shouldDouble = !shouldDouble;
        }
        return !!((sum % 10) === 0 ? sanitized : false);
    };

    validator.isISIN = function (str) {
        if (!isin.test(str)) {
            return false;
        }

        var checksumStr = str.replace(/[A-Z]/g, function(character) {
            return parseInt(character, 36);
        });

        var sum = 0, digit, tmpNum, shouldDouble = true;
        for (var i = checksumStr.length - 2; i >= 0; i--) {
            digit = checksumStr.substring(i, (i + 1));
            tmpNum = parseInt(digit, 10);
            if (shouldDouble) {
                tmpNum *= 2;
                if (tmpNum >= 10) {
                    sum += tmpNum + 1;
                } else {
                    sum += tmpNum;
                }
            } else {
                sum += tmpNum;
            }
            shouldDouble = !shouldDouble;
        }

        return parseInt(str.substr(str.length - 1), 10) === (10000 - sum) % 10;
    };

    validator.isISBN = function (str, version) {
        version = version ? version + '' : '';
        if (!version) {
            return validator.isISBN(str, 10) || validator.isISBN(str, 13);
        }
        var sanitized = str.replace(/[\s-]+/g, '')
          , checksum = 0, i;
        if (version === '10') {
            if (!isbn10Maybe.test(sanitized)) {
                return false;
            }
            for (i = 0; i < 9; i++) {
                checksum += (i + 1) * sanitized.charAt(i);
            }
            if (sanitized.charAt(9) === 'X') {
                checksum += 10 * 10;
            } else {
                checksum += 10 * sanitized.charAt(9);
            }
            if ((checksum % 11) === 0) {
                return !!sanitized;
            }
        } else  if (version === '13') {
            if (!isbn13Maybe.test(sanitized)) {
                return false;
            }
            var factor = [ 1, 3 ];
            for (i = 0; i < 12; i++) {
                checksum += factor[i % 2] * sanitized.charAt(i);
            }
            if (sanitized.charAt(12) - ((10 - (checksum % 10)) % 10) === 0) {
                return !!sanitized;
            }
        }
        return false;
    };

    validator.isMobilePhone = function(str, locale) {
        if (locale in phones) {
            return phones[locale].test(str);
        }
        return false;
    };

    var default_currency_options = {
        symbol: '$'
      , require_symbol: false
      , allow_space_after_symbol: false
      , symbol_after_digits: false
      , allow_negatives: true
      , parens_for_negatives: false
      , negative_sign_before_digits: false
      , negative_sign_after_digits: false
      , allow_negative_sign_placeholder: false
      , thousands_separator: ','
      , decimal_separator: '.'
      , allow_space_after_digits: false
    };

    validator.isCurrency = function (str, options) {
        options = merge(options, default_currency_options);

        return currencyRegex(options).test(str);
    };

    validator.isJSON = function (str) {
        try {
            var obj = JSON.parse(str);
            return !!obj && typeof obj === 'object';
        } catch (e) {}
        return false;
    };

    validator.isMultibyte = function (str) {
        return multibyte.test(str);
    };

    validator.isAscii = function (str) {
        return ascii.test(str);
    };

    validator.isFullWidth = function (str) {
        return fullWidth.test(str);
    };

    validator.isHalfWidth = function (str) {
        return halfWidth.test(str);
    };

    validator.isVariableWidth = function (str) {
        return fullWidth.test(str) && halfWidth.test(str);
    };

    validator.isSurrogatePair = function (str) {
        return surrogatePair.test(str);
    };

    validator.isBase64 = function (str) {
        return base64.test(str);
    };

    validator.isMongoId = function (str) {
        return validator.isHexadecimal(str) && str.length === 24;
    };

    validator.isISO8601 = function (str) {
        return iso8601.test(str);
    };

    validator.ltrim = function (str, chars) {
        var pattern = chars ? new RegExp('^[' + chars + ']+', 'g') : /^\s+/g;
        return str.replace(pattern, '');
    };

    validator.rtrim = function (str, chars) {
        var pattern = chars ? new RegExp('[' + chars + ']+$', 'g') : /\s+$/g;
        return str.replace(pattern, '');
    };

    validator.trim = function (str, chars) {
        var pattern = chars ? new RegExp('^[' + chars + ']+|[' + chars + ']+$', 'g') : /^\s+|\s+$/g;
        return str.replace(pattern, '');
    };

    validator.escape = function (str) {
        return (str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\//g, '&#x2F;')
            .replace(/\`/g, '&#96;'));
    };

    validator.stripLow = function (str, keep_new_lines) {
        var chars = keep_new_lines ? '\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F' : '\\x00-\\x1F\\x7F';
        return validator.blacklist(str, chars);
    };

    validator.whitelist = function (str, chars) {
        return str.replace(new RegExp('[^' + chars + ']+', 'g'), '');
    };

    validator.blacklist = function (str, chars) {
        return str.replace(new RegExp('[' + chars + ']+', 'g'), '');
    };

    var default_normalize_email_options = {
        lowercase: true,
        remove_dots: true,
        remove_extension: true
    };

    validator.normalizeEmail = function (email, options) {
        options = merge(options, default_normalize_email_options);
        if (!validator.isEmail(email)) {
            return false;
        }
        var parts = email.split('@', 2);
        parts[1] = parts[1].toLowerCase();
        if (parts[1] === 'gmail.com' || parts[1] === 'googlemail.com') {
            if (options.remove_extension) {
                parts[0] = parts[0].split('+')[0];
            }
            if (options.remove_dots) {
                parts[0] = parts[0].replace(/\./g, '');
            }
            if (!parts[0].length) {
                return false;
            }
            parts[0] = parts[0].toLowerCase();
            parts[1] = 'gmail.com';
        } else if (options.lowercase) {
            parts[0] = parts[0].toLowerCase();
        }
        return parts.join('@');
    };

    function merge(obj, defaults) {
        obj = obj || {};
        for (var key in defaults) {
            if (typeof obj[key] === 'undefined') {
                obj[key] = defaults[key];
            }
        }
        return obj;
    }

    function currencyRegex(options) {
        var symbol = '(\\' + options.symbol.replace(/\./g, '\\.') + ')' + (options.require_symbol ? '' : '?')
            , negative = '-?'
            , whole_dollar_amount_without_sep = '[1-9]\\d*'
            , whole_dollar_amount_with_sep = '[1-9]\\d{0,2}(\\' + options.thousands_separator + '\\d{3})*'
            , valid_whole_dollar_amounts = ['0', whole_dollar_amount_without_sep, whole_dollar_amount_with_sep]
            , whole_dollar_amount = '(' + valid_whole_dollar_amounts.join('|') + ')?'
            , decimal_amount = '(\\' + options.decimal_separator + '\\d{2})?';
        var pattern = whole_dollar_amount + decimal_amount;
        // default is negative sign before symbol, but there are two other options (besides parens)
        if (options.allow_negatives && !options.parens_for_negatives) {
            if (options.negative_sign_after_digits) {
                pattern += negative;
            }
            else if (options.negative_sign_before_digits) {
                pattern = negative + pattern;
            }
        }
        // South African Rand, for example, uses R 123 (space) and R-123 (no space)
        if (options.allow_negative_sign_placeholder) {
            pattern = '( (?!\\-))?' + pattern;
        }
        else if (options.allow_space_after_symbol) {
            pattern = ' ?' + pattern;
        }
        else if (options.allow_space_after_digits) {
            pattern += '( (?!$))?';
        }
        if (options.symbol_after_digits) {
            pattern += symbol;
        } else {
            pattern = symbol + pattern;
        }
        if (options.allow_negatives) {
            if (options.parens_for_negatives) {
                pattern = '(\\(' + pattern + '\\)|' + pattern + ')';
            }
            else if (!(options.negative_sign_before_digits || options.negative_sign_after_digits)) {
                pattern = negative + pattern;
            }
        }
        return new RegExp(
            '^' +
            // ensure there's a dollar and/or decimal amount, and that it doesn't start with a space or a negative sign followed by a space
            '(?!-? )(?=.*\\d)' +
            pattern +
            '$'
        );
    }

    validator.init();

    return validator;

});

},{"170":170}],175:[function(_dereq_,module,exports){
'use strict';

_dereq_(162);
_dereq_(158);

if (!Object.assign) {
  _dereq_(159);
}

if (!Object.setPrototypeOf) {
  _dereq_(160);
}

if (typeof Promise === "undefined") {
  _dereq_(161);
}

if (!Array.from) {
  _dereq_(156);
  _dereq_(157);
}

if (typeof Symbol === "undefined") {
  _dereq_(163);
}

},{"156":156,"157":157,"158":158,"159":159,"160":160,"161":161,"162":162,"163":163}],176:[function(_dereq_,module,exports){
"use strict";

var EntityManagerFactory = _dereq_(3);
var WebSocketConnector = _dereq_(177);

Object.defineProperty(EntityManagerFactory.prototype, 'websocket', {
  get: function get() {
    if (!this._websocket) {
      var secure = this._connector.secure;
      var url = void 0;
      if (this._connectData.websocket) {
        url = (secure ? 'wss:' : 'ws:') + this._connectData.websocket;
      } else {
        url = this._connector.origin.replace(/^http/, 'ws') + this._connector.basePath + '/events';
      }
      this._websocket = WebSocketConnector.create(url);
    }
    return this._websocket;
  }
});

module.exports = EntityManagerFactory;

},{"177":177,"3":3}],177:[function(_dereq_,module,exports){
"use strict";

var CommunicationError = _dereq_(28);
var WebSocket = _dereq_(178).WebSocket;
var lib = _dereq_(34);

/**
 * @alias connector.WebSocketConnector
 */

var WebSocketConnector = function () {

  /**
   * @param {connector.Connector} connector a connector
   * @param {String=} url The websocket connect script url
   * @return {connector.WebSocketConnector} a websocket connection
   */
  WebSocketConnector.create = function create(url) {
    var websocket = this.websockets[url];
    if (!websocket) {
      websocket = new WebSocketConnector(url);
      this.websockets[url] = websocket;
    }
    return websocket;
  };

  /**
   * @param {String} url
   */

  function WebSocketConnector(url) {
    babelHelpers.classCallCheck(this, WebSocketConnector);

    this.observers = {};
    this.socket = null;
    this.url = url;
  }

  WebSocketConnector.prototype.open = function open() {
    var _this = this;

    if (!this.socket) {
      var socket = new WebSocket(this.url);
      var socketPromise = void 0;

      var handleSocketCompletion = function handleSocketCompletion(error) {
        //observable error calls can throw an exception therefore cleanup beforehand
        var isError = false;
        if (_this.socket == socketPromise) {
          isError = socket.readyState != 3;
          _this.socket = null;
        }

        var firstErr = void 0;
        Object.keys(_this.observers).forEach(function (id) {
          var observer = _this.observers[id];
          delete _this.observers[id]; //unsubscribe to allow resubscriptions
          try {
            isError ? observer.error(new CommunicationError(null, error)) : observer.complete();
          } catch (e) {
            if (!firstErr) firstErr = e;
          }
        });

        if (firstErr) throw firstErr;
      };

      socket.onerror = handleSocketCompletion;
      socket.onclose = handleSocketCompletion;
      socket.onmessage = function (event) {
        var message = JSON.parse(event.data);
        message.date = new Date(message.date);

        var id = message.id;
        if (!id) {
          if (message.type == 'error') handleSocketCompletion(message);
          return;
        }

        var observer = _this.observers[id];
        if (observer) {
          if (message.type == "error") {
            observer.error(new CommunicationError(null, message));
          } else {
            observer.next(message);
          }
        }
      };

      socketPromise = this.socket = new Promise(function (resolve) {
        socket.onopen = resolve;
      }).then(function () {
        return socket;
      });
    }

    return this.socket;
  };

  WebSocketConnector.prototype.close = function close() {
    if (this.socket) {
      this.socket.then(function (socket) {
        socket.close();
      });
      this.socket = null;
    }
  };

  /**
   * @param {util.TokenStorage} tokenStorage
   * @param {string} id subscription ID
   * @return {connector.ObservableStream} The channel for sending and receiving messages
   */

  WebSocketConnector.prototype.openStream = function openStream(tokenStorage, id) {
    var _this2 = this;

    var stream = new lib.Observable(function (observer) {
      if (_this2.observers[id]) throw new Error("Only one subscription per stream is allowed.");

      _this2.observers[id] = observer;
      return function () {
        //cleanup only our subscription and handle resubscription on the same stream id correctly
        if (_this2.observers[id] == observer) delete _this2.observers[id];
      };
    });

    stream.send = function (message) {
      _this2.open().then(function (socket) {
        message.id = id;
        if (tokenStorage.token) message.token = tokenStorage.token;
        var jsonMessage = JSON.stringify(message);
        socket.send(jsonMessage);
      });
    };

    return stream;
  };

  return WebSocketConnector;
}();

Object.assign(WebSocketConnector, /** @lends connector.WebSocketConnector */{
  /**
   * Map of all available connectors to their respective websocket connections
   * @type connector.Connector[]
   */
  websockets: {}
});

module.exports = WebSocketConnector;

},{"178":178,"28":28,"34":34}],178:[function(_dereq_,module,exports){
"use strict";

exports.WebSocket = window.WebSocket;

},{}],179:[function(_dereq_,module,exports){
'use strict';

_dereq_(175);

module.exports = _dereq_(183);

},{"175":175,"183":183}],180:[function(_dereq_,module,exports){
'use strict';

/*
 * loads the observalbe from the global context, the global Rx variable or try to load Rx.js, fallback to core-js shim
 * The Observable can be overwritten by setting the require('baqend/realtime').Observable = Observable afterwards
 */

if (typeof Rx !== 'undefined') {
  module.exports = Rx.Observable;
} else {
  try {
    module.exports = _dereq_('rxjs/Observable').Observable;
  } catch (e) {
    if (typeof Observable == 'undefined') {
      //load Observable shim
      _dereq_(165);
      _dereq_(164);
      var sub = Observable.prototype.subscribe;

      //patch subscribe until core-js implements the new proposal
      //https://github.com/zloirock/core-js/issues/257
      Observable.prototype.subscribe = function (onNext, onError, onComplete) {
        if (onNext instanceof Function) {
          return sub.call(this, {
            next: onNext,
            error: onError,
            complete: onComplete
          });
        } else {
          return sub.call(this, onNext);
        }
      };
    }

    module.exports = Observable;
  }
}

},{"164":164,"165":165,"undefined":undefined}],181:[function(_dereq_,module,exports){
"use strict";

var Stream = _dereq_(182);
var Node = _dereq_(59);

/**
 * @ignore
 *
 * @param {Object} options
 * @returns {Observable<T>} an RxJS observable
 */
Node.prototype.eventStream = function (options, onNext, onError, onComplete) {
  if (options instanceof Function) {
    onComplete = onError;
    onError = onNext;
    onNext = options;
    options = {};
  }

  var observable = Stream.createEventStream(this.entityManager, this._createRealTimeQuery(), options);

  if (onNext instanceof Function) {
    return observable.subscribe(onNext, onError, onComplete);
  } else {
    return observable;
  }
};

Node.prototype.resultStream = function (options, onNext, onError, onComplete) {
  if (options instanceof Function) {
    onComplete = onError;
    onError = onNext;
    onNext = options;
    options = {};
  }

  var observable = Stream.createResultStream(this.entityManager, this._createRealTimeQuery(), options);

  if (onNext instanceof Function) {
    return observable.subscribe(onNext, onError, onComplete);
  } else {
    return observable;
  }
};

Node.prototype._createRealTimeQuery = function () {
  var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
  if (!type) {
    throw new Error('Only typed queries can be executed.');
  }

  var query = {
    bucket: type.name,
    query: this._serializeQuery()
  };

  var sort = this._serializeSort();
  if (sort && sort != '{}') {
    query.sort = sort;
  }

  if (this.maxResults > 0) query.limit = this.maxResults;

  if (this.firstResult > 0) query.offset = this.firstResult;

  return query;
};

module.exports = Node;

},{"182":182,"59":59}],182:[function(_dereq_,module,exports){
"use strict";

var Metadata = _dereq_(66);
var lib = _dereq_(34);
var uuid = _dereq_(77).uuid;

/**
 * @alias query.Stream
 */

var Stream = function () {
  function Stream() {
    babelHelpers.classCallCheck(this, Stream);
  }

  /**
   * Creates a live updating object stream for a query
   * @alias query.Stream.createStream<T>
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} query The query options
   * @param {string} query.query The serialized query
   * @param {string} query.bucket The Bucket on which the streaming query is performed
   * @param {string=} query.sort the sort string
   * @param {number=} query.limit the count, i.e. the number of items in the result
   * @param {number=} query.offset offset, i.e. the number of items to skip
   * @param {boolean=} query.initial Indicates if the initial result should be returned
   * @param {Object} options an object containing parameters
   * @return {Observable<RealtimeEvent<T>>} The query result as a live updating stream of objects
   */
  Stream.createEventStream = function createEventStream(entityManager, query, options) {
    options = options || {};
    options.reconnects = 0;
    return Stream.streamObservable(entityManager, query, options, function (msg, next) {
      var messageType = msg.type;
      delete msg.type;
      if (messageType == 'result') {
        var result = msg.data;
        msg.data.forEach(function (obj, index) {
          var event = Object.assign({
            matchType: 'add',
            operation: 'none',
            initial: true
          }, msg);

          event.data = Stream._resolveObject(entityManager, obj);
          if (query.sort) event.index = index;

          next(event);
        });
      }

      if (messageType == 'match') {
        msg.data = Stream._resolveObject(entityManager, msg.data);
        next(msg);
      }
    });
  };

  /**
   * Creates a live updating result stream for a query
   * @alias query.Stream.createStreamResult<T>
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} query The query options
   * @param {string} query.query The serialized query
   * @param {string} query.bucket The Bucket on which the streaming query is performed
   * @param {string=} query.sort the sort string
   * @param {number=} query.limit the count, i.e. the number of items in the result
   * @param {number=} query.offset offset, i.e. the number of items to skip
   * @param {Object} options an object containing parameters
   * @return {Observable<Array<T>>} The query result as a live updating query result
   */

  Stream.createResultStream = function createResultStream(entityManager, query, options) {
    options = options || {};
    options.initial = true;
    options.matchTypes = 'all';
    options.operations = 'any';

    var result = void 0,
        ordered = !!query.sort;
    return Stream.streamObservable(entityManager, query, options, function (event, next) {
      if (event.type == 'result') {
        result = event.data.map(function (obj) {
          return Stream._resolveObject(entityManager, obj);
        });
        next(result.slice());
      }

      if (event.type == 'match') {
        var obj = Stream._resolveObject(entityManager, event.data);

        if (event.matchType == 'remove' || event.matchType == 'changeIndex') {
          //if we have removed the instance our self, we do not have the cached instances anymore
          //therefore we can't find it anymore in the result by identity
          for (var i = 0, len = result.length; i < len; ++i) {
            if (result[i].id == event.data.id) {
              result.splice(i, 1);
              break;
            }
          }
        }

        if (event.matchType == 'add' || event.matchType == 'changeIndex') {
          ordered ? result.splice(event.index, 0, obj) : result.push(obj);
        }

        next(result.slice());
      }
    });
  };

  Stream.streamObservable = function streamObservable(entityManager, query, options, mapper, retryInterval) {
    options = Stream.parseOptions(options);
    var id = uuid();

    var socket = entityManager.entityManagerFactory.websocket;
    var observable = new lib.Observable(function (subscriber) {
      var stream = socket.openStream(entityManager.tokenStorage, id);

      stream.send(Object.assign({
        type: 'subscribe'
      }, query, options));

      var closed = false;
      var _next = subscriber.next.bind(subscriber);
      var subscription = stream.subscribe({
        complete: function complete() {
          closed = true;
          subscriber.complete();
        },
        error: function error(e) {
          closed = true;
          subscriber.error(e);
        },
        next: function next(msg) {
          mapper(msg, _next);
        }
      });

      return function () {
        if (!closed) {
          // send unsubscribe only when we aren't completed by the socket and call it only once
          stream.send({ type: 'unsubscribe' });
          subscription.unsubscribe();
          closed = true;
        }
      };
    });

    return Stream.cachedObservable(observable, options);
  };

  Stream.cachedObservable = function cachedObservable(observable, options) {
    var subscription = null;
    var observers = [];
    return new lib.Observable(function (observer) {
      if (!subscription) {
        var remainingRetries = options.reconnects;
        var subscriptionObserver = {
          next: function next(msg) {
            observers.forEach(function (o) {
              return o.next(msg);
            });
          },
          error: function error(e) {
            observers.forEach(function (o) {
              return o.error(e);
            });
          },
          complete: function complete() {
            if (remainingRetries !== 0) {
              remainingRetries = remainingRetries < 0 ? -1 : remainingRetries - 1;
              subscription = observable.subscribe(subscriptionObserver);
            } else {
              observers.forEach(function (o) {
                return o.complete();
              });
            }
          }
        };
        subscription = observable.subscribe(subscriptionObserver);
      }
      observers.push(observer);
      return function () {
        observers.splice(observers.indexOf(observer), 1);
        if (!observers.length) {
          subscription.unsubscribe();
          subscription = null;
        }
      };
    });
  };

  /**
   * Valid options are:
   <ul>
   <li>initial: a Boolean indicating whether or not the initial result set should be delivered on creating the subscription</li>
   <li>matchTypes: a list of match types</li>
   <li>operations: a list of operations</li>
   </ul>
   *
   *
   * @param {Object} options object containing options
   * @returns {Object} an object containing VALID options
   */

  Stream.parseOptions = function parseOptions(options) {
    options = options || {};

    var verified = {
      initial: options.initial === undefined || !!options.initial,
      matchTypes: Stream.normalizeMatchTypes(options.matchTypes),
      operations: Stream.normalizeOperations(options.operations),
      reconnects: Stream.normalizeReconnects(options.reconnects)
    };

    if (verified.matchTypes.indexOf('all') == -1 && verified.operations.indexOf('any') == -1) {
      throw new Error('Only subscriptions for either operations or matchTypes are allowed. You cannot subscribe to a query using matchTypes and operations at the same time!');
    }

    return verified;
  };

  Stream.normalizeMatchTypes = function normalizeMatchTypes(list) {
    return Stream.normalizeSortedSet(list, 'all', "match types", ['add', 'change', 'changeIndex', 'match', 'remove']);
  };

  Stream.normalizeReconnects = function normalizeReconnects(reconnects) {
    if (reconnects === undefined) {
      return -1;
    } else {
      return reconnects < 0 ? -1 : Number(reconnects);
    }
  };

  Stream.normalizeOperations = function normalizeOperations(list) {
    return Stream.normalizeSortedSet(list, 'any', "operations", ['delete', 'insert', 'none', 'update']);
  };

  Stream.normalizeSortedSet = function normalizeSortedSet(list, wildcard, itemType, allowedItems) {
    if (!list) {
      return [wildcard];
    }

    if (!Array.isArray(list)) {
      list = [list];
    }

    if (list.length == 0) {
      //undefined or empty list --> default value
      return [wildcard];
    }

    // sort, remove duplicates and check whether all values are allowed
    list.sort();
    var item = void 0;
    var lastItem = undefined;
    for (var i = list.length - 1; i >= 0; i--) {
      item = list[i];
      if (!item) {
        //undefined and null item in the list --> invalid!
        throw new Error('undefined and null not allowed!');
      }
      if (item === lastItem) {
        //remove duplicates
        list.splice(i, 1);
      }
      if (item === wildcard) {
        return [wildcard];
      }
      if (allowedItems.indexOf(item) == -1) {
        //raise error on invalid elements
        throw new Error(item + ' not allowed for ' + itemType + '! (permitted: ' + allowedItems + '.)');
      }
      lastItem = item;
    }

    return list;
  };

  Stream._resolveObject = function _resolveObject(entityManager, object) {
    var entity = entityManager.getReference(object.id);
    var metadata = Metadata.get(entity);
    if (!object.version) {
      metadata.setRemoved();
      entityManager.removeReference(entity);
    } else if (entity.version <= object.version) {
      metadata.setJson(object, { persisting: true });
    }
    return entity;
  };

  return Stream;
}();

module.exports = Stream;

},{"34":34,"66":66,"77":77}],183:[function(_dereq_,module,exports){
'use strict';

module.exports = exports = _dereq_(6);

exports.Observable = _dereq_(180);
exports.EntityManagerFactory = _dereq_(176);
exports.connector.WebSocketConnector = _dereq_(177);
exports.query.Node = _dereq_(181);
exports.query.Stream = _dereq_(182);

},{"176":176,"177":177,"180":180,"181":181,"182":182,"6":6}]},{},[179])(179)
});