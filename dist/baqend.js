/*!
* Baqend JavaScript SDK 1.1.0
* http://baqend.com
*
* Copyright (c) 2015 Baqend GmbH
*
* Includes:
* jahcode - http://jahcode.com/
* Copyright (c) 2011-2013 Florian Buecklers
*
* lie - https://github.com/calvinmetcalf/lie
* Copyright (c) 2014 Calvin Metcalf
*
* node-uuid - http://github.com/broofa/node-uuid
* Copyright (c) 2010-2012 Robert Kieffer
*
* validator - http://github.com/chriso/validator.js
* Copyright (c) 2015 Chris O'Hara <cohara87@gmail.com>
*
* Released under the MIT license
*
* Date: Fri, 01 Apr 2016 11:43:26 GMT
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DB = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var message = require('./message');
var error = require('./error');
var binding = require('./binding');
var util = require('./util');

var EntityTransaction = require('./EntityTransaction');
var Query = require('./Query');
var Metadata = require('./util/Metadata');
var Message = require('./connector/Message');
var StatusCode = Message.StatusCode;

/**
 * @class baqend.EntityManager
 * @extends baqend.util.Lockable
 *
 * @param {baqend.EntityManagerFactory} entityManagerFactory The factory which of this entityManager instance
 * @param {baqend.util.TokenStorage} tokenStorage The token storage to persist the authorization token
 */
var EntityManager = Object.inherit(util.Lockable, /** @lends baqend.EntityManager.prototype */ {

  /**
   * Creates a new List collection
   * @function
   * @param {baqend.collection.Collection|Array=} collection The initial array or collection to initialize the new List
   * @return {baqend.collection.List} The new created List
   */
  List: require('./collection').List,

  /**
   * Creates a new Set collection
   * @function
   * @param {baqend.collection.Collection|Array=} collection The initial array or collection to initialize the new Set
   * @return {baqend.collection.Set} The new created Set
   */
  Set: require('./collection').Set,

  /**
   * Creates a new Map collection
   * @function
   * @param {baqend.collection.Collection|Array=} collection The initial array or collection to initialize the new Map
   * @return {baqend.collection.Map} The new created Map
   */
  Map: require('./collection').Map,

  /**
   * Creates a new GeoPoint
   * @function
   * @param {String|Number|Object|Array=} latitude A coordinate pair (latitude first), a GeoPoint like object or the GeoPoint's latitude
   * @param {Number=} longitude The GeoPoint's longitude
   * @return {baqend.collection.GeoPoint} The new created Map
   */
  GeoPoint: require('./GeoPoint'),

  /**
   * @type baqend.EntityManagerFactory
   */
  entityManagerFactory: null,

  /**
   * @type baqend.metamodel.Metamodel
   */
  metamodel: null,

  /**
   * @type baqend.util.Code
   */
  code: null,

  /**
   * @type baqend.util.Modules
   */
  modules: null,

  /**
   * Log messages can created by calling log directly as function, with a specific log level or with the helper
   * methods, which a members of the log method.
   *
   * Logs will be filtered by the client logger and the baqend before they persisted. The default log level is
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
   * @type baqend.util.Logger
   */
  log: null,

  /**
   * The connector used for baqend requests
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * All managed and cached entity instances
   * @type object<String,baqend.binding.Entity>
   * @private
   */
  _entities: null,

  /**
   * Determine whether the entity manager is open.
   * true until the entity manager has been closed
   * @type Boolean
   */
  get isOpen() {
    return !!this._connector;
  },

  /**
   * The authentication token if the user is logged in currently
   * @type String
   */
  get token() {
    return this.tokenStorage.get(this._connector.origin);
  },

  set token(value) {
    this.tokenStorage.update(this._connector.origin, value);
  },

  /**
   * The current logged in user object
   * @type baqend.binding.User
   */
  me: null,

  /**
   * Returns true if the device token is already registered, otherwise false.
   * @type boolean
   */
  isDeviceRegistered: false,

  /**
   * Returns the tokenStorage which will be used to authorize all requests.
   * @type {baqend.util.TokenStorage}
   */
  tokenStorage: null,

  constructor: function EntityManager(entityManagerFactory, tokenStorage) {
    this.entityManagerFactory = entityManagerFactory;
    this.metamodel = entityManagerFactory.metamodel;
    this.code = entityManagerFactory.code;
    this.tokenStorage = tokenStorage;
    this.log = util.Logger.create(this);
  },

  /**
   * Connects this entityManager, used for synchronous and asynchronous initialization
   * @param {baqend.connector.Connector} connector
   * @param {Object=} connectData
   */
  connected: function(connector, connectData) {
    this._connector = connector;
    this._entities = {};

    this._createObjectFactory(this.metamodel.embeddables);
    this._createObjectFactory(this.metamodel.entities);

    this.transaction = new EntityTransaction(this);
    this.modules = new util.Modules(this, connector);

    if (this.tokenStorage == this.entityManagerFactory.tokenStorage && connectData) {
      this.isDeviceRegistered = !!connectData.device;
      if (connectData.user)
        this._updateUser(connectData.user, true);
    }
  },

  /**
   * @param {baqend.metamodel.ManagedType[]} types
   * @return {baqend.binding.ManagedFactory}
   * @private
   */
  _createObjectFactory: function(types) {
    Object.keys(types).forEach(function(ref) {
      var type = this.metamodel.managedType(ref);
      var name = type.name;

      if (this[name]) {
        type.typeConstructor = this[name];
        Object.defineProperty(this, name, {
          value: type.createObjectFactory(this)
        });
      } else {
        Object.defineProperty(this, name, {
          get: function() {
            Object.defineProperty(this, name, {
              value: type.createObjectFactory(this)
            });

            return this[name];
          },
          set: function(typeConstructor) {
            type.typeConstructor = typeConstructor;
          },
          configurable: true
        });
      }
    }, this);
  },

  _sendOverSocket : function(message) {
    message.token = this.token;
    this._connector.sendOverSocket(message);
  },

  _subscribe : function(topic, cb) {
    this._connector.subscribe(topic, cb);
  },

  _unsubscribe : function(topic, cb) {
    this._connector.unsubscribe(topic, cb);
  },

  _send: function(message) {
    message.tokenStorage = this.tokenStorage;
    return this._connector.send(message).catch(function(e) {
      if (e.status == StatusCode.BAD_CREDENTIALS) {
        this._logout();
      }
      throw e;
    }.bind(this));
  },

  /**
   * Get an instance, whose state may be lazily fetched. If the requested instance does not exist
   * in the database, the EntityNotFoundError is thrown when the instance state is first accessed.
   * The application should not expect that the instance state will be available upon detachment,
   * unless it was accessed by the application while the entity manager was open.
   *
   * @param {(Function|String)} entityClass
   * @param {String=} key
   */
  getReference: function(entityClass, key) {
    var id, type;
    if (key) {
      type = this.metamodel.entity(entityClass);
      if (key.indexOf('/db/') == 0) {
        id = key;
      } else {
        id = type.ref + '/' + encodeURIComponent(key);
      }
    } else {
      id = entityClass;
      type = this.metamodel.entity(id.substring(0, id.indexOf('/', 4))); //skip /db/
    }

    var entity = this._entities[id];
    if (!entity) {
      entity = type.create();
      var metadata = Metadata.get(entity);
      metadata.id = id;
      metadata.setUnavailable();

      this._attach(entity);
    }

    return entity;
  },

  /**
   * Creates an instance of Query.Builder for query creation and execution. The Query results are instances of the
   * resultClass argument.
   * @param {Function=} resultClass - the type of the query result
   * @return {baqend.Query.Builder} A query builder to create one ore more queries for the specified class
   */
  createQueryBuilder: function(resultClass) {
    return new Query.Builder(this, resultClass);
  },

  /**
   * Clear the persistence context, causing all managed entities to become detached.
   * Changes made to entities that have not been flushed to the database will not be persisted.
   */
  clear: function() {
    this._entities = {};
  },

  /**
   * Close an application-managed entity manager. After the close method has been invoked,
   * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it
   * will throw the IllegalStateError except for transaction, and isOpen (which will return false).
   * If this method is called when the entity manager is associated with an active transaction,
   * the persistence context remains managed until the transaction completes.
   */
  close: function() {
    this._connector = null;

    return this.clear();
  },

  /**
   * Check if the instance is a managed entity instance belonging to the current persistence context.
   * @param {baqend.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity is in persistence context
   */
  contains: function(entity) {
    return !!entity && this._entities[entity.id] === entity;
  },

  /**
   * Check if an object with the id from the given entity is already attached.
   * @param {baqend.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity with same id is attached
   */
  containsById: function(entity) {
    return !!(entity && this._entities[entity.id]);
  },

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached.
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it.
   * @param {baqend.binding.Entity} entity - entity instance
   */
  detach: function(entity) {
    var state = Metadata.get(entity);
    return state.withLock(function() {
      this.removeReference(entity);
      return Promise.resolve(entity);
    }.bind(this));
  },

  /**
   * Resolve the depth by loading the referenced objects of the given entity.
   *
   * @param {baqend.binding.Entity} entity - entity instance
   * @param {Object} [options] The load options
   * @return {Promise<baqend.binding.Entity>}
   */
  resolveDepth: function(entity, options) {
    if(!options || !options.depth)
      return Promise.resolve(entity);

    options.resolved = options.resolved || [];
    var promises = [];
    var subOptions = Object.extend({}, options);
    subOptions.depth = options.depth === true ? true : options.depth-1;
    this.getSubEntities(entity, 1).forEach(function(subEntity) {
      if(subEntity != null && !~options.resolved.indexOf(subEntity)) {
        options.resolved.push(subEntity);
        promises.push(this.load(subEntity.id, null, subOptions));
      }
    }.bind(this));

    return Promise.all(promises).then(function() {
      return entity;
    });
  },

  /**
   * Loads Object ID. Search for an entity of the specified oid.
   * If the entity instance is contained in the persistence context, it is returned from there.
   * @param {(Function|String)} entityClass - entity class
   * @param {String} oid - Object ID
   * @param {Object} [options] The load options
   * @return {Promise<baqend.binding.Entity>}
   */
  load: function(entityClass, oid, options) {
    options = options || {};
    var entity = this.getReference(entityClass, oid);
    var state = Metadata.get(entity);

    var tid = 0;

    //TODO: implement transactional changed case
    //if (this.transaction.isChanged(ref))
    //  tid = this.transaction.tid;

    var msg = new message.GetObject(state.bucket, state.key);

    //msg.setCacheControl('max-age=0,no-cache');

    if (state.version || options.refresh) {
      // force a refresh with a unused eTag
      msg.setIfNoneMatch(options.refresh? '': state.version);
    }

    return this._send(msg).then(function(msg) {
      if (msg.response.status != StatusCode.NOT_MODIFIED) {
        state.setJson(msg.response.entity);
      }

      state.setPersistent();

      return this.resolveDepth(entity, options);
    }.bind(this), function(e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        this.removeReference(entity);
        state.setRemoved();
        return null;
      } else {
        throw e;
      }
    }.bind(this));
  },

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @return {Promise<baqend.binding.Entity>}
   */
  insert: function(entity, options) {
    options = options || {};
    var isNew;

    return this._save(entity, options, function(state) {
      if (state.version)
        throw new error.PersistentError('Existing objects can\'t be inserted.');

      isNew = !state.id;

      return new message.CreateObject(state.bucket, state.getJson());
    }).then(function(val) {
      if (isNew)
        this._attach(entity);

      return val;
    }.bind(this));
  },

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @return {Promise<baqend.binding.Entity>}
   */
  update: function(entity, options) {
    options = options || {};

    return this._save(entity, options, function(state) {
      if(!state.version)
        throw new error.PersistentError("New objects can't be inserted.");

      if (options.force) {
        var msg = new message.ReplaceObject(state.bucket, state.key, state.getJson(true));
        msg.setIfMatch('*');
        return msg;
      } else {
        msg = new message.ReplaceObject(state.bucket, state.key, state.getJson(false));
        msg.setIfMatch(state.version);
        return msg;
      }
    });
  },

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options The save options
   * @return {Promise<baqend.binding.Entity>}
   */
  save: function(entity, options) {
    options = options || {};

    return this._save(entity, options, function(state) {
      if (options.force) {
        if (!state.id)
          throw new error.PersistentError("New special objects can't be forcedly saved.");

        return new message.ReplaceObject(state.bucket, state.key, state.getJson(true));
      } else if (state.version) {
        var msg = new message.ReplaceObject(state.bucket, state.key, state.getJson(false));
        msg.setIfMatch(state.version);
        return msg;
      } else {
        return new message.CreateObject(state.bucket, state.getJson());
      }
    });
  },

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Function} cb pre-safe callback
   * @return {Promise<baqend.binding.Entity>}
   */
  optimisticSave: function(entity, cb) {
    var abort = false;
    var abortFn = function() {
      abort = true;
    };
    var promise = Promise.resolve(cb(entity, abortFn));

    if(abort)
      return Promise.resolve(entity);

    return promise.then(function() {
      return entity.save().catch(function(e) {
        if(e.status == 412) {
          return this.refresh(entity).then(function() {
            return this.optimisticSave(entity, cb);
          }.bind(this));
        } else {
          throw e;
        }
      }.bind(this));
    }.bind(this));
  },

  /**
   * Save the object state
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @param {Function} msgFactory
   * @return {Promise.<baqend.binding.Entity>}
   * @private
   */
  _save: function(entity, options, msgFactory) {
    this.attach(entity);
    var state = Metadata.get(entity);
    return state.withLock(function() {
      var refPromises;
      if (state.isDirty) {
        if(!options.refresh) {
          state.setPersistent();
        }

        var sendPromise = this._send(msgFactory(state)).then(function(msg) {
          if(options.refresh) {
            state.setJson(msg.response.entity);
            state.setPersistent();
          } else {
            state.setJsonMetadata(msg.response.entity);
          }
          return entity;
        }.bind(this), function(e) {
          if (e.status == StatusCode.OBJECT_NOT_FOUND) {
            this.removeReference(entity);
            state.setRemoved();
            return null;
          } else {
            state.setDirty();
            throw e;
          }
        }.bind(this));

        refPromises = [sendPromise];
      } else {
        refPromises = [Promise.resolve(entity)];
      }

      var subOptions = Object.extend({}, options);
      subOptions.depth = 0;
      this.getSubEntities(entity, options.depth).forEach(function(sub) {
        refPromises.push(this._save(sub, subOptions, msgFactory));
      }.bind(this));

      return Promise.all(refPromises).then(function() {
        return entity
      });
    }.bind(this));
  },

  /**
   * Returns all referenced sub entities for the given depth and root entity
   * @param {baqend.binding.Entity} entity
   * @param {Boolean|Number} depth
   * @param {baqend.binding.Entity[]} [resolved]
   * @param {baqend.binding.Entity=} initialEntity
   * @returns {baqend.binding.Entity[]}
   */
  getSubEntities: function(entity, depth, resolved, initialEntity) {
    resolved = resolved || [];
    if(!depth) {
      return resolved;
    }
    initialEntity = initialEntity || entity;

    var state = Metadata.get(entity);
    for (var iter = state.type.references(), item = iter.next(); !item.done; item = iter.next()) {
      this.getSubEntitiesByPath(entity, item.value.path).forEach(function(subEntity) {
        if(!~resolved.indexOf(subEntity) && subEntity != initialEntity) {
          resolved.push(subEntity);
          resolved = this.getSubEntities(subEntity, depth === true ? depth : depth-1, resolved, initialEntity);
        }
      }.bind(this));
    }

    return resolved;
  },

  /**
   * Returns all referenced one level sub entities for the given path
   * @param {baqend.binding.Entity} entity
   * @param {Array} path
   * @returns {baqend.binding.Entity[]}
   */
  getSubEntitiesByPath: function(entity, path) {
    var subEntities = [entity];

    path.forEach(function(attributeName) {

      var tmpSubEntities = [];
      subEntities.forEach(function(subEntity) {
        var curEntity = subEntity[attributeName];
        if(!curEntity)
          return;

        var attribute = this.metamodel.managedType(subEntity.constructor).getAttribute(attributeName);
        if(attribute.isCollection) {
          for (var colIter = curEntity.entries(), colItem; !(colItem = colIter.next()).done; ) {
            tmpSubEntities.push(colItem.value[1]);
            attribute.keyType && attribute.keyType.isEntity && tmpSubEntities.push(colItem.value[0]);
          }
        } else {
          tmpSubEntities.push(curEntity);
        }
      }.bind(this));
      subEntities = tmpSubEntities;

    }.bind(this));

    return subEntities;
  },

  /**
   * Delete the entity instance.
   * @param {baqend.binding.Entity} entity
   * @param {Object} options The delete options
   * @return {Promise<baqend.binding.Entity>}
   */
  delete: function(entity, options) {
    options = options || {};

    this.attach(entity);
    var state = Metadata.get(entity);

    return state.withLock(function() {
      if(!state.version && !options.force)
        throw new error.IllegalEntityError(entity);

      var msg = new message.DeleteObject(state.bucket, state.key);

      if (!options.force)
        msg.setIfMatch(state.version);

      var refPromises = [ this._send(msg).then(function() {
        this.removeReference(entity);
        state.setRemoved();
        return entity;
      }.bind(this)) ];

      var subOptions = Object.extend({}, options);
      subOptions.depth = 0;
      this.getSubEntities(entity, options.depth).forEach(function(sub) {
        refPromises.push(this.delete(sub, subOptions));
      }.bind(this));

      return Promise.all(refPromises).then(function() {
        return entity;
      });
    }.bind(this));
  },

  /**
   * Synchronize the persistence context to the underlying database.
   *
   * @returns {baqend.Promise}
   */
  flush: function(doneCallback, failCallback) {
    // TODO: implement this
  },

  /**
   * Make an instance managed and persistent.
   * @param {baqend.binding.Entity} entity - entity instance
   */
  persist: function(entity) {
    entity.attach(this);
  },

  /**
   * Refresh the state of the instance from the database, overwriting changes made to the entity, if any.
   * @param {baqend.binding.Entity} entity - entity instance
   * @param {Object} options The refresh options
   * @return {Promise<baqend.binding.Entity>}
   */
  refresh: function(entity, options) {
    options = options || {};
    options.refresh = true;

    return this.load(entity.id, null, options);
  },

  /**
   * Attach the instance to this database context, if it is not already attached
   * @param {baqend.binding.Entity} entity The entity to attach
   */
  attach: function(entity) {
    if (!this.contains(entity)) {
      var type = this.metamodel.entity(classOf(entity));
      if (!type)
        throw new error.IllegalEntityError(entity);

      if(this.containsById(entity))
        throw new error.EntityExistsError(entity);

      this._attach(entity);
    }
  },

  _attach: function(entity) {
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
  },

  removeReference: function(entity) {
    var state = Metadata.get(entity);
    if (!state)
      throw new error.IllegalEntityError(entity);

    delete this._entities[state.id];
  },

  register: function(user, password, loginOption) {
    var login = loginOption > binding.UserFactory.LoginOption.NO_LOGIN;

    if (this.me && login)
      throw new error.PersistentError('User is already logged in.');

    if (loginOption >= binding.UserFactory.LoginOption.PERSIST_LOGIN && !this.token)
      this.tokenStorage.update(this._connector.origin, "", true);

    return this.withLock(function() {
      var msg = new message.Register({
        user: user,
        password: password,
        login: login
      });
      return this._userRequest(msg, login);
    }.bind(this));
  },

  login: function(username, password, loginOption) {
    if (this.me)
      throw new error.PersistentError('User is already logged in.');

    if (loginOption >= binding.UserFactory.LoginOption.PERSIST_LOGIN && !this.token)
      this.tokenStorage.update(this._connector.origin, "", true);

    return this.withLock(function() {
      var msg = new message.Login({
        username: username,
        password: password
      });

      return this._userRequest(msg, true);
    }.bind(this));
  },

  logout: function() {
    return this.withLock(function() {
      return Promise.resolve(this._logout());
    }.bind(this));
  },

  loginWithOAuth: function(provider, clientID, options) {
    options = Object.extend({
      title: "Login with " + provider,
      timeout: 5 * 60 * 1000,
      state: {}
    }, options);

    var msg;
    if (Message[provider + 'OAuth']) {
      msg = new Message[provider + 'OAuth'](clientID, options.scope, JSON.stringify(options.state));
    } else {
      throw new Error("Provider not supported.");
    }

    var req = this._userRequest(msg, true);
    var w = open(msg.request.path, options.title, 'width=' + options.width + ',height=' + options.height);

    return new Promise(function(resolve, reject) {
      var timeout = setTimeout(function() {
        reject(new error.PersistentError('OAuth login timeout.'));
      }, options.timeout);

      req.then(function(result) {
        clearTimeout(timeout);
        resolve(result);
      }, function(e) {
        clearTimeout(timeout);
        reject(e);
      });
    }.bind(this));
  },

  renew: function() {
    return this.withLock(function() {
      var msg = new message.Me();
      return this._userRequest(msg, true);
    }.bind(this));
  },

  newPassword: function(username, password, newPassword) {
    return this.withLock(function() {
      var msg = new message.NewPassword({
        username: username,
        password: password,
        newPassword: newPassword
      });

      return this._send(msg).then(function() {
        this._updateUser(msg.response.entity);
      }.bind(this));
    }.bind(this));
  },

  _updateUser: function(obj, updateMe) {
    var user = this.getReference(obj.id);
    var metadata = Metadata.get(user);
    metadata.setJson(obj);
    metadata.setPersistent();

    if (updateMe)
      this.me = user;

    return user;
  },

  _logout: function() {
    this.me = null;
    this.tokenStorage.update(this._connector.origin, null);
  },

  _userRequest: function(msg, updateMe) {
    return this._send(msg).then(function() {
      if(msg.response.entity) {
        return this._updateUser(msg.response.entity, updateMe);
      }
    }.bind(this), function(e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        if (updateMe) {
          this._logout();
        }
        return null;
      } else {
        throw e;
      }
    }.bind(this));
  },

  registerDevice: function(os, token, device) {
    var msg = new message.DeviceRegister({
      token: token,
      devicetype: os,
      device: device
    });

    msg.withCredentials = true;
    return this._send(msg);
  },

  checkDeviceRegistration: function() {
    return this._send(new message.DeviceRegistered()).then(function() {
      return this.isDeviceRegistered = true;
    }.bind(this), function(e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return this.isDeviceRegistered = false;
      } else {
        throw e;
      }
    }.bind(this));
  },

  pushDevice: function(pushMessage) {
    return this._send(new message.DevicePush(pushMessage));
  },

  /**
   * The given entity will be checked by the validation code of the entity type.
   *
   * @param {baqend.binding.Entity} entity
   * @returns {baqend.util.ValidationResult} result
   */
  validate: function(entity) {
    var type = Metadata.get(entity).type;

    var result = new util.ValidationResult();
    for (var iter = type.attributes(), item; !(item = iter.next()).done; ) {
      var validate = new util.Validator(item.value.name, entity);
      result.fields[validate.key] = validate;
    }

    var validationCode = type.validationCode;
    if(validationCode) {
      validationCode(result.fields);
    }

    return result;
  },

  /**
   * An User factory for user objects.
   * The User factory can be called to create new instances of users or can be used to register/login/logout users.
   * The created instances implements the {@link baqend.binding.User} interface
   * @type baqend.binding.UserFactory
   */
  User: null,

  /**
   * An Device factory for user objects.
   * The Device factory can be called to create new instances of devices or can be used to register, push to and
   * check registration status of devices.
   * @type baqend.binding.DeviceFactory
   */
  Device: null

  /**
   * An Object factory for embeddable objects,
   * that can be accessed by the type name of the embeddable type.
   * An object factory can be called to create new instances of the type.
   * The created instances implements the {@link baqend.binding.Managed} interface
   * @name &lt;<i>YourEmbeddableClass</i>&gt;
   * @memberOf baqend.EntityManager.prototype
   * @type {baqend.binding.ManagedFactory}
   */

  /**
   * An Object factory for entity objects,
   * that can be accessed by the type name of the entity type.
   * An object factory can be called to create new instances of the type.
   * The created instances implements the {@link baqend.binding.Entity} interface
   * @name &lt;<i>YourEntityClass</i>&gt;
   * @memberOf baqend.EntityManager.prototype
   * @type {baqend.binding.EntityFactory}
   */

  /**
   * An Role factory for role objects.
   * The Role factory can be called to create new instances of roles.
   * The created instances implements the {@link baqend.binding.Role} interface
   * @name Role
   * @memberOf baqend.EntityManager.prototype
   * @type baqend.binding.EntityFactory
   */
});

module.exports = EntityManager;
},{"./EntityTransaction":3,"./GeoPoint":4,"./Query":5,"./binding":16,"./collection":17,"./connector/Message":20,"./error":30,"./message":32,"./util":62,"./util/Metadata":54}],2:[function(require,module,exports){
var message = require('./message');
var metamodel = require('./metamodel');

var util = require('./util');
var Connector = require('./connector/Connector');
var EntityManager = require('./EntityManager');

/**
 * @class baqend.EntityManagerFactory
 * @extends baqend.util.Lockable
 *
 * Creates a new EntityManagerFactory connected to the given destination
 * @param {String|Object} [options] The baqend destination to connect with, or an options object
 * @param {String} [options.host] The baqend destination to connect with
 * @param {Number} [options.port=80|443] The optional baqend destination port to connect with
 * @param {Boolean} [options.secure=false] <code>true</code> To use a secure ssl encrypted connection
 * @param {String} [options.basePath="/v1"] The base path of the baqend api
 * @param {Object} [options.schema=null] The serialized schema as json used to initialize the metamodel
 * @param {Boolean} [options.global=false] <code>true</code> To create the emf for the global DB
 */
var EntityManagerFactory = Object.inherit(util.Lockable, /** @lends baqend.EntityManagerFactory.prototype */ {

  /**
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @type baqend.metamodel.Metamodel
   */
  metamodel: null,

  /**
   * @type baqend.util.Code
   */
  code: null,

  /**
   * @type baqend.util.TokenStorage
   */
  tokenStorage: null,

  /**
   * @type Object
   * @private
   */
  _connectData: null,

  constructor: function EntityManagerFactory(options) {
    options = String.isInstance(options)? {host: options}: options || {};

    this.metamodel = this.createMetamodel();
    this.code = new util.Code(this.metamodel, this);
    this.tokenStorage = options.tokenStorage || util.TokenStorage.WEB_STORAGE || util.TokenStorage.GLOBAL;

    var isReady = true;
    var ready = new Promise(function(success) {
      this._connected = success;
    }.bind(this));

    if (options.host) {
      this.connect(options.host, options.port, options.secure, options.basePath);
    } else {
      isReady = false;
    }

    if (options.schema) {
      this._connectData = options;
      this.metamodel.init(options.schema);
    } else {
      isReady = false;
      ready = ready.then(function() {
        var msg = new message.Connect();
        msg.withCredentials = true; //used for registered devices
        return this.send(msg);
      }.bind(this)).then(function(data) {
        this._connectData = data.response.entity;

        if (!this.metamodel.isInitialized)
          this.metamodel.init(this._connectData.schema);

        this.tokenStorage.update(this._connector.origin, this._connectData.token);
      }.bind(this));
    }

    if (!isReady) {
      this.withLock(function() {
        return ready;
      }, true);
    }
  },

  /**
   * Connects this EntityManager to the given destination
   * @param {String} hostOrApp The host or the app name to connect with
   * @param {Number} [port=80|443] The port to connect to
   * @param {Boolean} [secure=false] <code>true</code> To use a secure connection
   * @param {String} [basePath="/v1"] The base path of the baqend api
   */
  connect: function(hostOrApp, port, secure, basePath) {
    if (this._connector)
      throw new Error('The EntityManagerFactory is already connected.');

    if (Boolean.isInstance(port)) {
      basePath = secure;
      secure = port;
      port = 0;
    }

    this._connector = Connector.create(hostOrApp, port, secure, basePath);

    this._connected();
    return this.ready();
  },

  /**
   * Creates a new Metamodel instance, which is not connected
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel: function() {
    return new metamodel.Metamodel(this);
  },

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {Boolean|baqend.util.TokenStorage=} tokenStorage The token storage to persist the authorization token, or
   * <code>true</code> To use the the global token storage for authorization tokens.
   * <code>false</code> To not use any token storage.
   *
   * @returns {baqend.EntityManager} a new entityManager
   */
  createEntityManager: function(tokenStorage) {
    var em = new EntityManager(this, tokenStorage === true? this.tokenStorage: tokenStorage || new util.TokenStorage());

    if (this.isReady) {
      em.connected(this._connector, this._connectData);
    } else {
      em.withLock(function() {
        return this.ready().then(function() {
          em.connected(this._connector, this._connectData);
        }.bind(this));
      }.bind(this), true);
    }

    return em;
  },

  send: function(message) {
    if (!message.tokenStorage)
      message.tokenStorage = this.tokenStorage;
    return this._connector.send(message);
  }
});


module.exports = EntityManagerFactory;
},{"./EntityManager":1,"./connector/Connector":18,"./message":32,"./metamodel":48,"./util":62}],3:[function(require,module,exports){
var message = require('./message');
var error = require('./error');

/**
 * @class baqend.EntityTransaction
 */
var EntityTransaction = Object.inherit(/** @lends baqend.EntityTransaction.prototype */ {

	/**
	 * Indicate whether a resource transaction is in progress. 
	 * @returns {Boolean} indicating whether transaction is in progress 
 	 */
	get isActive() {
    return Boolean(this.tid);
	},
	
	/**
	 * @param {baqend.EntityManager} entityManager
	 */
	constructor: function EntityTransaction(entityManager) {
		this._connector = entityManager.connector;
		this.entityManager = entityManager;
		
		this.tid = null;
		this.rollbackOnly = false;
		
		this.readSet = null;
		this.changeSet = null;
	},
	
	/**
	 * Start a resource transaction.
	 */
	begin: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new message.PostTransaction()).done(function(msg) {
				this.tid = msg.tid;

				this.rollbackOnly = false;
				this.readSet = {};
				this.changeSet = {};
			});
			
			return this.wait(result);
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Commit the current resource transaction, writing any unflushed changes to the database. 
	 */
	commit: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			if (this.getRollbackOnly()) {
				return this.rollback().then(function() {
					throw new error.RollbackError();
				});
			} else {
				return this.wait(this.entityManager.flush()).then(function() {
					var readSet = [];
					for (var ref in this.readSet) {
						readSet.push({
							"oid": ref,
							"version": this.readSet[ref]
						});
					}
					
					var result = this.send(new message.PutTransactionCommitted(this.tid, readSet));
					
					return this.wait(result).then(function(msg) {
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
	},
	
	/**
	 * Determine whether the current resource transaction has been marked for rollback. 
	 * @returns {Boolean} indicating whether the transaction has been marked for rollback 
	 */
	getRollbackOnly: function() {
		return this.rollbackOnly;
	},
	
	/**
	 * Roll back the current resource transaction. 
	 */
	rollback: function(doneCallback, failCallback) {
		return this.yield().then(function() {
			var result = this.send(new message.PutTransactionAborted(this.tid));
			
			this.wait(result).then(function() {
				this.tid = null;
				this.readSet = null;
				this.changeSet = null;
				return this.entityManager.clear();
			}, function() {
				return this.entityManager.clear();
			});
		}).then(doneCallback, failCallback);
	},
	
	/**
	 * Mark the current resource transaction so that the only possible outcome of the transaction is for the transaction to be rolled back. 
	 */
	setRollbackOnly: function(context, onSuccess) {
		return this.yield().done(function() {
			this.rollbackOnly = true;
		});
	},
	
	isRead: function(identifier) {
		return this.isActive && identifier in this.readSet;
	},
	
	setRead: function(identifier, version) {
		if (this.isActive && !this.isChanged(identifier)) {
			this.readSet[identifier] = version;
		}
	},
	
	isChanged: function(identifier) {
		return this.isActive && identifier in this.changeSet;
	},
	
	setChanged: function(identifier) {
		if (this.isActive) {
			delete this.readSet[identifier];
			this.changeSet[identifier] = true;
		}
	}
});

module.exports = EntityTransaction;
},{"./error":30,"./message":32}],4:[function(require,module,exports){
var collection = require('./collection');

/**
 * Creates a new GeoPoint instance
 * From latitude and longitude
 * From a json object
 * Or an tuple of latitude and longitude
 *
 * @class baqend.GeoPoint
 *
 * @param {String|Number|Object|Array=} latitude A coordinate pair (latitude first), a GeoPoint like object or the GeoPoint's latitude
 * @param {Number=} longitude The GeoPoint's longitude
 */
var GeoPoint = Object.inherit(/** @lends baqend.GeoPoint.prototype */ {

  /** @lends baqend.GeoPoint */
  extend: {
    DEG_TO_RAD: Math.PI/180,

    /**
     * The Earth radius in kilometers used by {@link baqend.GeoPoint#kilometersTo}
     * @type {Number}
     */
    EARTH_RADIUS_IN_KILOMETERS: 6371,

    /**
     * The Earth radius in miles used by {@link baqend.GeoPoint#milesTo}
     * @type {Number}
     */
    EARTH_RADIUS_IN_MILES: 3956,

    /**
     * Creates a GeoPoint with the user's current location, if available.
     * @return {Promise<baqend.GeoPoint>} A promise that will be resolved with a GeoPoint
     */
    current: function() {
      return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(function(location) {
          resolve(new GeoPoint(location.coords.latitude, location.coords.longitude));
        }, function(error) {
          reject(error);
        });
      });
    },

    conv: function(param) {
      return new this(param);
    }
  },

  latitude: 0,
  longitude: 0,

  /**
   * @private
   */
  constructor: function GeoPoint(latitude, longitude) {
    if (String.isInstance(latitude)) {
      var index = latitude.indexOf(';');
      this.latitude = latitude.substring(0, index);
      this.longitude = latitude.substring(index + 1);
    } else if (Number.isInstance(latitude)) {
      this.latitude = latitude;
      this.longitude = longitude;
    } else if (Array.isInstance(latitude)) {
      this.latitude = latitude[0];
      this.longitude = latitude[1];
    } else if (Object.isInstance(latitude)) {
      this.latitude = latitude.latitude;
      this.longitude = latitude.longitude;
    }

    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error("Latitude " + this.latitude + " is not in bound of -90 <= latitude <= 90");
    }

    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error("Longitude " + this.longitude + " is not in bound of -180 <= longitude <= 180");
    }
  },

  /**
   * Returns the distance from this GeoPoint to another in kilometers.
   * @param {baqend.GeoPoint} point another GeoPoint
   * @return {Number} The distance in kilometers
   *
   * @see baqend.GeoPoint#radiansTo
   */
  kilometersTo: function(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_KILOMETERS * this.radiansTo(point)).toFixed(3));
  },

  /**
   * Returns the distance from this GeoPoint to another in miles.
   * @param {baqend.GeoPoint} point another GeoPoint
   * @return {Number} The distance in miles
   *
   * @see baqend.GeoPoint#radiansTo
   */
  milesTo: function(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_MILES * this.radiansTo(point)).toFixed(3));
  },

  /**
   * Computes the arc, in radian, between two WGS-84 positions.
   *
   * The haversine formula implementation is taken from:
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   *
   * Returns the distance from this GeoPoint to another in radians.
   * @param {baqend.GeoPoint} point another GeoPoint
   * @return {Number} the arc, in radian, between two WGS-84 positions
   *
   * @see http://en.wikipedia.org/wiki/Haversine_formula
   */
  radiansTo: function(point) {
    var from = this, to = point;
    var rad1 = from.latitude * GeoPoint.DEG_TO_RAD,
        rad2 = to.latitude * GeoPoint.DEG_TO_RAD,
        dLng = (to.longitude - from.longitude) * GeoPoint.DEG_TO_RAD;

    return Math.acos(Math.sin(rad1) * Math.sin(rad2) + Math.cos(rad1) * Math.cos(rad2) * Math.cos(dLng));
  },

  /**
   * A String representation in latitude, longitude format
   * @return {String} The string representation of this class
   */
  toString: function() {
    return this.latitude + ';' + this.longitude;
  },

  /**
   * Returns a JSON representation of the GeoPoint
   * @return {Object} A GeoJson object of this GeoPoint
   */
  toJSON: function() {
    return {latitude: this.latitude, longitude: this.longitude};
  }
});

module.exports = GeoPoint;

},{"./collection":17}],5:[function(require,module,exports){
var message = require('./message');
var Metadata = require('./util/Metadata');
var Entity = require('./binding/Entity');

/**
 * @class baqend.Query
 */
var Query = Trait.inherit(/** @lends baqend.Query.prototype */ {

  extend: {
    MAX_URI_SIZE: 2000
  },

  /**
   * The owning EntityManager of this query
   * @type baqend.EntityManager
   */
  entityManager: null,

  /**
   * The result class of this query
   * @type Function
   */
  resultClass: null,


  /**
   * Add an ascending sort for the specified field to this query
   * @param field The field to sort
   * @return {baqend.Query} The resulting Query
   */
  ascending: function(field) {
    return this._addOrder(field, 1);
  },

  /**
   * Add an decending sort for the specified field to this query
   * @param field The field to sort
   * @return {baqend.Query} The resulting Query
   */
  descending: function(field) {
    return this._addOrder(field, -1);
  },

  /**
   * Sets the sort of the query and discard all existing paramaters
   * @param {Object} sort The new sort of the query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   */
  sort: function(sort) {
    if (classOf(sort) != Object)
      throw new Error('sort must be an object.');

    return this._addOrder(sort);
  },

  /**
   * Sets the offset of the query, i.e. how many elements should be skipped
   * @param offset The offset of this query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.skip/
   */
  offset: function(offset) {
    if (offset < 0)
      throw new Error("The offset can't be nagative.");

    return this._addOffset(offset);
  },

  /**
   * Sets the limit of this query, i.e hox many objects should be returnd
   * @param limit The limit of this query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.limit/
   */
  limit: function(limit) {
    if (limit < 0)
      throw new Error("The limit can't be nagative.");

    return this._addLimit(limit);
  },

  /**
   * Execute the query and return the query results as a List.
   * Note: All local unsaved changes on matching objects, will be discarded.
   * @param {Object} [options] The query options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * objects, <code>true</code> loads the objects by reachability.
   * @param {Function=} doneCallback Called when the operation succeed.
   * @param {Function=} failCallback Called when the operation failed.
   * @return {Promise<Array<baqend.binding.Entity>>} A promise that will be resolved with the query result as a list
   */
  resultList: function(options, doneCallback, failCallback) {
  },

  /**
   * Execute the query that returns a single result.
   * Note: All local unsaved changes on the matched object, will be discarded.
   * @param {Object} [options] The query options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * object, <code>true</code> loads the objects by reachability.
   * @param {Function=} doneCallback Called when the operation succeed.
   * @param {Function=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A promise that will be resolved with the query result as a single result
   */
  singleResult: function(options, doneCallback, failCallback) {},


  stream: function(fetchQuery) {},

  /**
   * Execute the query that returns the matching objects count.
   * @return {Promise<Number>} The total number of matched objects
   */
  count: function(doneCallback, failCallback) {}
});

/**
 * @class baqend.Query.Condition
 * @extends baqend.Query
 */
Query.Condition = Query.inherit(/** @lends baqend.Query.Condition.prototype */ {

  /**
   * An object, that contains filter rules which will be merged with the current filters of this query.
   * @param {Object} conditions - Additional filters for this query
   * @return {baqend.Query.Condition} The resulting Query
   */
  where: function(conditions) {
    return this._addFilter(null, null, conditions);
  },

  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @param {String} field The field to filter
   * @param {*} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  equal: function(field, value) {
    return this._addFilter(field, null, value);
  },

  /**
   * Adds a not equal filter to the field.
   * @param {String} field The field to filter
   * @param {*} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notEqual: function(field, value) {
    return this._addFilter(field, "$ne", value);
  },

  /**
   * Adds a greater than filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  greaterThan: function(field, value) {
    return this._addFilter(field, "$gt", value);
  },

  /**
   * Adds a greater than or equal to filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  greaterThanOrEqualTo: function(field, value) {
    return this._addFilter(field, "$gte", value);
  },

  /**
   * Adds a less than filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lessThan: function(field, value) {
    return this._addFilter(field, "$lt", value);
  },

  /**
   * Adds a less than or equal to filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  lessThanOrEqualTo: function(field, value) {
    return this._addFilter(field, "$lte", value);
  },

  /**
   * Adds a between filter to the field. This is a shorthand for an less than and greater than filter.
   * @param {String} field The field to filter
   * @param {Number|String|Date} lessValue The field value must be greater than this value
   * @param {Number|String|Date} greaterValue The field value must be less than this value
   * @return {baqend.Query.Condition} The resulting Query
   */
  between: function(field, lessValue, greaterValue) {
    return this._addFilter(field, "$gt", lessValue)
        ._addFilter(field, "$lt", greaterValue);
  },

  /**
   * Adds a in filter to the field. The field value must be equal to one of the given values
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  'in': function(field, args) {
    return this._addFilter(field, "$in", classOf(args) == Array ? args : Array.prototype.slice.call(arguments, 1));
  },

  /**
   * Adds a not in filter to the field. The field value must not be equal to any of the given values
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notIn: function(field, args) {
    return this._addFilter(field, "$nin", classOf(args) == Array ? args : Array.prototype.slice.call(arguments, 1));
  },

  /**
   * Adds a null filter to the field. The field value must be null
   * @param {String} field The field to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  isNull: function(field) {
    return this.equal(field, null);
  },

  /**
   * Adds a not null filter to the field. The field value must not be null
   * @param {String} field The field to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  isNotNull: function(field) {
    return this._addFilter(field, "$exists", true)
        ._addFilter(field, "$ne", null);
  },

  /**
   * Adds a contains all filter to the collection field. The collection must contain all the given values.
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/all/
   */
  containsAll: function(field, args) {
    return this._addFilter(field, "$all", classOf(args) == Array ? args : Array.prototype.slice.call(arguments, 1));
  },

  /**
   * Adds a modulo filter to the field. The field value divided by divisor must be equal to the remainder.
   * @param {String} field The field to filter
   * @param {Number} divisor The divisor of the modulo filter
   * @param {Number} remainder The remainder of the modulo filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/mod/
   */
  mod: function(field, divisor, remainder) {
    return this._addFilter(field, "$mod", [divisor, remainder]);
  },

  /**
   * Adds a regular expression filter to the field. The field value must matches the regular expression.
   * <p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p>
   * @param {String} field The field to filter
   * @param {String|RegExp} regExp The regular expression of the filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/regex/
   */
  matches: function(field, regExp) {
    if (!RegExp.isInstance(regExp)) {
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
   * @param {String} field The field to filter
   * @param {Number} size The collections size to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/size/
   */
  size: function(field, size) {
    return this._addFilter(field, "$size", size);
  },

  /**
   * Adds a geopoint based near filter to the GeoPoint field. The GeoPoint must be within the maximum distance
   * to the given GeoPoint. Returns from nearest to farthest.
   * @param {String} field The field to filter
   * @param {baqend.GeoPoint} geoPoint The GeoPoint to filter
   * @param {Number} maxDistance Tha maximum distance to filter in meters
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nearSphere/
   */
  near: function(field, geoPoint, maxDistance) {
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
   * @param {String} field The field to filter
   * @param {baqend.GeoPoint|Array<baqend.GeoPoint>} geoPoints... The geoPoints that describes the polygon of the filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/geoWithin/
   */
  withinPolygon: function(field, geoPoints) {
    geoPoints = classOf(geoPoints) == Array ? geoPoints : Array.prototype.slice.call(arguments, 1);

    return this._addFilter(field, "$geoWithin", {
      $geometry: {
        type: "Polygon",
        coordinates: [geoPoints.map(function(geoPoint) {
          return [geoPoint.longitude, geoPoint.latitude];
        })]
      }
    });
  }
});

// aliases
var proto = Query.Condition.prototype;
Object.extend(proto, /** @lends baqend.Query.Condition.prototype */ {
  /**
   * Adds a less than filter to the field. Shorthand for {@link baqend.Query.Condition#lessThan}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lt: proto.lessThan,

  /**
   * Adds a less than or equal to filter to the field. Shorthand for {@link baqend.Query.Condition#lessThanOrEqualTo}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  le: proto.lessThanOrEqualTo,

  /**
   * Adds a greater than filter to the field. Shorthand for {@link baqend.Query.Condition#greaterThan}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  gt: proto.greaterThan,

  /**
   * Adds a greater than or equal to filter to the field. Shorthand for {@link baqend.Query.Condition#greaterThanOrEqualTo}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  ge: proto.greaterThanOrEqualTo,

  /**
   * Adds a contains any filter to the collection field. The collection must contains one the given values.
   * Alias for {@link baqend.Query.Condition#in}
   * @method
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  containsAny: proto.in
});

/**
 * @class baqend.Query.Node
 * @extends baqend.Query
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
Query.Node = Object.inherit(Query, /** @lends baqend.Query.Node.prototype */ {

  /**
   * The offset how many results should be skipped
   * @type Number
   */
  firstResult: 0,

  /**
   * The limit how many objects should be returned
   * @type Number
   */
  maxResults: -1,

  initialize: function(entityManager, resultClass) {
    this.entityManager = entityManager;
    this.resultClass = resultClass;
    this._sort = {};
  },


  /**
   * @inheritDoc
   */
  stream: function(fetchQuery) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    if (fetchQuery === undefined)
      fetchQuery = true;


    var sort = this._serializeSort();

    return new Query.Stream(this.entityManager, type.name, this._serializeQuery(), fetchQuery, sort, this.maxResults);
  },


  /**
   * @inheritDoc
   */
  resultList: function(options, doneCallback, failCallback) {
    if(Function.isInstance(options)) {
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
    var msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, this.firstResult, this.maxResults, sort, query);
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, this.maxResults, sort);
    }

    return this.entityManager._send(msg).then(function() {
      return this._createResultList(msg.response.entity, options);
    }.bind(this)).then(doneCallback, failCallback);
  },

  /**
   * @inheritDoc
   */
  singleResult: function(options, doneCallback, failCallback) {
    if(Function.isInstance(options)) {
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
    var msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, query, this.firstResult, 1, sort, query);
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, 1, sort);
    }

    return this.entityManager._send(msg).then(function() {
      return this._createResultList(msg.response.entity, options);
    }.bind(this)).then(function(list) {
      return list.length ? list[0] : null;
    }).then(doneCallback, failCallback);
  },

  /**
   * @inheritDoc
   */
  count: function(doneCallback, failCallback) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    var query = this._serializeQuery();

    var uriSize = this.entityManager._connector.host.length + query.length;
    var msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocCountQueryPOST(type.name, query);
    } else {
      msg = new message.AdhocCountQuery(type.name, query);
    }

    return this.entityManager._send(msg).then(function() {
      return msg.response.entity.count;
    }).then(doneCallback, failCallback);
  },

  _serializeQuery: function() {
    return JSON.stringify(this, function(k, v) {
      var typedValue = this[k];
      if (Date.isInstance(typedValue)) {
        return {$date: v};
      } else if (Entity.isInstance(typedValue)) {
        return typedValue.id;
      } else {
        return v;
      }
    });
  },

  _serializeSort: function() {
    return JSON.stringify(this._sort);
  },

  _createResultList: function(result, options) {
    if (result.length) {
      return Promise.all(result.map(function(el) {
        if (el.id) {
          var entity = this.entityManager.getReference(this.resultClass, el.id);
          var metadata = Metadata.get(entity);
          metadata.setJson(el);
          metadata.setPersistent();
          return this.entityManager.resolveDepth(entity, options);
        } else {
          return this.entityManager.load(Object.keys(el)[0]);
        }
      }, this)).then(function(result) {
        return result.filter(function(val) {
          return !!val;
        });
      });
    } else {
      return Promise.resolve([]);
    }
  },

  _addOrder: function(fieldOrSort, order) {
    if (order) {
      this._sort[fieldOrSort] = order;
    } else {
      this._sort = fieldOrSort;
    }
    return this;
  },

  _addOffset: function(offset) {
    this.firstResult = offset;
    return this;
  },

  _addLimit: function(limit) {
    this.maxResults = limit;
    return this;
  }
});

/**
 * @class baqend.Query.Builder
 * @extends baqend.Query.Condition
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
Query.Builder = Object.inherit(Query.Condition, /** @lends baqend.Query.Builder.prototype */ {

  initialize: function(entityManager, resultClass) {
    this.entityManager = entityManager;
    this.resultClass = resultClass;
  },

  /**
   * Joins the conditions by an logical AND
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical AND
   */
  and: function(args) {
    return this._addOperator('$and', classOf(args) == Array ? args : Array.prototype.slice.call(arguments));
  },

  /**
   * Joins the conditions by an logical OR
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical OR
   */
  or: function(args) {
    return this._addOperator('$or', classOf(args) == Array ? args : Array.prototype.slice.call(arguments));
  },

  /**
   * Joins the conditions by an logical NOR
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical NOR
   */
  nor: function(args) {
    return this._addOperator('$nor', classOf(args) == Array ? args : Array.prototype.slice.call(arguments));
  },

  /**
   * @inheritDoc
   */
  stream: function(fetchQuery) {
    return this.where({}).stream(fetchQuery);
  },

  /**
   * @inheritDoc
   */
  resultList: function(options, doneCallback, failCallback) {
    return this.where({}).resultList(options, doneCallback, failCallback);
  },

  /**
   * @inheritDoc
   */
  singleResult: function(options, doneCallback, failCallback) {
    return this.where({}).singleResult(options, doneCallback, failCallback);
  },

  /**
   * @inheritDoc
   */
  count: function(doneCallback, failCallback) {
    return this.where({}).count(doneCallback, failCallback);
  },

  _addOperator: function(operator, args) {
    if (args.length < 2) {
      throw new Error('Only two or more queries can be joined with an ' + operator + ' operator.');
    }

    args.forEach(function(arg, index) {
      if (!Query.isInstance(arg)) {
        throw new Error('Argument at index ' + index + ' is not a Query.');
      }
    });

    return new Query.Operator(this.entityManager, this.resultClass, operator, args);
  },

  _addOrder: function(fieldOrSort, order) {
    return new Query.Filter(this.entityManager, this.resultClass)._addOrder(fieldOrSort, order);
  },

  _addFilter: function(field, filter, value) {
    return new Query.Filter(this.entityManager, this.resultClass)._addFilter(field, filter, value);
  },

  _addOffset: function(offset) {
    return new Query.Filter(this.entityManager, this.resultClass)._addOffset(offset);
  },

  _addLimit: function(limit) {
    return new Query.Filter(this.entityManager, this.resultClass)._addLimit(limit);
  }
});

/**
 * @class baqend.Query.Filter
 * @extends baqend.Query.Node
 * @extends baqend.Query.Condition
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
Query.Filter = Query.Node.inherit(Query.Condition, /** @lends baqend.Query.Filter.prototype */ {
  /**
   * The actual filters of this node
   * @type Object
   */
  _filter: null,

  initialize: function(entityManager, resultClass) {
    this.superCall(entityManager, resultClass);
    this._filter = {};
  },

  _addFilter: function(field, filter, value) {
    if (field !== null) {
      if (!String.isInstance(field))
        throw new Error('Field must be a string.');

      if (filter) {
        var fieldFilter = this._filter[field];
        if (classOf(fieldFilter) != Object) {
          this._filter[field] = fieldFilter = {};
        }

        fieldFilter[filter] = value;
      } else {
        this._filter[field] = value;
      }
    } else {
      Object.extend(this._filter, value);
    }

    return this;
  },

  toJSON: function() {
    return this._filter;
  }
});

/**
 * @class baqend.Query.Operator
 * @extends baqend.Query.Node
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 * @param {String} operator The operator used to join the childs
 * @param {Array<baqend.Query.Node>} childs The childs to join
 */
Query.Operator = Query.Node.inherit(/** @lends baqend.Query.Operator.prototype */ {
  /**
   * The operator used to join the child queries
   * @type String
   */
  _operator: null,

  /**
   * The child Node of this query, it is always one
   * @type Array<baqend.Query.Node>
   */
  _childs: null,

  initialize: function(entityManager, resultClass, operator, childs) {
    this.superCall(entityManager, resultClass);
    this._operator = operator;
    this._childs = childs;
  },

  toJSON: function() {
    var json = {};
    json[this._operator] = this._childs;
    return json;
  }
});

/**
 * @class baqend.Query.Stream
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {String} bucket The Bucket on which the streaming query is performed
 * @param {String} query The serialized query
 * @param {Boolean} fetchQuery true if the query result should be fetched
 */
Query.Stream = Object.inherit(/** @lends baqend.Query.Stream.prototype */ {
  initialize: function(entityManager, bucket, query, fetchQuery, sort, limit) {
    this.entityManager = entityManager;
    this.bucket = bucket;
    this.fetchQuery = fetchQuery;
    this.sort = sort;
    this.limit = limit;
    this.query = query;
    this.callbacks = [];
  },

  on: function(matchType, callback) {
    var topic = [this.bucket, this.query, matchType, "any"].join("/");
    var wrappedCallback = this._wrapQueryCallback(callback);
    this.entityManager._subscribe(topic, wrappedCallback);

    var queryMessage = {
      register: true,
      topic: topic,
      query: {
        bucket: this.bucket,
        matchTypes: [matchType],
        operations: ["any"],
        query: this.query
      }
    };

    if (this.fetchQuery) {
      queryMessage.fromstart = true;
      queryMessage.limit = this.limit;
      queryMessage.sort = this.sort;
    }

    this.entityManager._sendOverSocket(queryMessage);

    this.callbacks.push({
      matchType: matchType,
      callback: callback,
      topic: topic,
      wrappedCallback: wrappedCallback,
      queryMessage: queryMessage
    });
  },

  off: function(matchType, callback) {
    this.callbacks = this.callbacks.reduce(function(keep, el) {
      if ((!callback || el.callback == callback) && (!matchType || el.matchType == matchType)) {
        this.entityManager._unsubscribe(el.topic, el.wrappedCallback);
        el.queryMessage.register = false;
        this.entityManager._sendOverSocket(el.queryMessage);
      } else {
        keep.push(el);
      }
      return keep;
    }.bind(this), []);
  },

  once: function(matchType, callback) {
    var wrapped = function(entity, operation, match) {
      this.off(matchType, wrapped);
      callback(entity, operation, match);
    }.bind(this);
    this.on(matchType, wrapped);
  },

  _wrapQueryCallback: function(cb) {
    var receivedResult = false;
    return function(msg) {
      var bucket = msg.query.bucket;
      if (msg.match) {
        //Single Match received
        var operation = msg.match.update.operation;
        //Hollow object for deletes
        var obj = msg.match.update.object ? msg.match.update.object : {id: msg.match.update.id};
        var entity = this._createObject(bucket, operation, obj);
        //Call wrapped callback
        cb({
          type: msg.match.matchtype,
          data: entity,
          operation: operation,
          date: new Date(msg.date),
          target: this,
          initial: false,
          query: this.query
        });
      } else {
        //Initial result received
        if (!receivedResult) {
          msg.result.forEach(function(obj) {
            var operation = 'insert';
            var entity = this._createObject(bucket, operation, obj, obj.id);
            cb({
              type: 'match',
              data: entity,
              operation: operation,
              date: new Date(msg.date),
              target: this,
              initial: true,
              query: this.query
            });
          }, this);
          receivedResult = true;
        }
      }
    }.bind(this);
  },

  _createObject: function(bucket, operation, object) {
    var entity = this.entityManager.getReference(bucket, object.id);
    var metadata = Metadata.get(entity);
    metadata.setJson(object);
    metadata.setPersistent();
    return entity;
  }
});

module.exports = Query;
},{"./binding/Entity":9,"./message":32,"./util/Metadata":54}],6:[function(require,module,exports){
/**
 * @class baqend.binding.Accessor
 */
var Accessor = Object.inherit(/** @lends baqend.binding.Accessor.prototype */ {
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @returns {*}
	 */
	getValue: function(object, attribute) {
		return object[attribute.name];
	},
	 
	/**
	 * @param {Object} object
	 * @param {baqend.metamodel.Attribute} attribute
	 * @param {*} value
	 */
	setValue: function(object, attribute, value) {
		object[attribute.name] = value;
	}
});

module.exports = Accessor;
},{}],7:[function(require,module,exports){
var EntityFactory = require('./EntityFactory');

/**
 * @class baqend.binding.DeviceFactory
 * @extends baqend.binding.EntityFactory
 */
var DeviceFactory = {};
Object.cloneOwnProperties(DeviceFactory, EntityFactory);
Object.defineProperty(DeviceFactory, 'isRegistered', {
  /**
   * Returns true if the devices is already registered, otherwise false.
   * @returns {boolean} Status of the device registration
   */
  get: function() {
    return this._db.isDeviceRegistered;
  }
});

Object.extend(DeviceFactory, /** @lends baqend.binding.DeviceFactory */ {

  /** @lends baqend.binding.DeviceFactory */
  PushMessage: require('../util/PushMessage'),

  /**
   * Register a new device with the given device token and OS.
   * @param {String} os The OS of the device (IOS/Android)
   * @param {String} token The GCM or APNS device token
   * @param {baqend.binding.Entity=} device A optional device entity to set custom field values
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} The registered device object, for the registered device.
   */
  register: function(os, token, device, doneCallback, failCallback) {
    if (Function.isInstance(device)) {
      failCallback = doneCallback;
      doneCallback = device;
      device = null;
    }

    return this._db.registerDevice(os, token, device).then(doneCallback, failCallback);
  },

  /**
   * Uses the info from the given {baqend.util.PushMessage} message to send an push notification.
   * @param {baqend.util.PushMessage} pushMessage to send an push notification.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise}
   */
  push: function(pushMessage, doneCallback, failCallback) {
    return this._db.pushDevice(pushMessage).then(doneCallback, failCallback);
  }
});

module.exports = DeviceFactory;
},{"../util/PushMessage":57,"./EntityFactory":10}],8:[function(require,module,exports){
var Metadata = require('../util/Metadata');
var Lockable = require('../util/Lockable');

/**
 * @class baqend.binding.Enhancer
 */
var Enhancer = Object.inherit(/** @lends baqend.binding.Enhancer.prototype */ {

  /**
   * @param {Class<?>} superClass
   * @returns {Function} typeConstructor
   */
  createProxy: function(superClass) {
    function Proxy(properties) {
      superClass.apply(this, arguments);
    }

    Proxy.prototype = Object.create(superClass.prototype, {
      constructor: {
        value: Proxy,
        enumerable: false,
        configurable: true
      }
    });

    return Proxy;
  },

  /**
   * @param {Function} typeConstructor
   * @returns {String}
   */
  getIdentifier: function(typeConstructor) {
    return typeConstructor.__baqendId__;
  },

  /**
   * @param {Function} typeConstructor
   * @param {String} identifier
   */
  setIdentifier: function(typeConstructor, identifier) {
    typeConstructor.__baqendId__ = identifier;
  },

  /**
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} typeConstructor
   */
  enhance: function(type, typeConstructor) {
    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor, type);
  },

  /**
   * Enhance the prototype of the type
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.ManagedType} type
   */
  enhancePrototype: function(typeConstructor, type) {
    if (typeConstructor.prototype.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      Object.defineProperty(typeConstructor.prototype, 'toString', {
        value: function toString() {
          return this._metadata.id || this._metadata.bucket;
        },
        enumerable: false
      });
    }

    // enhance all persistent object properties
    if (type.superType && type.superType.name == 'Object') {
      for (var i = 0, attr; attr = type.superType.declaredAttributes[i]; ++i) {
        if (!attr.isMetadata)
          this.enhanceProperty(typeConstructor, attr);
      }
    }

    // enhance all persistent properties
    for (var i = 0, attr; attr = type.declaredAttributes[i]; ++i) {
      this.enhanceProperty(typeConstructor, attr);
    }
  },

  /**
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.Attribute} attribute
   */
  enhanceProperty: function(typeConstructor, attribute) {
    var name = '$' + attribute.name;
    Object.defineProperty(typeConstructor.prototype, attribute.name, {
      get: function() {
        Metadata.readAccess(this);
        return this._metadata[name];
      },
      set: function(value) {
        Metadata.writeAccess(this);
        this._metadata[name] = value;
      },
      configurable: true,
      enumerable: true
    });
  }
});

module.exports = Enhancer;



},{"../util/Lockable":52,"../util/Metadata":54}],9:[function(require,module,exports){
var Managed = require('./Managed');
var Lockable = require('../util/Lockable');

/**
 * @class baqend.binding.Entity
 * @extends baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
var Entity = Managed.inherit(/** @lends baqend.binding.Entity.prototype */ {

  extend: {
    extend: Managed.extend
  },

  constructor: function Entity() {
    Managed.apply(this, arguments);
  },

  /**
   * The unique id of this object
   * @type {string}
   */
  get id() {
    return this._metadata.id;
  },

  /**
   * Sets the unique id of this object, if the id is not formatted as an valid id,
   * it will be used as the key component of the id has the same affect as setting the key
   * @type {string}
   */
  set id(value) {
    if (this._metadata.id)
      throw new Error('The id can\'t be set twice: ' + value);

    value = value + '';
    if (value.indexOf('/db/' + this._metadata.bucket + '/') == 0) {
      this._metadata.id = value;
    } else {
      this.key = value;
    }
  },

  /**
   * Get the unique key part of the id
   */
  get key() {
    return this._metadata.key;
  },

  /**
   * Sets the key of the unique id, will throw an error if an id is already set.
   * @param key
   */
  set key(key) {
    this._metadata.key = key;
  },

  /**
   * The version of this object
   * @type {*}
   */
  get version() {
    return this._metadata.version;
  },

  set version(value) {
    this._metadata.version = value;
  },

  /**
   * The object read/write permissions
   * @type baqend.Acl
   */
  get acl() {
    return this._metadata.acl;
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {baqend.util.Lockable~callback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Promise<baqend.binding.Entity>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready: function(doneCallback) {
    return this._metadata.ready(doneCallback);
  },

  /**
   * Attach this object to the given db
   * @param {baqend.EntityManager} db The db which will be used for future crud operations
   */
  attach: function(db) {
    db.attach(this);
  },

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Object} [options] The save options
   * @param {Boolean} [options.force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  save: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.save(this, options).then(doneCallback, failCallback);
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Object} [options] The insertion options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insert: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
  },

  /**
   * Updates an existing object.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Object} [options] The update options
   * @param {Boolean} [options.force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  update: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.update(this, options).then(doneCallback, failCallback);;
  },

  /**
   * Loads the referenced objects
   * Removed objects will be marked as removed.
   * @param {Object} [options] The load options
   * @param {Number|Boolean} [options.depth=1] The object depth which will be loaded. Depth set to <code>true</code>
   * loads objects by reachability.
   * @param {Boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {
        depth: 1
      };
    }

    return this._metadata.db.load(this.id, null , options).then(doneCallback, failCallback);
  },

  /**
   * Delete an existing object.
   * @param {Object} [options] The remove options
   * @param {Boolean} [options.force=false] Force the remove operation, the version will not be validated.
   * @param {Number|Boolean} [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  delete: function(options, doneCallback, failCallback) {
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._metadata.db.delete(this, options).then(doneCallback, failCallback);
  },

  /**
   * Saves the object and repeats the operation if the object is out of date.
   * In each pass the callback will be called. Ths first parameter of the callback is the entity and the second one
   * is a function to abort the process.
   *
   * @param {Function} cb Will be called in each pass
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  optimisticSave: function(cb, doneCallback, failCallback) {
    return this._metadata.db.optimisticSave(this, cb).then(doneCallback, failCallback);
  },

  attr: function() {
    throw new Error("Attr is not yet implemented.");
  },

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @returns {baqend.util.ValidationResult} Contains the result of the Validation
   */
  validate: function() {
    return this._metadata.db.validate(this);
  },

  /**
   * Converts the entity to an JSON-Object.
   * @param {Boolean} excludeMetadata
   * @return {Object} JSON-Object
   */
  toJSON: function(excludeMetadata) {
    return this._metadata.getJson(excludeMetadata, excludeMetadata);
  }
});

module.exports = Entity;

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback baqend.binding.Entity~doneCallback
 * @param {baqend.binding.Entity} entity This entity
 * @return {Promise<*>|*|undefined} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback baqend.binding.Entity~failCallback
 * @param {baqend.error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*|undefined} A Promise, result or undefined
 */


},{"../util/Lockable":52,"./Managed":11}],10:[function(require,module,exports){
var ManagedFactory = require('./ManagedFactory');

/**
 * @class baqend.binding.EntityFactory
 * @extends baqend.binding.ManagedFactory
 */
var EntityFactory = {};
Object.cloneOwnProperties(EntityFactory, ManagedFactory);
Object.extend(EntityFactory, /** @lends baqend.binding.EntityFactory */ {

  /**
   * Loads the instance for the given id, or null if the id does not exists.
   * @param {String} id The id to query
   * @param {Object} [options] The load options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be saved. Depth 0 saves only this object,
   * <code>true</code> saves the objects by reachability.
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load: function(id, options, doneCallback, failCallback) {
    if(Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    return this._db.load(this._managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  },

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param {Object} json
   * @returns {baqend.binding.Entity} instance
   */
  fromJSON: function(json) {
    var instance = json.id? this._db.getReference(this._managedType.typeConstructor, json.id): this.newInstance();
    var metadata = instance._metadata;
    metadata.setJson(json);
    metadata.setDirty();
    return instance;
  },

  /**
   * Creates a new query for this class
   * @return {baqend.Query.Builder} The query builder
   */
  find: function() {
    return this._db.createQueryBuilder(this._managedType.typeConstructor);
  },

  partialUpdate: function() {
    throw new Error("partialUpdate is not yet implemented.");
  }
});

module.exports = EntityFactory;
},{"./ManagedFactory":12}],11:[function(require,module,exports){
var util = require('../util');

/**
 * @class baqend.binding.Managed
 *
 * The default constructor, copy all given properties to this object
 * @param {Object=} properties - The optional properties to copy
 */
var Managed = Object.inherit(/** @lends baqend.binding.Managed.prototype */ {

  extend: {
    /**
     * Creates a subclass of this class
     * @param {Class<*>} childClass
     * @return {Class<*>} The extended child class
     */
    extend: function(childClass) {
      childClass.prototype = Object.create(this.prototype, {
        constructor: {
          value: childClass,
          enumerable: false,
          configurable: true,
          writable: true
        }
      });
      childClass.extend = Managed.extend;
      return childClass;
    }
  },

  constructor: function Managed(properties) {
    if (properties)
      Object.extend(this, properties);
  },

  /**
   * Converts the managed object to an JSON-Object.
   * @return {Object} JSON-Object
   */
  toJSON: function() {
    return this._metadata.type.toJsonValue(this._metadata, this);
  }
});

module.exports = Managed;
},{"../util":62}],12:[function(require,module,exports){
/**
 * @class baqend.binding.ManagedFactory
 */
var ManagedFactory = {};
Object.defineProperty(ManagedFactory, 'methods', {
  /**
   * Methods that are added to object instances
   * This property is an alias for this factories type prototype
   * @type object
   */
  get: function() {
    return this.prototype;
  }
});

Object.extend(ManagedFactory, /** @lends baqend.binding.ManagedFactory */ {
  /**
   * Creates a new ManagedFactory for the given type
   * @param {baqend.metamodel.ManagedType} managedType The metadata of type T
   * @param {baqend.EntityManager} db
   * @return {baqend.binding.ManagedFactory} A new object factory to created instances of T
   */
  create: function(managedType, db) {
    var self = this;
    var factory = function Factory() {
      return factory.newInstance.apply(factory, arguments);
    };

    Object.cloneOwnProperties(factory, self);

    //lets instanceof work properly
    factory.prototype = managedType.typeConstructor.prototype;
    factory._managedType = managedType;
    factory._db = db;

    return factory;
  },

  /**
   * Creates a new instance of the factory type
   * @param {Object<*>} [properties=] A hash of initial properties
   * @param {...*} arguments Constructor arguments used for instantiation
   * @return {baqend.binding.Managed} A new created instance of T
   */
  newInstance: function(properties) {
    var typeInstance = this._managedType.create();
    this.prototype.constructor.apply(typeInstance, arguments);
    typeInstance._metadata.db = this._db;
    return typeInstance;
  },

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param {Object} json
   * @returns {baqend.binding.Managed} instance
   */
  fromJSON: function(json) {
    var instance = this.newInstance();
    var metadata = instance._metadata;
    this._managedType.fromJsonValue(metadata, json, instance);
    return instance;
  },

  /**
   * Adds methods to instances of this factories type
   * @param {object} methods The methods to add
   */
  addMethods: function(methods) {
    Object.extend(this.methods, methods);
  },

  /**
   * Add a method to instances of this factories type
   * @param {string} name The method name to add
   * @param {function} fn The Method to add
   */
  addMethod: function(name, fn) {
    this.methods[name] = fn;
  }
});

module.exports = ManagedFactory;
},{}],13:[function(require,module,exports){
var Entity = require('./Entity');
var User = require('./User');
var Set = require('../collection').Set;

/**
 * @class baqend.binding.Role
 * @extends baqend.binding.Entity
 */
var Role = Entity.inherit(/** @lends baqend.binding.Role.prototype */ {

  extend: {
    extend: Entity.extend
  },

  /**
   * A set of users which have this role
   * @type baqend.Set
   */
  users: null,

  /**
   * The name of the role
   * @type String
   */
  name: null,

  constructor: function Role() {
    Entity.apply(this, arguments);
  },

  /**
   * Test if the given user has this role
   * @return {Boolean} <code>true</code> if the given user has this role,
   * otherwise <code>false</code>
   */
  hasUser: function(user) {
    return this.users && this.users.has(user);
  },

  /**
   * Add the given user to this role
   * @param {baqend.binding.User} user The user to add
   */
  addUser: function(user) {
    if (user instanceof User) {
      if (!this.users)
        this.users = new Set();

      this.users.add(user);
    } else {
      throw new Error('Only user instances can be added to a role.');
    }
  },

  /**
   * Remove the given user from this role
   * @param {baqend.binding.User} user The user to remove
   */
  removeUser: function(user) {
    if (user instanceof User) {
      if (this.users)
        this.users.delete(user);
    } else {
      throw new Error('Only user instances can be removed from a role.');
    }
  }

});

module.exports = Role;



},{"../collection":17,"./Entity":9,"./User":14}],14:[function(require,module,exports){
var Entity = require('./Entity');

/**
 * @class baqend.binding.User
 * @extends baqend.binding.Entity
 */
var User = Entity.inherit(/** @lends baqend.binding.User.prototype */ {

  extend: {
    extend: Entity.extend
  },

  constructor: function User() {
    Entity.apply(this, arguments);
  },

  /**
   * The name of the user
   * @type String
   */
  username: null,

  /**
   * Change the password of the given user
   *
   * @param {String} password Current password of the user
   * @param {String} newPassword New password of the user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  newPassword: function(password, newPassword, doneCallback, failCallback) {
    return this._metadata.db.newPassword(this.username, password, newPassword).then(doneCallback, failCallback);
  }
});

module.exports = User;



},{"./Entity":9}],15:[function(require,module,exports){
var EntityFactory = require('./EntityFactory');

/**
 * @class baqend.binding.UserFactory
 * @extends baqend.binding.EntityFactory
 */
var UserFactory = {};
Object.cloneOwnProperties(UserFactory, EntityFactory);

Object.defineProperty(UserFactory, 'me', {
  /**
   * The current logged in user, or <code>null</code> if the user is not logged in
   * @type baqend.binding.User
   */
  get: function() {
    return this._db.me;
  }
});

Object.extend(UserFactory, /** @lends baqend.binding.UserFactory */ {
  /**
   * @enum {number}
   */
  LoginOption: {
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
  },

  defaultOptions: {
    google: {
      width: 585,
      height: 545,
      scope: 'email'
    },
    facebook:{
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
  },

  /**
   * Register a new user with the given username and password, if the username is not used by an another user.
   * @param {String|baqend.binding.User} user The username as a string or a <baqend.binding.User> Object, which must contain the username.
   * @param {String} password The password for the given user
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default logs the user in after a successful registration and keeps the user logged in over multiple sessions
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>} The created user object, for the new registered user.
   */
  register: function(user, password, loginOption, doneCallback, failCallback) {
    if (Function.isInstance(loginOption)) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    user = String.isInstance(user)? this.fromJSON({username: user}): user;
    return this._db.register(user, password, loginOption === undefined? true: loginOption).then(doneCallback, failCallback);
  },

  /**
   * Log in the user with the given username and password and starts a user session
   * @param {String} username The username of the user
   * @param {String} password The password of the user
   * @param {Boolean|baqend.binding.UserFactory.LoginOption} [loginOption=true] The default keeps the user logged in over multiple sessions
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  login: function(username, password, loginOption, doneCallback, failCallback) {
    if (Function.isInstance(loginOption)) {
      failCallback = doneCallback;
      doneCallback = loginOption;
      loginOption = true;
    }

    return this._db.login(username, password, loginOption === undefined? true: loginOption).then(doneCallback, failCallback);
  },

  /**
   * Log out the current logged in user and ends the active user session
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<null>}
   */
  logout: function(doneCallback, failCallback) {
    return this._db.logout().then(doneCallback, failCallback);
  },

  /**
   * Change the password of the given user
   *
   * @param {String} username Username to identify the user
   * @param {String} password Current password of the user
   * @param {String} newPassword New password of the user
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   */
  newPassword: function(username, password, newPassword, doneCallback, failCallback) {
    return this._db.newPassword(username, password, newPassword).then(doneCallback, failCallback);
  }

  /**
   * Prompts the user for the Google login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: <code>https://example.net/db/User/OAuth/google</code> and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=585] defines the width of the popup window
   * @param {Number} [options.height=545] defines the height of the popup window
   * @param {String} [options.scope="email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithGoogle
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the Facebook login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/facebook and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=1140] defines the width of the popup window
   * @param {Number} [options.height=640] defines the height of the popup window
   * @param {String} [options.scope="email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithFacebook
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the GitHub login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/github and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=1040] defines the width of the popup window
   * @param {Number} [options.height=580] defines the height of the popup window
   * @param {String} [options.scope="user:email"] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithGitHub
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the Twitter login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/twitter and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=740] defines the width of the popup window
   * @param {Number} [options.height=730] defines the height of the popup window
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithTwitter
   * @memberOf baqend.binding.UserFactory.prototype
   */

  /**
   * Prompts the user for the LinkedIn login in a new window. Before using OAuth you need to setup your application
   * on the provider website, add the redirect uri: https://example.net/db/User/OAuth/linkedin and copy the client id
   * and the client secret to your Baqend dashboard settings. When the returned promise succeeds the user is logged in.
   *
   * @param {String} clientID
   * @param {Object=} options
   * @param {String} [options.title="Login"] sets the title of the popup window
   * @param {Number} [options.width=630] defines the width of the popup window
   * @param {Number} [options.height=530] defines the height of the popup window
   * @param {String} [options.scope=""] the range of rights requested from the user
   * @param {Object} [options.state={}]
   * @param {Number} [options.timeout=5 * 60 * 1000]
   * @param {baqend.binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {baqend.binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.User>}
   *
   * @function
   * @name loginWithLinkedIn
   * @memberOf baqend.binding.UserFactory.prototype
   */
});

["Google", "Facebook", "GitHub", "Twitter", "LinkedIn"].forEach(function(name) {
  UserFactory["loginWith" + name] = function(clientID, options, doneCallback, failCallback) {
    //noinspection JSPotentiallyInvalidUsageOfThis
    if (Function.isInstance(options)) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    options = Object.extend(Object.extend({}, UserFactory.defaultOptions[name.toLowerCase()]), options || {});

    return this._db.loginWithOAuth(name, clientID, options).then(doneCallback, failCallback);
  }
});

module.exports = UserFactory;

},{"./EntityFactory":10}],16:[function(require,module,exports){
/**
 * @namespace baqend.binding
 */

exports.Accessor = require('./Accessor');
exports.Enhancer = require('./Enhancer');
exports.ManagedFactory = require('./ManagedFactory');
exports.EntityFactory = require('./EntityFactory');
exports.UserFactory = require('./UserFactory');
exports.DeviceFactory = require('./DeviceFactory');
exports.Managed = require('./Managed');
exports.Entity = require('./Entity');
exports.Role = require('./Role');
exports.User = require('./User');
},{"./Accessor":6,"./DeviceFactory":7,"./Enhancer":8,"./Entity":9,"./EntityFactory":10,"./Managed":11,"./ManagedFactory":12,"./Role":13,"./User":14,"./UserFactory":15}],17:[function(require,module,exports){
/**
 * @namespace baqend.collection
 */

var Metadata = require('./util/Metadata');
var Iterator, IndexIterator, PropertyIterator, Iterable, Collection, List, Set, Map;
var ITERATOR = '@@iterator';

/**
 * @typedef {Object} baqend.collection.Iterator.Item
 * @property {Boolean} done Indicates if the iterator has no more elements
 * @property {*} value Tha actual iterated element
 */

/**
 * @class baqend.collection.Iterator
 */
exports.Iterator = Iterator = Trait.inherit( /** @lends baqend.collection.Iterator.prototype */ {
  /** @lends baqend.collection.Iterator */
  extend: {
    /**
     * @type baqend.collection.Iterator.Item
     */
    DONE: {done: true}
  },

  constructor: function Iterator(obj) {
    if (obj) {
      if (obj[ITERATOR] && Function.isInstance(obj[ITERATOR])) {
        return obj[ITERATOR]();
      } else if (Array.isInstance(obj)) {
        return new IndexIterator(obj.length, function(index) {
          return obj[index];
        });
      } else {
        return new PropertyIterator(obj);
      }
    }
  },

  /**
   * Gets the next item
   * @return {Object} item The next iterating item
   * @return {Boolean} item.done <code>true</code> if there are no more elements to iterate
   * @return {*} item.value The current iterating value
   */
  next: function() {
    return Iterator.DONE;
  }
});

/**
 * @class baqend.collection.IndexIterator
 * @extends baqend.collection.Iterator
 */
exports.IndexIterator = IndexIterator = Object.inherit(Iterator, /** @lends baqend.collection.IndexIterator.prototype */ {
  length: 0,
  index: 0,

  constructor: function collection(length, accessor) {
    this.length = length;

    if (accessor)
      this.accessor = accessor;
  },

  /**
   * Returns the element for an index
   * @param {Number} index
   */
  accessor: function(index) {
    return index;
  },

  /**
   * @inheritDoc
   */
  next: function() {
    if (this.index < this.length) {
      var result = { done: false, value: this.accessor(this.index) };
      this.index++;
      return result;
    } else {
      return Iterator.DONE;
    }
  }
});

/**
 * @class baqend.collection.PropertyIterator
 * @extends baqend.collection.Iterator
 */
exports.PropertyIterator = PropertyIterator = Iterator.inherit(/** baqend.collection.PropertyIterator.prototype */ {
  index: 0,

  constructor: function PropertyIterator(object) {
    this.object = object;
    this.names = Object.getOwnPropertyNames(object);
  },

  next: function() {
    if (this.names.length < this.index) {
      var name = this.names[this.index++];
      return {done: false, value: [name, this.object[name]]};
    } else {
      return Iterator.DONE;
    }
  }
});

/**
 * @class baqend.collection.Iterable
 */
exports.Iterable = Iterable = Trait.inherit( /** @lends baqend.collection.Iterable.prototype */ {
  /**
   * Returns an iterator over the entries of this collection
   * @return {Iterator<Array<*>>} An iterator where each entry is a key - value pair
   */
  entries: function() {
    return null;
  },

  /**
   * Executes a provided function once per array element.
   * @param {Function} callback Function to execute for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   */
  forEach: function(callback, thisArg) {
    if (!callback || !Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
      callback.call(thisArg, item.value[1], item.value[0], this);
    }
  },

  /**
   * Tests whether all elements in the array pass the test implemented by the provided function.
   * @param {Function} callback Function to test for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {boolean} true if all elements in the array pass the test
   */
  every: function(callback, thisArg) {
    if (!callback || !Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
      if (!callback.call(thisArg, item.value[1], item.value[0], this))
        return false;
    }

    return true;
  },

  /**
   * Tests whether some element in the array passes the test implemented by the provided function.
   * @param {Function} callback Function to test for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {boolean} true if some element in the array passes the test
   */
  some: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
      if (callback.call(thisArg, item.value[1], item.value[0], this))
        return true;
    }

    return false;
  },

  /**
   * Creates a new instance of this object with all elements that pass the test implemented by the provided function.
   * @param {Function} callback Function to test each element of the array.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {*} A new instance of this object with all elements that pass the test
   */
  filter: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var result = new this.constructor();
    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
      if (callback.call(thisArg, item.value[1], item.value[0], this)) {
        if (result.set) {
          result.set(item.value[0], item.value[1]);
        } else {
          result.add(item.value[1]);
        }
      }
    }

    return result;
  },

  /**
   * Creates a new instance of this object with the results of calling a provided function on every element in this array.
   * @param {Function} callback Function that produces an element of the new object
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {*} A new instance of this object with the results
   */
  map: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var result = new this.constructor();
    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
      var value = callback.call(thisArg, item.value[1], item.value[0], this);
      if (result.set) {
        result.set(item.value[0], value);
      } else {
        result.add(value);
      }
    }

    return result;
  },

  /**
   * Applies a function against an accumulator and each element
   * (from left-to-right) has to reduce it to a single value.
   * @param {Function} callback Function to execute on each element
   * @param {*} previousValue Object to use as the first argument to the first call of the callback.
   * @returns {*}
   */
  reduce: function(callback, previousValue) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var iter = this.entries();
    if (arguments.length == 1) {
      previousValue = iter.next().value;
    }

    var item;
    while (!(item = iter.next()).done) {
      previousValue = callback.call(null, previousValue, item.value[1], item.value[0], this);
    }

    return previousValue;
  }
});

/**
 * @class baqend.collection.Collection
 * @extends baqend.collection.Iterable
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.Collection = Collection = Object.inherit(Iterable, /** @lends baqend.collection.Collection.prototype */ {

  /**
   * The collection backed array
   * @type Array.<*>
   */
  array: null,

  get size() {
    return this.array.length;
  },

  constructor: function Collection(iterable) {
    this.array = [];

    var iter = Iterator(iterable);
    if (iter) {
      var item;
      while(!(item = iter.next()).done) {
        this.add(item.value);
      }
    }
  },

  /**
   * Indicates if this collection contains the element
   * @param element The element to test
   * @returns {boolean} true if the collection contains the element
   */
  has: function(element) {
    return this.array.indexOf(element) != -1;
  },

  /**
   * Clears the collection by removing all elements
   */
  clear: function() {
    Metadata.writeAccess(this);
    this.array = [];
  },

  /**
   * Add a alement to the collection
   * @param element The element to add
   */
  add: function(element) {
    Metadata.writeAccess(this);
    this.array.push(element);
  },

  /**
   * Removes teh element form the collection
   * @param element The element to remove
   */
  'delete': function(element) {
    Metadata.writeAccess(this);
    var index = this.array.indexOf(element);
    if (index > -1) {
      this.array.splice(index, 1);
    }
  },

  /**
   * Gets an iterator over the entries of the collection
   * @returns {baqend.collection.Iterator.<Array<*>>} An iterator over the entries of the collection
   */
  entries: function() {
    var array = this.array;
    return new IndexIterator(this.size, function(index) {
      return [index, array[index]];
    });
  },

  /**
   * Gets an iterator over the keys of the collection
   * @returns {baqend.collection.Iterator.<Number>} An iterator over the keys of the collection
   */
  keys: function() {
    return new IndexIterator(this.size);
  },

  /**
   * Gets an iterator over the values of the collection
   * @returns {baqend.collection.Iterator.<*>} An iterator over the values of the collection
   */
  values: function() {
    var array = this.array;
    return new IndexIterator(this.size, function(index) {
      return array[index];
    });
  },

  toString: function() {
    return this.array.toString();
  },

  toJSON: function() {
    return this.array;
  }
});

var Arr = Array.prototype;

/**
 * Creates a new List instance
 * @class baqend.collection.List
 * @extends baqend.collection.Collection
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.List = List = Collection.inherit(/** @lends baqend.collection.List.prototype */ {

  constructor: function List(iterable) {
    Collection.call(this, iterable);
  },

  /**
   * Get the value by index
   * @param index The index
   * @returns {*} The value of the index
   */
  get: function(index) {
    if (index < 0) {
      index = this.size + index;
    }

    if (index >= 0 && index < this.size) {
      return this.array[index];
    }
  },

  /**
   * @inheritDoc
   */
  add: function(element) {
    Metadata.writeAccess(this);
    this.array.push(element);
  },

  /**
   * Sets the value at index
   * @param index The index
   * @param value The new value
   */
  set: function(index, value) {
    Metadata.writeAccess(this);
    if (index < 0) {
      index = this.size + index;
    }

    if (index < 0) {
      this.array.unshift(value);
    } else if (index >= this.size) {
      this.array.push(value);
    } else {
      this.array[index] = value;
    }
  },

  concat: function() {
    var args = Arr.map.call(arguments, function(arg) {
      if (List.isInstance(arg)) {
        return arg.array;
      } else {
        return arg;
      }
    });

    return new List(Arr.concat.apply(this.array, args));
  },

  /**
   * Gets the index of an value
   * @param value The value to search
   * @returns {*} The index of the value, or -1 if the value was not found
   */
  indexOf: function(value) {
    return this.seq.indexOf(value);
  },

  /**
   * Gets the last index of the value
   * @param value The value to search
   * @returns {*} The last index of the value, or -1 if teh value was not found
   */
  lastIndexOf: function(value) {
    return this.seq.lastIndexOf(value);
  },

  join: function(seperator) {
    return this.array.join(seperator);
  },

  pop: function() {
    Metadata.writeAccess(this);
    return this.array.pop();
  },

  push: function() {
    Metadata.writeAccess(this);
    return Arr.push.apply(this.array, arguments);
  },

  reverse: function() {
    Metadata.writeAccess(this);
    this.array.reverse();
  },

  shift: function() {
    Metadata.writeAccess(this);
    return this.array.shift();
  },

  slice: function(begin, end) {
    return new List(this.array.slice(begin, end));
  },

  sort: function(compareFunction) {
    Metadata.writeAccess(this);
    this.array.sort(compareFunction);
  },

  splice: function() {
    Metadata.writeAccess(this);
    return Arr.splice.apply(this.array, arguments);
  },

  unshift: function() {
    Metadata.writeAccess(this);
    return Arr.unshift.apply(this.array, arguments);
  }
});

List.prototype[ITERATOR] = List.prototype.values;

/**
 * @class baqend.collection.Set
 * @extends baqend.collection.Collection
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.Set = Set = Collection.inherit(/** @lends baqend.collection.Set.prototype */ {

  constructor: function Set(iterable) {
    Collection.call(this, iterable);
  },

  /**
   * Adds the element ot the collection, if the collection doesn't contain the element
   * @param value The value to add
   */
  add: function(value) {
    var index = this.array.indexOf(value);
    if (index < 0) {
      this.array.push(value);
      Metadata.writeAccess(this);
    }
  },

  /**
   * @inheritDoc
   */
  entries: function() {
    var array = this.array;
    return new IndexIterator(this.size, function(index) {
      return [array[index], array[index]];
    });
  }
});

Set.prototype.keys = Set.prototype.values;
Set.prototype[ITERATOR] = Set.prototype.values;

/**
 * @class baqend.collection.Map
 * @extends baqend.collection.Collection
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.Map = Map = Collection.inherit(/** @lends baqend.collection.Map.prototype */ {
  //dates can't be compared with the == nor they can be looked up with indexOf, therefore we cache
  //the actual date instances used as keys to ensure that we always use the same date identity as key
  _dateCache: null,

  constructor: function Map(iterable) {
    this.array = [];
    this.vals = [];

    this._dateCache = {};

    var iter = Iterator(iterable);
    if (iter) {
      var item;
      while (!(item = iter.next()).done) {
        if (!Array.isInstance(item.value) || item.value.length != 2) {
          throw new Error('No key value pair in entry ' + item.value);
        }

        this.set(item.value[0], item.value[1]);
      }
    }
  },

  /**
   * @inheritDoc
   */
  clear: function() {
    Metadata.writeAccess(this);
    this.array = [];
    this.vals = [];
    this._dateCache = {};
  },

  /**
   * Indicates if this collection contains the element
   * @param key The element to test
   * @returns {boolean} true if the collection contains the element
   */
  has: function(key) {
    if (key instanceof Date)
      key = this._dateCache[key.getTime()] || key;

    return this.array.indexOf(key) != -1;
  },

  /**
   * Gets the associated value of the key
   * @param key The key
   * @returns {*} The associated value
   */
  get: function(key) {
    if (key instanceof Date)
      key = this._dateCache[key.getTime()] || key;

    var index = this.array.indexOf(key);
    if (index > -1) {
      return this.vals[index];
    }
  },

  /**
   * Adds the given key, without an value
   * @param key The key to add
   */
  add: function(key) {
    Metadata.writeAccess(this);
    this.set(key, key);
  },

  /**
   * Sets the value of an key
   * @param key The key
   * @param value The new value
   */
  set: function(key, value) {
    Metadata.writeAccess(this);

    if (key instanceof Date) {
      var time = key.getTime();
      key = this._dateCache[time] || key;
      this._dateCache[time] = key;
    }

    var index = this.array.indexOf(key);
    if (index == -1) {
      index = this.array.length;
      this.array[index] = key;
    }

    this.vals[index] = value;
  },

  /**
   * Removes the key and the associated value
   * @param key The key to remove
   */
  'delete': function(key) {
    Metadata.writeAccess(this);

    if (key instanceof Date) {
      var time = key.getTime();
      key = this._dateCache[time] || key;
      delete this._dateCache[time];
    }

    var index = this.array.indexOf(key);
    if (index > -1) {
      this.array.splice(index, 1);
      this.vals.splice(index, 1);
    }
  },

  /**
   * Gets an iterator over the entries of the map
   * @returns {baqend.collection.Iterator.<Array<*>>} An iterator over the key value pairs of the map
   */
  entries: function() {
    var keys = this.array;
    var vals = this.vals;
    return new IndexIterator(this.size, function(index) {
      return [keys[index], vals[index]];
    });
  },

  /**
   * Gets a iterator over the keys
   * @returns {baqend.collection.Iterator.<*>} A key iterator
   */
  keys: function() {
    var keys = this.array;
    return new IndexIterator(this.size, function(index) {
      return keys[index];
    });
  },

  /**
   * Gets a iterator over the values
   * @returns {baqend.collection.Iterator.<*>} A value iterator
   */
  values: function() {
    var vals = this.vals;
    return new IndexIterator(this.size, function(index) {
      return vals[index];
    });
  },

  toString: function() {
    var str = '';
    for (var i = 0, len = this.size; i < len; ++i) {
      if (str != '')
        str += ', ';

      str += this.array[i];
      str += ' => ';
      str += this.vals[i];
    }
    return '{' + str + '}';
  },

  toJSON: function() {
    var map = [];
    for (var i = 0, len = this.size; i < len; ++i) {
      map.push({
        key: this.array[i],
        value: this.vals[i]
      });
    }
    return map;
  }
});

Map.prototype[ITERATOR] = Map.prototype.entries;

},{"./util/Metadata":54}],18:[function(require,module,exports){
var PersistentError = require('../error/PersistentError');


/**
 * @class baqend.connector.Connector
 *
 * @param {String} host
 * @param {number} port
 * @param {boolean} secure
 */
var Connector = Object.inherit(/** @lends baqend.connector.Connector.prototype */{
  /** @lends baqend.connector.Connector */
  extend: {
    DEFAULT_BASE_PATH: '/v1',
    HTTP_DOMAIN: '.app.baqend.com',
    SSL_DOMAIN: '-bq.global.ssl.fastly.net',

    /**
     * An array of all exposed response headers
     * @type String[]
     */
    RESPONSE_HEADERS: [
      'Baqend-Authorization-Token',
      'Content-Type'
    ],

    /**
     * Array of all available connector implementations
     * @type baqend.connector.Connector[]
     */
    connectors: [],

    /**
     * Array of all created connections
     * @type Object<string,baqend.connector.Connector>
     */
    connections: {},

    /**
     * The connector will detect if gzip is supports.
     * Returns true if supported otherwise false.
     * @returns {boolean} gzip
     */
    gzip: false,

    /**
     * @param {String} host or location
     * @param {number=} port
     * @param {boolean=} secure <code>true</code> for an secure connection
     * @param {String} [basePath=] The basepath of the api
     * @return {baqend.connector.Connector}
     */
    create: function(host, port, secure, basePath) {
      if (!host && typeof window !== 'undefined') {
        host = window.location.hostname;
        port = Number(window.location.port);
        secure = window.location.protocol == 'https:';
      }

      if (basePath === undefined)
        basePath = Connector.DEFAULT_BASE_PATH;

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
        host += secure? Connector.SSL_DOMAIN: Connector.HTTP_DOMAIN;
      }

      if (!port)
        port = secure? 443 : 80;

      var url = Connector.toUri(host, port, secure, basePath);
      var connection = this.connections[url];

      if (!connection) {
        for (var name in this.connectors) {
          var connector = this.connectors[name];
          if (connector.isUsable && connector.isUsable(host, port, secure, basePath)) {
            connection = new connector(host, port, secure, basePath);
            break;
          }
        }

        if (!connection)
          throw new Error('No connector is usable for the requested connection.');

        this.connections[url] = connection;
      }

      return connection;
    },

    toUri: function(host, port, secure, basePath) {
      var uri = (secure ? 'https://' : 'http://') + (host.indexOf(':') != -1? '[' + host + ']': host);
      uri += (secure && port != 443 || !secure && port != 80) ? ':' + port : '';
      uri += basePath;
      return uri;
    }
  },

  constructor: function Connector(host, port, secure, basePath) {
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.basePath = basePath;
    this.socket = null;
    this.listeners = {};

    //the origin do not contains the basepath
    this.origin = Connector.toUri(host, port, secure, "");
  },

  /**
   * @param {baqend.connector.Message} message
   * @returns {Promise<baqend.connector.Message>}
   */
  send: function(message) {
    if (message.request.method == 'OAUTH') {
      message.addRedirectOrigin(this.origin + this.basePath);
    }

    return new Promise(function(resolve, reject) {
      this.prepareRequestEntity(message);
      this.doSend(message, message.request, this.receive.bind(this, message, resolve, reject));
    }.bind(this)).catch(function(e) {
      throw PersistentError.of(e);
    });
  },

  /**
   * @param {baqend.connector.Message} message
   * @param {Function} resolve
   * @param {Function} reject
   * @param {Object} response
   */
  receive: function(message, resolve, reject, response) {
    message.response = response;
    try {
      // IE9 returns status code 1223 instead of 204
      message.response.status = message.response.status == 1223 ? 204 : message.response.status;

      this.prepareResponseEntity(message);
      message.doReceive();
      resolve(message);
    } catch (e) {
      e = PersistentError.of(e);
      message.response.entity = null;
      reject(e);
    }
  },

  /**
   * Handle the actual message send
   * @param {baqend.connector.Message} message
   * @param {baqend.connector.Message.request} request
   * @param {Function} receive
   * @abstract
   */
  doSend: function(message, request, receive) {
  },

  /**
   * Registers a handler for a topic.
   * @param {String|Object} topic
   * @param {Function} cb
   */
  subscribe: function(topic, cb) {
    topic = String.isInstance(topic) ? topic : JSON.stringify(topic);
    if (!this.listeners[topic]) {
      this.listeners[topic] = [cb]
    } else if (this.listeners[topic].indexOf(cb) == -1) {
      this.listeners[topic].push(cb);
    }
  },

  /**
   * Deregisters a handler.
   * @param {String|Object}  topic
   * @param {Function} cb
   */
  unsubscribe: function(topic, cb) {
    topic = String.isInstance(topic) ? topic : JSON.stringify(topic);
    if (this.listeners[topic]) {
      var index = this.listeners[topic].indexOf(cb);
      if (index != -1) {
        this.listeners[topic].splice(index, 1);
      }
    }
  },

  socketListener: function(event) {
    var message = JSON.parse(event.data);
    var topic = message.topic;
    topic = String.isInstance(topic) ? topic : JSON.stringify(topic);
    if(this.listeners[topic]) {
      this.listeners[topic].forEach(function(listener) {
        listener(message);
      });
    }
  },

  socketOpen: null,

  /**
   * Sends a websocket message over a lazily initialized websocket connection.
   * @param {Object} message
   * @param {String} message.topic
   * @param {String} message.token
   */
  sendOverSocket: function(message) {
    //Lazy socket initialization
    if (this.socket === null) {
      this.socket = this.createWebSocket((this.secure ? 'wss://' : 'ws://') + this.host + ':' + this.port + this.basePath + '/events');
      this.socket.onmessage = this.socketListener.bind(this);

      //Resolve Promise on connect
      this.socketOpen = new Promise(function(resolve, reject) {
        this.socket.onopen = resolve;
        this.socket.onerror = reject;
      }.bind(this));

      //Reset socket on close
      this.socket.onclose = function() {
        this.socket = null;
        this.socketOpen = null;
      }.bind(this);
    }

    var jsonMessage = JSON.stringify(message);
    this.socketOpen.then(function() {
      this.socket.send(jsonMessage);
    }.bind(this));
  },

  /**
   * Creates a new web socket connection for the given destination
   * @param {String} destination The destination to connect to
   * @return {WebSocket} a new WebSocket instance
   * @abstract
   */
  createWebSocket: function(destination) {},

  /**
   * @param {baqend.connector.Message} message
   */
  prepareRequestEntity: function(message) {
    if (message.request.entity) {
      if (String.isInstance(message.request.entity)) {
        message.request.headers['Content-Type'] = 'text/plain;charset=utf-8';
      } else {
        message.request.headers['Content-Type'] = 'application/json;charset=utf-8';
        message.request.entity = JSON.stringify(message.request.entity);
      }
    }

    if (this.gzip) {
      if(message.request.headers['If-None-Match'] && message.request.headers['If-None-Match'] != '*') {
        message.request.headers['If-None-Match'] = message.request.headers['If-None-Match'].slice(0,-1) + '--gzip"'
      }
    }

    if (message.tokenStorage) {
      var token = message.tokenStorage.get(this.origin);
      if (token)
        message.request.headers['Authorization'] = 'BAT ' + token;
    }
  },

  /**
   * @param {baqend.connector.Message} message
   * @param {Object} data
   */
  prepareResponseEntity: function(message) {
    var entity = message.response.entity;
    if (entity && entity.length > 0) {
      var contentType = message.response.headers['Content-Type'] || message.response.headers['content-type'];
      if (contentType && contentType.indexOf("application/json") > -1) {
        entity = JSON.parse(entity);
      }

      if (message.request.path.indexOf('/connect') > -1) {
        this.gzip = !!entity.gzip;
      }
    } else {
      entity = null;
    }

    message.response.entity = entity;

    if (message.tokenStorage) {
      var headers = message.response.headers || {};
      var token = headers['Baqend-Authorization-Token'] || headers['baqend-authorization-token'];
      if (token) {
        message.tokenStorage.update(this.origin, token);
      }
    }
  }
});

module.exports = Connector;
},{"../error/PersistentError":28}],19:[function(require,module,exports){
var Connector = require('./Connector');

/**
 * @class baqend.connector.IFrameConnector
 * @extends baqend.connector.Connector
 */
var IFrameConnector = Connector.inherit(/** @lends baqend.connector.IFrameConnector.prototype */ {
  /** @lends baqend.connector.IFrameConnector */
  extend: {
    loadedAttr: 'data-loaded',
    style: 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;',

    initialize: function() {
      Connector.connectors.push(this);
    },

    /**
     * Indicates if this connector implementation is usable for the given host and port
     * @param {String} host
     * @param {number} port
     * @param {boolean} secure
     * @returns {boolean}
     */
    isUsable: function(host, port, secure) {
      return typeof window != 'undefined' &&
          (window.location.hostname != host || window.location.port != port);
    }
  },

  queue: null,
  iframe: null,
  messages: null,
  mid: 0,

  constructor: function IFrameConnector(host, port, secure, basePath) {
    Connector.call(this, host, port, secure, basePath);

    this.messages = {};
    this.doReceive = this.doReceive.bind(this);

    addEventListener('message', this.doReceive, false);
  },

  load: function(tokenStorage) {
    var path = this.basePath + '/connect';
    var src = this.origin + path;

    var token = tokenStorage? tokenStorage.createResourceToken(this.origin, path): '';
    this.iframe = document.createElement('iframe');
    this.iframe.src = src + (token? '?BAT=' + token: '');
    this.iframe.setAttribute("style", IFrameConnector.style);
    document.body.appendChild(this.iframe);

    this.queue = [];
    this.iframe.addEventListener('load', this.onLoad.bind(this), false);
  },

  onLoad: function() {
    var queue = this.queue;

    for (var i = 0; i < queue.length; ++i) {
      this.postMessage(queue[i]);
    }

    this.queue = null;
  },

  /**
   * @inheritDoc
   */
  doSend: function(message, request, receive) {
    if (!this.iframe) {
      this.load(message.tokenStorage);
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
      setTimeout(function() {
        if (this.messages[msg.mid]) {
          delete this.messages[msg.mid];
          receive({
            status: 0,
            error: new Error('Connection refused.')
          });
        }
      }.bind(this), 10000);
    }
  },

  postMessage: function(msg) {
    this.iframe.contentWindow.postMessage(msg, this.origin);
  },

  /**
   * @inheritDoc
   */
  createWebSocket: function(destination) {
    return new WebSocket(destination);
  },

  doReceive: function(event) {
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
  }
});

module.exports = IFrameConnector;
},{"./Connector":18}],20:[function(require,module,exports){
var CommunicationError = require('../error/CommunicationError');

/**
 * @class baqend.connector.Message
 *
 * @param {String} arguments... The path arguments
 */
var Message = Object.inherit(/** @lends baqend.connector.Message.prototype */ {

  /** @lends baqend.connector.Message */
  extend: {
    /**
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

    /**
     * Creates a new message class with the given message specification
     * @param {object} spec
     * @return {Function}
     */
    create: function(spec) {
      var parts = spec.path.split('?');
      var path = parts[0].split(/:\w*/);
      var query = [];
      if (parts[1]) {
        parts[1].split('&').forEach(function(arg) {
          var part = arg.split('=');
          query.push(part[0]);
        });
      }

      spec.path = path;
      spec.query = query;

      return Message.inherit({
        spec: spec
      });
    },

    /**
     * Creates a new message class with the given message specification and a full path
     * @param {object} spec
     * @return {Function}
     */
    createExternal: function(spec, query) {
      spec.path = [spec.path];

      return Message.inherit({
        spec: spec
      });
    }
  },

  /**
   * Message specification
   * @type object
   */
  spec: null,

  /**
   * @type baqend.util.TokenStorage
   */
  tokenStorage: null,

  /**
   * @type boolean
   */
  withCredentials: false,

  initialize: function() {
    var args = arguments;
    var index = 0;
    var path = this.spec.path;
    if (!String.isInstance(path)) {
      path = this.spec.path[0];
      for (var i = 1; i < this.spec.path.length; ++i) {
        path += encodeURIComponent(args[index++]) + this.spec.path[i];
      }
    }

    var query = "";
    for (var i = 0; i < this.spec.query.length; ++i) {
      var arg = args[index++];
      if (arg !== undefined && arg !== null) {
        query += (query || ~path.indexOf("?"))? "&": "?";
        query += this.spec.query[i] + '=' + encodeURIComponent(arg);
      }
    }

    this.request = {
      method: this.spec.method,
      path: path + query,
      headers: {
        'accept': 'application/json, text/*;q=0.1'
      },
      entity: args[index] || null
    };

    this.response = {
      status: 0,
      headers: {},
      entity: null
    };
  },

  setIfMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-Match'] = value;
  },

  setIfNoneMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-None-Match'] = value;
  },

  setCacheControl: function(value) {
    this.request.headers['Cache-Control'] = value;
  },

  /**
   * Adds the given String to the request path.
   * If the parameter is an object the query string will be created.
   *
   * @param {String|Object} query which will added to the request path
   */
  addQueryString: function(query) {
    if(String.isInstance(query)) {
      this.request.path += query;
    } else if(query) {
      var sep = ~this.request.path.indexOf("?")? "&": "?";
      Object.keys(query).forEach(function(key, i) {
        this.request.path += sep + key + "=" + encodeURIComponent(query[key]);
        if(i == 0) {
          sep = "&";
        }
      }.bind(this));
    }
  },

  /**
   * Handle the receive
   */
  doReceive: function() {
    if (this.spec.status.indexOf(this.response.status) == -1) {
      throw new CommunicationError(this);
    }
  }
});

Message.GoogleOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=online',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.GoogleOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/google'
  });
};

Message.FacebookOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://www.facebook.com/dialog/oauth?response_type=code',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.FacebookOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/facebook'
  });
};

Message.GitHubOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://github.com/login/oauth/authorize?response_type=code&access_type=online',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.GitHubOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/github'
  });
};

Message.LinkedInOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code&access_type=online',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.LinkedInOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/linkedin'
  });
};

Message.TwitterOAuth = Message.createExternal({
  method: 'OAUTH',
  path: '',
  query: [],
  status: [200]
});

Message.TwitterOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.request.path = baseUri + '/db/User/OAuth1/twitter';
};

module.exports = Message;
},{"../error/CommunicationError":24}],21:[function(require,module,exports){
var Connector = require('./Connector');

/**
 * @class baqend.connector.NodeConnector
 * @extends baqend.connector.Connector
 */
var NodeConnector = Connector.inherit(/** @lends baqend.connector.NodeConnector.prototype */ {
  /** @lends baqend.connector.NodeConnector */
  extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

    isUsable: function(host, port, secure) {
      if (!this.prototype.http) {
        try {
          var http;
          if (secure) {
            http = require('https');
          } else {
            http = require('http');
          }

          if (http.request && http.Server) {
            this.prototype.http = http;
          }
        } catch (e) {
        }
      }
      return Boolean(this.prototype.http);
    }
  },

  constructor: function NodeConnector() {
    Connector.apply(this, arguments);
  },

  cookie: null,

  /**
   * @inheritDoc
   */
  doSend: function(message, request, receive) {
    request.host = this.host;
    request.port = this.port;
    request.path = this.basePath + request.path;

    var self = this;
    var entity = request.entity;

    if (this.cookie && message.withCredentials)
      request.headers['Cookie'] = this.cookie;

    var req = this.http.request(request, function(res) {
      var data = '';

      res.setEncoding('utf-8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        var cookie = res.headers['set-cookie'];
        if (cookie) {
          // cookie may be an array, convert it to a string
          self.cookie = self.parseCookie(cookie + '');
        }

        receive({
          status: res.statusCode,
          headers: res.headers,
          entity: data
        });
      });
    });

    req.on('error', function(e) {
      receive({
        status: 0,
        error: e
      });
    });

    if (entity)
      req.end(entity, 'utf8');
    else
      req.end();
  },

  /**
   * @inheritDoc
   */
  createWebSocket : function(destination) {
    var WebSocket = require('websocket').w3cwebsocket;
    return new WebSocket(destination);
  },

  /**
   * Parse the cookie header
   * @param {String} header
   */
  parseCookie: function(header) {
    var parts = header.split(';');

    for (var i = 0, part; part = parts[i]; ++i) {
      if (part.indexOf('Expires=') == 0) {
        var date = Date.parse(part.substring(8));
        if (date < Date.now()) {
          return null;
        }
      }
    }

    return parts[0];
  }
});

module.exports = NodeConnector;
},{"./Connector":18,"http":undefined,"https":undefined,"websocket":72}],22:[function(require,module,exports){
var Connector = require('./Connector');

/**
 * @class baqend.connector.XMLHttpConnector
 * @extends baqend.connector.Connector
 */
var XMLHttpConnector = Connector.inherit(/** @lends baqend.connector.XMLHttpConnector.prototype */ {
  /** @lends baqend.connector.XMLHttpConnector */
  extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

    /**
     * Indicates if this connector implementation is usable for the given host and port
     * @param {String} host
     * @param {number} port
     * @param {boolean} secure
     * @returns {boolean}
     */
    isUsable: function(host, port, secure) {
      return (
          window != 'undefined' &&
          window.location.hostname == host &&
          window.location.port == port &&
          window.location.protocol == (secure ? 'https:' : 'http:') &&
          typeof XMLHttpRequest != 'undefined'
      );
    }
  },

  constructor: function XMLHttpConnector() {
    Connector.apply(this, arguments);
  },

  /**
   * @inheritDoc
   */
  doSend: function(message, request, receive) {
    if (request.method == 'OAUTH') {
      addEventListener("storage", function handle(event) {
        if (event.key == 'oauth-response') {
          receive(JSON.parse(event.newValue));
          localStorage.removeItem('oauth-response');
          removeEventListener("storage", handle, false);
        }
      }, false);
      return;
    }

    var xhr = new XMLHttpRequest();

    var url = this.origin + this.basePath + request.path;

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var response = {
          headers: {},
          status: xhr.status,
          entity: xhr.response || xhr.responseText
        };

        Connector.RESPONSE_HEADERS.forEach(function(name) {
          response.headers[name] = xhr.getResponseHeader(name);
        });

        receive(response);
      }
    };

    xhr.open(request.method, url, true);

    var entity = request.entity;
    var headers = request.headers;
    for (var name in headers)
      xhr.setRequestHeader(name, headers[name]);

    xhr.withCredentials = message.withCredentials;

    xhr.send(entity);
  },

  /**
   * @inheritDoc
   */
  createWebSocket: function(destination) {
    return new WebSocket(destination);
  }
});

module.exports = XMLHttpConnector;
},{"./Connector":18}],23:[function(require,module,exports){
/**
 * @namespace baqend.connector
 */

exports.Message = require('./Message');
exports.Connector = require('./Connector');
exports.NodeConnector = require('./NodeConnector');
exports.XMLHttpConnector = require('./XMLHttpConnector');
exports.IFrameConnector = require('./IFrameConnector');
},{"./Connector":18,"./IFrameConnector":19,"./Message":20,"./NodeConnector":21,"./XMLHttpConnector":22}],24:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.CommunicationError
 * @extends baqend.error.PersistentError
 *
 * @param {baqend.connector.Message} httpMessage
 */
var CommunicationError = PersistentError.inherit(/** @lends baqend.error.CommunicationError */ {

  status: 0,

	constructor: function CommunicationError(httpMessage) {
		var response = httpMessage.response.entity || {};
		var state = (httpMessage.response.status == 0? 'Request': 'Response');
		var message = response.message || 'Handling the ' + state + ' for ' + httpMessage.request.method + ' ' + httpMessage.request.path;

		PersistentError.call(this, message, response);

		this.name = response.className || 'CommunicationError';
		this.reason = response.reason || 'Communication failed';
    this.status = httpMessage.response.status;

    if(response.data)
      this.data = response.data;

		var cause = response;
		while (cause && cause.stackTrace) {
			this.stack += '\nServerside Caused by: ' + cause.className + ' ' + cause.message;

			var stackTrace = cause.stackTrace;
			for (var i = 0; i < stackTrace.length; ++i) {
				var el = stackTrace[i];

				this.stack += '\n    at ' + el.className + '.' + el.methodName;
				this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')';
			}
			
			cause = cause.cause;
		}
	}
});

module.exports = CommunicationError;
},{"./PersistentError":28}],25:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityExistsError
 * @extends baqend.error.PersistentError
 *
 * @param {String} entity
 */
var EntityExistsError = PersistentError.inherit(/** @lends baqend.error.EntityExistsError.prototype */{
  constructor: function EntityExistsError(entity) {
    PersistentError.call(this, 'The entity ' + entity + ' is managed by a different db.');

    this.entity = entity;
  }
});

module.exports = EntityExistsError;
},{"./PersistentError":28}],26:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.EntityNotFoundError
 * @extends baqend.error.PersistentError
 *
 * @param {String} identity
 */
var EntityNotFoundError = PersistentError.inherit(/** @lends baqend.error.EntityNotFoundError.prototype */ {
  constructor: function EntityNotFoundError(identity) {
    PersistentError.call(this, 'Entity ' + identity + ' is not found');

    this.identity = identity;
  }
});

module.exports = EntityNotFoundError;
},{"./PersistentError":28}],27:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.IllegalEntityError
 * @extends baqend.error.PersistentError
 *
 * @param {*} entity
 */
var IllegalEntityError = PersistentError.inherit({
  constructor: function IllegalEntityError(entity) {
		PersistentError.call(this, 'Entity ' + entity + ' is not a valid entity');
		
		this.entity = entity;
	}
});

module.exports = IllegalEntityError;
},{"./PersistentError":28}],28:[function(require,module,exports){
/**
 * @class baqend.error.PersistentError
 * @extends Error
 *
 * @param {String} message
 * @param {Error=} cause
 */
var PersistentError = Error.inherit(/* @lends baqend.error.PersistentError.prototype */ {
  cause: null,

  /**
   * @lends baqend.error.PersistentError
   */
  extend: {
    of: function(error) {
      if (error instanceof PersistentError) {
        return error;
      } else {
        return new PersistentError(null, error);
      }
    }
  },

  constructor: function PersistentError(message, cause) {
    message = (message ? message : 'An unexpected persistent error occured.');

    if (Error.hasOwnProperty('captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error()).stack;
    }

    this.message = message;
    this.name = this.constructor.name;

    if (cause) {
      this.cause = cause;
      if (cause.stack) {
        this.stack += '\nCaused By: ' + cause.stack;
      }
    }
  }
});

module.exports = PersistentError;
},{}],29:[function(require,module,exports){
var PersistentError = require('./PersistentError');

/**
 * @class baqend.error.RollbackError
 * @extends baqend.error.PersistentError
 *
 * @param {Error} cause
 */
var RollbackError = PersistentError.inherit(/* @lends baqend.error.RollbackError */ {
  constructor: function RollbackError(cause) {
    PersistentError.call(this, 'The transaction has been rollbacked', cause);
  }
});

module.exports = RollbackError;

},{"./PersistentError":28}],30:[function(require,module,exports){
/**
 * @namespace baqend.error
 */

exports.CommunicationError = require('./CommunicationError');
exports.EntityExistsError = require('./EntityExistsError');
exports.EntityNotFoundError = require('./EntityNotFoundError');
exports.IllegalEntityError = require('./IllegalEntityError');
exports.PersistentError = require('./PersistentError');
exports.RollbackError = require('./RollbackError');
},{"./CommunicationError":24,"./EntityExistsError":25,"./EntityNotFoundError":26,"./IllegalEntityError":27,"./PersistentError":28,"./RollbackError":29}],31:[function(require,module,exports){
/**
 * @namespace baqend
 *
 * @borrows baqend.EntityManager#User
 * @borrows baqend.EntityManager#Role
 * @borrows baqend.EntityManager#Device
 * @borrows baqend.EntityManager#&lt;<i>YourEmbeddableClass</i>&gt;
 * @borrows baqend.EntityManager#&lt;<i>YourEntityClass</i>&gt;
 */

require('jahcode');
require('lie/dist/lie.polyfill');
require('./polyfills');

var EntityManagerFactory = require('./EntityManagerFactory');
var EntityManager = require('./EntityManager');

EntityManager.prototype.collection = require('./collection');
EntityManager.prototype.binding = require('./binding');
EntityManager.prototype.connector = require('./connector');
EntityManager.prototype.error = require('./error');
EntityManager.prototype.message = require('./message');
EntityManager.prototype.metamodel = require('./metamodel');
EntityManager.prototype.util = require('./util');

EntityManager.prototype.EntityManager = require('./EntityManager');
EntityManager.prototype.EntityManagerFactory = require('./EntityManagerFactory');
EntityManager.prototype.EntityTransaction = require('./EntityTransaction');
EntityManager.prototype.Query = require('./Query');

var emf = new EntityManagerFactory();
exports = module.exports = emf.createEntityManager(true);

/**
 * Connects the DB with the baqend server and calls the callback on success
 * @param {String} hostOrApp The host or the app name to connect with
 * @param {Boolean} [secure=false] <code>true</code> To use a secure connection
 * @param {baqend.util.Lockable~callback=} doneCallback The callback, called when a connection is established and the
 * SDK is ready to use
 * @param {baqend.util.Lockable~callback=} failCallback When an error occurred while initializing the SDK
 * @function
 * @alias baqend#connect
 */
exports.connect = function(hostOrApp, secure, doneCallback, failCallback) {
  if (secure instanceof Function) {
    failCallback = doneCallback;
    doneCallback = secure;
    secure = false;
  }

  emf.connect(hostOrApp, secure);
  return this.ready(doneCallback, failCallback);
};

},{"./EntityManager":1,"./EntityManagerFactory":2,"./EntityTransaction":3,"./Query":5,"./binding":16,"./collection":17,"./connector":23,"./error":30,"./message":32,"./metamodel":48,"./polyfills":49,"./util":62,"jahcode":67,"lie/dist/lie.polyfill":68}],32:[function(require,module,exports){
var Message = require('./connector/Message');

/**
 * Get the list of all available subresources
 * 
 * @class baqend.message.ListAllResources
 * @extends baqend.connector.Message
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
 * @class baqend.message.ApiVersion
 * @extends baqend.connector.Message
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
 * @class baqend.message.Specification
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetBloomFilter
 * @extends baqend.connector.Message
 *
 */
exports.GetBloomFilter = Message.create({
    method: 'GET',
    path: '/replication',
    status: [200]
});

/**
 * Get the current Orestes config
 * 
 * @class baqend.message.GetOrestesConfig
 * @extends baqend.connector.Message
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
 * @class baqend.message.UpdateOrestesConfig
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.UpdateOrestesConfig = Message.create({
    method: 'PUT',
    path: '/config',
    status: [200, 202]
});

/**
 * Connects a browser to this server
 * 
 * @class baqend.message.Connect
 * @extends baqend.connector.Message
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
 * @class baqend.message.Status
 * @extends baqend.connector.Message
 *
 */
exports.Status = Message.create({
    method: 'GET',
    path: '/status',
    status: [200]
});

/**
 * Determines whether the IP has exceeded its rate limit
 * 
 * @class baqend.message.BannedIp
 * @extends baqend.connector.Message
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
 * @class baqend.message.Banned
 * @extends baqend.connector.Message
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
 * @class baqend.message.Unban
 * @extends baqend.connector.Message
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
 * @class baqend.message.UnbanIp
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetBucketNames
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetBucketIds
 * @extends baqend.connector.Message
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
 * @class baqend.message.ExportBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param bat {Object} The baqend authorization token
 */
exports.ExportBucket = Message.create({
    method: 'GET',
    path: '/db/:bucket?bat=',
    status: [200]
});

/**
 * Upload all objects to the bucket
 * Imports the complete Bucket content
 * 
 * @class baqend.message.ImportBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param bat {Object} The baqend authorization token
 * @param body {object} The massage Content
 */
exports.ImportBucket = Message.create({
    method: 'PUT',
    path: '/db/:bucket?bat=',
    status: [200]
});

/**
 * Deletes all objects of the bucket
 * Deletes all objects of the bucket
 * 
 * @class baqend.message.TruncateBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param bat {Object} The baqend authorization token
 */
exports.TruncateBucket = Message.create({
    method: 'DELETE',
    path: '/db/:bucket?bat=',
    status: [200]
});

/**
 * Create object
 * Create the given Object.
 * The object will be created and gets a unique oid.
 * 
 * @class baqend.message.CreateObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
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
 * @class baqend.message.GetObject
 * @extends baqend.connector.Message
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
 * @class baqend.message.ReplaceObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
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
 * @class baqend.message.DeleteObject
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetAllSchemas
 * @extends baqend.connector.Message
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
 * @class baqend.message.UpdateAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
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
 * @class baqend.message.ReplaceAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
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
 * @class baqend.message.GetSchema
 * @extends baqend.connector.Message
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
 * @class baqend.message.UpdateSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
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
 * @class baqend.message.ReplaceSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
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
 * @class baqend.message.DeleteSchema
 * @extends baqend.connector.Message
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
 * @class baqend.message.AdhocQuery
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param q {Object} The query
 * @param eager {Object} indicates if the query result should be send back as ids or as objects
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 */
exports.AdhocQuery = Message.create({
    method: 'GET',
    path: '/db/:bucket/query?q&start=0&count=-1&sort=&eager=',
    status: [200]
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 * 
 * @class baqend.message.AdhocQueryPOST
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 * @param body {object} The massage Content
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
 * @class baqend.message.AdhocCountQuery
 * @extends baqend.connector.Message
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
 * @class baqend.message.AdhocCountQueryPOST
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.AdhocCountQueryPOST = Message.create({
    method: 'POST',
    path: '/db/:bucket/count',
    status: [200]
});

/**
 * List all Query subresources
 * 
 * @class baqend.message.ListQueryResources
 * @extends baqend.connector.Message
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
 * @class baqend.message.CreateQuery
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.CreateQuery = Message.create({
    method: 'POST',
    path: '/query',
    status: [201]
});

/**
 * List all subresources of a query
 * 
 * @class baqend.message.ListThisQueryResources
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetQueryCode
 * @extends baqend.connector.Message
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
 * @class baqend.message.RunQuery
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetQueryParameters
 * @extends baqend.connector.Message
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
 * @class baqend.message.NewTransaction
 * @extends baqend.connector.Message
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
 * @class baqend.message.CommitTransaction
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 * @param body {object} The massage Content
 */
exports.CommitTransaction = Message.create({
    method: 'PUT',
    path: '/transaction/:tid/committed',
    status: [200]
});

/**
 * Returns the object in the given version or the newest version if the given does not exist.
 * 
 * @class baqend.message.GetObjectInExplicitVersion
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param version {Object} The version to load
 */
exports.GetObjectInExplicitVersion = Message.create({
    method: 'GET',
    path: '/db/:bucket/:oid/:version',
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
 * @class baqend.message.UpdatePartially
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.UpdatePartially = Message.create({
    method: 'POST',
    path: '/db/:bucket/:oid',
    status: [204]
});

/**
 * Update the object field
 * Executes the partial update on a object field.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class baqend.message.UpdateField
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param field {Object} The field name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.UpdateField = Message.create({
    method: 'POST',
    path: '/db/:bucket/:oid/:field',
    status: [204]
});

/**
 * Method to login a user
 * Log in a user by it's credentials
 * 
 * @class baqend.message.Login
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
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
 * @class baqend.message.Register
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
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
 * @class baqend.message.Me
 * @extends baqend.connector.Message
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
 * @class baqend.message.ValidateUser
 * @extends baqend.connector.Message
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
 * @class baqend.message.Logout
 * @extends baqend.connector.Message
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
 * @class baqend.message.NewPassword
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.NewPassword = Message.create({
    method: 'POST',
    path: '/db/User/password',
    status: [200]
});

/**
 * Method to verify user by a given token
 * 
 * @class baqend.message.Verify
 * @extends baqend.connector.Message
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
 * This resource is invoked by the provider with a redirect after the user granted permission.
 * 
 * @class baqend.message.OAuth2
 * @extends baqend.connector.Message
 *
 * @param oauth_verifier {Object} OAuth 1.0 code
 * @param code {Object} The code written by the provider
 * @param provider {Object} The OAuth provider
 * @param oauth_token {Object} OAuth 1.0 identifier
 * @param state {Object} On true a token will be returned
 */
exports.OAuth2 = Message.create({
    method: 'GET',
    path: '/db/User/OAuth/:provider?state=&code=&oauth_verifier=&oauth_token=',
    status: [200]
});

/**
 * Method to invoke a OAuth-1.0 login/register
 * The resource requests a request-token and redirects the user to the provider page to log-in and grant permission for
 * your application.
 * 
 * @class baqend.message.OAuth1
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetBaqendCode
 * @extends baqend.connector.Message
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
 * @class baqend.message.SetBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The type of the script
 * @param body {object} The massage Content
 */
exports.SetBaqendCode = Message.create({
    method: 'PUT',
    path: '/code/:bucket/:type',
    status: [200, 202]
});

/**
 * Delete the code of the given bucket and type
 * 
 * @class baqend.message.DeleteBaqendCode
 * @extends baqend.connector.Message
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
 * @class baqend.message.PostBaqendModule
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetBaqendModule
 * @extends baqend.connector.Message
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
 * @class baqend.message.GetAllModules
 * @extends baqend.connector.Message
 *
 */
exports.GetAllModules = Message.create({
    method: 'GET',
    path: '/code',
    status: [200]
});

/**
 * Get all file ID's   File-Bucket
 * retrieve meta-information about all accessible Files in a specific Bucket.
 * 
 * @class baqend.message.ListFiles
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The unique object identifier
 * @param count {Object} The upper limit to return.
 */
exports.ListFiles = Message.create({
    method: 'GET',
    path: '/file/:bucket/ids?start=&count=-1',
    status: [200]
});

/**
 * Retrieves the bucket ACL's
 * The bucket metadata object contains the bucketAcl
 * 
 * @class baqend.message.GetFileBucketAcls
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.GetFileBucketAcls = Message.create({
    method: 'GET',
    path: '/file/:bucket',
    status: [200]
});

/**
 * Sets the Bucket ACL
 * Creates or replaces the bucket ACL's to control permission access to all included Files.
 * 
 * @class baqend.message.SetFileBucketAcls
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.SetFileBucketAcls = Message.create({
    method: 'PUT',
    path: '/file/:bucket',
    status: [204]
});

/**
 * deletes all files of a file Bucket
 * Deletes the bucket and all its content
 * 
 * @class baqend.message.DeleteFileBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DeleteFileBucket = Message.create({
    method: 'DELETE',
    path: '/file/:bucket',
    status: [204]
});

/**
 * Creates a new file with a UUID
 * Creates a File with a random ID, only Insert permissions are required
 * 
 * @class baqend.message.CreateFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.CreateFile = Message.create({
    method: 'POST',
    path: '/file/:bucket',
    status: [200]
});

/**
 * Download a file  File-Bucket-OID
 * Download a chunk of Data.
 * 
 * @class baqend.message.GetFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.GetFile = Message.create({
    method: 'GET',
    path: '/file/:bucket/:oid',
    status: [200, 304]
});

/**
 * replaces File ACL
 * replaces File Access control listing  Files.
 * 
 * @class baqend.message.SetFileAcl
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.SetFileAcl = Message.create({
    method: 'POST',
    path: '/file/:bucket/:oid',
    status: [204]
});

/**
 * Replace a file
 * Replace an File with some other file.
 * Like objects, you can specify an explicit version in the
 * If-Match Header or use * to replace any version but error if the File dose not exist.
 * 
 * @class baqend.message.ReplaceFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.ReplaceFile = Message.create({
    method: 'PUT',
    path: '/file/:bucket/:oid',
    status: [200]
});

/**
 * Delete a file
 * Deletes a file.
 * Like objects, you can specify an explicit version in the
 * If-Match Header or use * to replace any version but error if the File dose not exist.
 * 
 * @class baqend.message.DeleteFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.DeleteFile = Message.create({
    method: 'DELETE',
    path: '/file/:bucket/:oid',
    status: [203]
});

/**
 * List bucket indexes
 * List all indexes of the given bucket
 * 
 * @class baqend.message.ListIndexes
 * @extends baqend.connector.Message
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
 * @class baqend.message.CreateDropIndex
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
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
 * @class baqend.message.DropAllIndexes
 * @extends baqend.connector.Message
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
 * @class baqend.message.DeviceRegister
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
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
 * @class baqend.message.DevicePush
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
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
 * @class baqend.message.DeviceRegistered
 * @extends baqend.connector.Message
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
 * @class baqend.message.UploadAPNSCertificate
 * @extends baqend.connector.Message
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
 * @class baqend.message.GCMAKey
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.GCMAKey = Message.create({
    method: 'POST',
    path: '/config/GCMKey',
    status: [204]
});


},{"./connector/Message":20}],33:[function(require,module,exports){
var Accessor = require('../binding/Accessor');

/**
 * @class baqend.metamodel.Attribute
 */
var Attribute = Object.inherit(/** @lends baqend.metamodel.Attribute.prototype */ {
  /**
   * @lends baqend.metamodel.Attribute
   */
  extend: {
    /**
     * @enum {number}
     */
    PersistentAttributeType: {
      BASIC: 0,
      ELEMENT_COLLECTION: 1,
      EMBEDDED: 2,
      MANY_TO_MANY: 3,
      MANY_TO_ONE: 4,
      ONE_TO_MANY: 5,
      ONE_TO_ONE: 6
    }
  },

  /**
   * @type Boolean
   */
  get isAssociation() {
    return this.persistentAttributeType > Attribute.PersistentAttributeType.EMBEDDED;
  },

  /**
   * @type Boolean
   */
  get isCollection() {
    return this.persistentAttributeType == Attribute.PersistentAttributeType.ELEMENT_COLLECTION;
  },

  /**
   * @type Boolean
   */
  isId: false,

  /**
   * @type Boolean
   */
  isVersion: false,

  /**
   * @type Boolean
   */
  isAcl: false,

  /**
   * @type Boolean
   */
  isMetadata: false,

  /**
   * @type baqend.binding.Accessor
   */
  accessor: null,

  /**
   * @type Number
   */
  persistentAttributeType: -1,

  /**
   * @type baqend.metamodel.ManagedType
   */
  declaringType: null,

  /**
   * @type String
   */
  name: null,

  /**
   * @type Number
   */
  order: null,

  /**
   * @param {String} name The attribute name
   * @param {Boolean=} isMetadata <code>true</code> if the attribute is an metadata attribute
   */
  constructor: function Attribute(name, isMetadata) {
    this.name = name;
    this.isMetadata = !!isMetadata;
  },

  /**
   * @param {baqend.metamodel.ManagedType} declaringType The type that owns this attribute
   * @param {Number} order Position of the attribute
   */
  init: function(declaringType, order) {
    if (this.declaringType)
      throw new Error('The attribute is already initialized.');

    this.order = order;
    this.accessor = new Accessor();
    this.declaringType = declaringType;
  },

  /**
   * @param {Object} entity
   * @returns {*}
   */
  getValue: function (entity) {
    return this.accessor.getValue(entity, this);
  },

  /**
   * @param {Object} entity
   * @param {*} value
   */
  setValue: function (entity, value) {
    this.accessor.setValue(entity, this, value);
  },

  /**
   * Gets this attribute value form the object as json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object which contains the value of this attribute
   * @return {*} The converted json value
   * @abstract
   */
  getJsonValue: function (state, object) {},

  /**
   * Sets this attribute value from json to the object
   * @param {baqend.util.Metadata} state The root state
   * @param {*} object The object which contains the attribute
   * @param {*} jsonValue The json value to convert an set
   * @abstract
   */
  setJsonValue: function (state, object, jsonValue) {},

  /**
   * Converts this attribute field to json
   * @abstract
   * @returns {Object} The attribute description as json
   */
  toJSON: function() {}
});

module.exports = Attribute;
},{"../binding/Accessor":6}],34:[function(require,module,exports){
var Type = require('./Type');
var GeoPoint = require('../GeoPoint');

/**
 * @class baqend.metamodel.BasicType
 * @extends baqend.metamodel.Type
 */
var BasicType = Type.inherit(/** @lends baqend.metamodel.BasicType.prototype */ {

  /**
   * The persistent type of this type
   * @type Number
   */
  persistenceType: Type.PersistenceType.BASIC,

  /**
   * Indicates if this type is not the main type of the constructor
   * @type {Boolean}
   */
  noResolving: false,

  /**
   * Creates a new instance of a native db type
   * @param {String} ref The db ref of this type
   * @param {Function} typeConstructor The javascript class of this type
   * @param {Boolean} noResolving Indicates if this type is not the main type of the constructor
   */
  constructor: function BasicType(ref, typeConstructor, noResolving) {
    if (ref.indexOf('/db/') != 0)
      ref = '/db/' + ref;

    Type.call(this, ref, typeConstructor);

    this.noResolving = noResolving;
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function (state, currentValue) {
    if (currentValue === null || currentValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(currentValue);
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function (state, jsonValue, currentValue) {
    if (jsonValue === null || jsonValue === undefined) {
      return null;
    }

    return this.typeConstructor.asInstance(jsonValue);
  },

  toString: function() {
    return "BasicType(" + this.ref + ")";
  }
});

BasicType.extend( /** @lends baqend.metamodel.BasicType */ {
  Boolean: new BasicType('Boolean', Boolean),
  Double: new BasicType('Double', Number),
  Integer: new BasicType('Integer', Number),
  String: new BasicType('String', String),
  DateTime: new (BasicType.inherit({
    constructor: function DateTimeType() {
      BasicType.call(this, 'DateTime', Date);
    },

    toJsonValue: function(state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
      }
      return value;
    }
  })),

  Date: new (BasicType.inherit({
    constructor: function DateType() {
      BasicType.call(this, 'Date', Date);
    },

    toJsonValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(0, value.indexOf('T'));
      }
      return value;
    },

    fromJsonValue: function (state, json) {
      return this.superCall(state, String.isInstance(json) ? json + 'T00:00Z' : json);
    }
  })),

  Time: new (BasicType.inherit({
    constructor: function TimeType() {
      BasicType.call(this, 'Time', Date);
    },

    toJsonValue: function (state, currentValue) {
      var value = this.superCall(state, currentValue);
      if (value) {
        value = value.toISOString();
        value = value.substring(value.indexOf('T') + 1);
      }
      return value;
    },

    fromJsonValue: function (state, json) {
      return this.superCall(state, String.isInstance(json) ? '1970-01-01T' + json : json);
    }
  })),

  GeoPoint: new BasicType('GeoPoint', GeoPoint),

  JsonArray: new (BasicType.inherit({
    constructor: function JsonArrayType() {
      BasicType.call(this, 'JsonArray', Array);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toJsonValue: function (state, value) {
      if (value && value.constructor == Array) {
        return value;
      }

      return null;
    }
  })),

  JsonObject: new (BasicType.inherit({
    constructor: function JsonObjectType() {
      BasicType.call(this, 'JsonObject', Object);
    },

    init: function(classFactory) {
      this._enhancer = classFactory;
    },

    toJsonValue: function (state, value) {
      if (value && value.constructor == Object) {
        return value;
      }

      return null;
    }
  }))
});

module.exports = BasicType;
},{"../GeoPoint":4,"./Type":47}],35:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');

/**
 * @class baqend.metamodel.CollectionAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var CollectionAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.CollectionAttribute.prototype */ {

  collectionType: PluralAttribute.CollectionType.COLLECTION,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor: function CollectionAttribute(name, elementType) {
    PluralAttribute.call(this, name, elementType);
    this.typeConstructor = collection.Collection;
  }
});

module.exports = CollectionAttribute;
},{"../collection":17,"./PluralAttribute":44}],36:[function(require,module,exports){
/**
 * Creates a new index instance which is needed to create an
 * database index.
 *
 * @class baqend.metamodel.DbIndex
 *
 * @param {String|Object|Array} keys The name of the field which will be used for the index,
 * an object of an field and index type combination or
 * an array of objects to create an compound index
 * @param {Boolean=} unique Indicates if the index will be unique
 */
var DbIndex = Object.inherit(/** @lends baqend.metamodel.DbIndex.prototype */ {

  /** @lends baqend.metamodel.DbIndex */
  extend: {
    /**
     * @type String
     */
    ASC: 'asc',
    /**
     * @type String
     */
    DESC: 'desc',
    /**
     * @type String
     */
    GEO: 'geo',

    /**
     * Returns DbIndex Object created from the given JSON
     */
    fromJSON: function(json) {
      return new DbIndex(json.keys, json.unique);
    }
  },

  /**
   * @type Boolean
   */
  drop: false,

  constructor: function DbIndex(keys, unique) {

    if(String.isInstance(keys)) {
      var key = {};
      key[keys] = DbIndex.ASC;
      this.keys = [key];
    } else if(Array.isInstance(keys)) {
      this.keys = keys;
    } else if(Object.isInstance(keys)) {
      this.keys = [keys];
    } else {
      throw new Error("The keys parameter must be an String, Object or Array.");
    }

    this.unique = unique === true;
  },

  hasKey: function(name) {
    for(var i = 0; i < this.keys.length; i++) {
      if(this.keys[i][name]) {
        return true;
      }
    }
    return false;
  },

  get isCompound() {
    return this.keys.length > 1;
  },

  get isUnique() {
    return this.unique;
  },

  /**
   * Returns a JSON representation of the Index object
   *
   * @return {Object} A Json of this Index object
   */
  toJSON: function() {
    return {
      unique: this.unique,
      keys: this.keys,
      drop: this.drop
    };
  }
});

module.exports = DbIndex;

},{}],37:[function(require,module,exports){
var ManagedType = require('./ManagedType');
var Type = require('./Type');
var binding = require('../binding');

/**
 * @class baqend.metamodel.EmbeddableType
 * @extends baqend.metamodel.ManagedType
 */
var EmbeddableType = ManagedType.inherit(/** @lends baqend.metamodel.EmbeddableType.prototype */ {
  persistenceType: Type.PersistenceType.EMBEDDABLE,

  constructor: function EmbeddableType(name, typeConstructor) {
    ManagedType.call(this, name, typeConstructor);
  },

  /**
   * {@inheritDoc}
   */
  createProxyClass: function() {
    return this._enhancer.createProxy(binding.Managed);
  },

  /**
   * {@inheritDoc}
   * @param {baqend.EntityManager} db {@inheritDoc}
   * @return {baqend.binding.ManagedFactory} A factory which creates embeddable objects
   */
  createObjectFactory: function(db) {
    return binding.ManagedFactory.create(this, db);
  },

  create: function() {
    var instance = Object.create(this.typeConstructor.prototype);

    Object.defineProperty(instance, '_metadata', {
      value: {type: this},
      writable: false,
      enumerable: false,
      configurable: true
    });

    return instance;
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function (state, object) {
    if (state._root && this.typeConstructor.isInstance(object) && !object._metadata._root) {
      object._metadata._root = state._root;
    }

    return this.superCall(state, object);
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function (state, jsonObject, currentObject) {
    if (jsonObject) {
      if (!this.typeConstructor.isInstance(currentObject))
        currentObject = this.create();

      if (state._root && !currentObject._metadata._root)
        currentObject._metadata._root = state._root;
    }

    return this.superCall(state, jsonObject, currentObject);
  },

  toString: function() {
    return "EmbeddableType(" + this.ref + ")";
  }
});

module.exports = EmbeddableType;
},{"../binding":16,"./ManagedType":40,"./Type":47}],38:[function(require,module,exports){
var binding = require('../binding');

var SingularAttribute = require('./SingularAttribute');
var BasicType = require('./BasicType');
var Type = require('./Type');
var ManagedType = require('./ManagedType');
var util = require('../util');

/**
 * @class baqend.metamodel.EntityType
 * @extends baqend.metamodel.ManagedType
 *
 * @param {String} ref
 * @param {baqend.metamodel.EntityType} superType
 * @param {Function} typeConstructor
 */
var EntityType = ManagedType.inherit( /** @lends baqend.metamodel.EntityType.prototype */ {
  persistenceType: Type.PersistenceType.ENTITY,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredId: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredVersion: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  declaredAcl: null,

  /**
   * @type baqend.metamodel.EntityType
   */
  superType: null,

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get id() {
    return this.declaredId || this.superType.id;
  },

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get version() {
    return this.declaredVersion || this.superType.version;
  },

  /**
   * @type baqend.metamodel.SingularAttribute
   */
  get acl() {
    return this.declaredAcl || this.superType.acl;
  },

  /**
   * @type baqend.util.Permission
   */
  loadPermission: null,

  /**
   * @type baqend.util.Permission
   */
  updatePermission: null,

  /**
   * @type baqend.util.Permission
   */
  insertPermission: null,

  /**
   * @type baqend.util.Permission
   */
  deletePermission: null,

  /**
   * @type baqend.util.Permission
   */
  queryPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaSubclassPermission: null,

  constructor: function EntityType(ref, superType, typeConstructor) {
    ManagedType.call(this, ref, typeConstructor);

    this.superType = superType;
    this.loadPermission = new util.Permission();
    this.insertPermission = new util.Permission();
    this.updatePermission = new util.Permission();
    this.deletePermission = new util.Permission();
    this.queryPermission = new util.Permission();
    this.schemaSubclassPermission = new util.Permission();
  },

  /**
   * {@inheritDoc}
   */
  createProxyClass: function() {
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
  },

  create: function() {
    var instance = Object.create(this.typeConstructor.prototype);

    Object.defineProperty(instance, '_metadata', {
      value: new util.Metadata(instance, this),
      writable: false,
      enumerable: false,
      configurable: true
    });

    return instance;
  },

  /**
   * {@inheritDoc}
   * Creates an ObjectFactory for this type and the given EntityManager
   * @return {baqend.binding.EntityFactory} A factory which creates entity objects
   */
  createObjectFactory: function(db) {
    switch (this.name) {
      case 'User':
        return binding.UserFactory.create(this, db);
      case 'Device':
        return binding.DeviceFactory.create(this, db);
      case 'Object':
        return undefined;
    }

    return binding.EntityFactory.create(this, db);
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function (state, jsonObject, currentObject, isRoot) {
    if (isRoot) {
      return this.superCall(state, jsonObject, currentObject);
    } else if (jsonObject) {
      return state.db.getReference(jsonObject);
    } else {
      return null;
    }
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function(state, object, isRoot) {
    if (isRoot) {
      return this.superCall(state, object);
    } else if (this.typeConstructor.isInstance(object)) {
      object.attach(state.db);
      return object.id;
    } else {
      return null;
    }
  },

  toString: function() {
    return "EntityType(" + this.ref + ")";
  },

  toJSON: function() {
    var json = this.superCall();

    json.acl.schemaSubclass = this.schemaSubclassPermission;
    json.acl.insert = this.insertPermission;
    json.acl.update = this.updatePermission;
    json.acl.delete = this.deletePermission;
    json.acl.query = this.queryPermission;

    return json;
  }
});

EntityType.extend(/** @lends baqend.metamodel.EntityType */ {

  /**
   * @class baqend.metamodel.EntityType.Object
   * @extends baqend.metamodel.EntityType
   */
  Object: EntityType.inherit(/** @lends baqend.metamodel.EntityType.Object.prototype */{
    /** @lends baqend.metamodel.EntityType.Object */
    extend: {
      ref: '/db/Object'
    },

    constructor: function ObjectType() {
      EntityType.call(this, EntityType.Object.ref, null, Object);

      this.declaredId = new SingularAttribute('id', BasicType.String, true);
      this.declaredId.init(this, 0);
      this.declaredId.isId = true;
      this.declaredVersion = new SingularAttribute('version', BasicType.Double, true);
      this.declaredVersion.init(this, 1);
      this.declaredVersion.isVersion = true;
      this.declaredAcl = new SingularAttribute('acl', BasicType.JsonObject, true);
      this.declaredAcl.init(this, 2);
      this.declaredAcl.isAcl = true;

      this.declaredAttributes = [this.declaredId, this.declaredVersion, this.declaredAcl];
    }
  })
});

module.exports = EntityType;
},{"../binding":16,"../util":62,"./BasicType":34,"./ManagedType":40,"./SingularAttribute":46,"./Type":47}],39:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');

/**
 * @class baqend.metamodel.ListAttribute
 * @extends baqend.metamodel.PluralAttribute
 *
 * @param {String} name
 * @param {baqend.metamodel.Type} elementType
 */
var ListAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.ListAttribute.prototype */ {

  extend: {
    ref: '/db/collection.List'
  },

  collectionType: PluralAttribute.CollectionType.LIST,

  constructor: function ListAttribute(name, elementType) {
    PluralAttribute.call(this, name, elementType);
    this.typeConstructor = collection.List;
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: ListAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
});

module.exports = ListAttribute;
},{"../collection":17,"./PluralAttribute":44}],40:[function(require,module,exports){
var binding = require('../binding');

var Type = require('./Type');
var Permission = require('../util/Permission');
var Iterator = require('../collection').Iterator;
var Validator = require('../util/Validator');

/**
 * @class baqend.metamodel.ManagedType
 * @extends baqend.metamodel.Type
 */
var ManagedType = Type.inherit(/** @lends baqend.metamodel.ManagedType.prototype */ {

  /**
   * @class baqend.Metamodel.prototype.AttributeIterator
   * @extends baqend.collection.Iterator
   */
  AttributeIterator: Object.inherit(Iterator, /* @lends baqend.Metamodel.prototype.AttributeIterator.prototype */ {
    index: 0,

    constructor: function AttributeIterator(type) {
      this.types = [];

      do {
        this.types.push(type);
      } while (type = type.superType);
    },

    /**
     * @return {Object} item
     * @return {Boolean} item.done
     * @return {baqend.metamodel.Attribute} item.value
     */
    next: function() {
      var type = this.types.pop();

      while (type && type.declaredAttributes.length == this.index) {
        type = this.types.pop();
        this.index = 0;
      }

      if (type) {
        this.types.push(type);
        return {done: false, value: type.declaredAttributes[this.index++]};
      } else {
        return Iterator.DONE;
      }
    }
  }),

  /**
   * @type baqend.binding.Enhancer
   */
  _enhancer: null,

  /**
   * @type {baqend.metamodel.Attribute[]}
   */
  declaredAttributes: null,

  /**
   * @type {baqend.metamodel.EntityType}
   */
  superType: null,

  /**
   * @type baqend.util.Permission
   */
  schemaAddPermission: null,

  /**
   * @type baqend.util.Permission
   */
  schemaReplacePermission: null,

  /**
   * @type Function
   * @param {String|Function} code
   */
  set validationCode(code) {
    if(!code) {
      this._validationCode = null;
    } else {
      this._validationCode = Validator.compile(this, code);
    }
  },

  /**
   * @type Function
   */
  get validationCode() {
    return this._validationCode;
  },

  /**
   * @type Function
   * @private
   */
  _validationCode: null,

  /**
   * @type {Function}
   */
  get typeConstructor() {
    if (!this._typeConstructor) {
      this.typeConstructor = this.createProxyClass();
    }
    return this._typeConstructor;
  },

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if (this._typeConstructor) {
      throw new Error("Type constructor has already been set.");
    }

    var isEntity = typeConstructor.prototype instanceof binding.Entity;
    if (this.isEntity) {
      if (!isEntity)
        throw new TypeError("Entity classes must extends the Entity class.");
    } else {
      if (!(typeConstructor.prototype instanceof binding.Managed) || isEntity)
        throw new TypeError("Embeddable classes must extends the Managed class.");
    }

    this._enhancer.enhance(this, typeConstructor);
    this._typeConstructor = typeConstructor;
  },

  /**
   * @param {String} ref or full class name
   * @param {Function} typeConstructor
   */
  constructor: function ManagedType(ref, typeConstructor) {
    Type.call(this, ref.indexOf('/db/') != 0 ? '/db/' + ref : ref, typeConstructor);
    this.declaredAttributes = [];
    this.schemaAddPermission = new Permission();
    this.schemaReplacePermission = new Permission();
  },

  /**
   * Initialize this type
   * @param {baqend.binding.Enhancer} enhancer The class enhancer
   * used to enhance and instantiate instance of this managed class
   */
  init: function(enhancer) {
    this._enhancer = enhancer;

    if (this._typeConstructor && !this._enhancer.getIdentifier(this._typeConstructor))
      this._enhancer.setIdentifier(this._typeConstructor, this.ref);
  },

  /**
   * Creates an ProxyClass for this type
   * @return {Class<baqend.binding.Managed>} the crated proxy class for this type
   * @abstract
   */
  createProxyClass: function() {},

  /**
   * Creates an ObjectFactory for this type and the given EntityManager
   * @param {baqend.EntityManager} db The created instances will be attached to this EntityManager
   * @return {baqend.binding.ManagedFactory} the crated object factory for the given EntityManager
   * @abstract
   */
  createObjectFactory: function(db) {},

  /**
   * Creates a new instance of the managed type, without invoking any constructors
   * This method is used to create object instances which are loaded form the backend
   * @returns {Object}
   * @abstract
   */
  create: function() {},

  /**
   * @return {baqend.metamodel.ManagedType.AttributeIterator}
   */
  attributes: function() {
    return new this.AttributeIterator(this);
  },

  /**
   * Adds an attribute to this type
   * @param {baqend.metamodel.Attribute} attr The attribute to add
   * @param {Number=} order Position of the attribute
   */
  addAttribute: function(attr, order) {
    if (this.getAttribute(attr.name))
      throw new Error("An attribute with the name " + attr.name + " is already declared.");

    if(attr.order == null) {
      order = typeof order == 'undefined'? this.declaredAttributes.length: order;
    } else {
      order = attr.order;
    }
    attr.init(this, order);

    this.declaredAttributes.push(attr);
    if (this._typeConstructor && this.name != 'Object')
      this._enhancer.enhanceProperty(this._typeConstructor, attr);
  },

  /**
   * Removes an attribute from this type
   * @param {String} name The Name of the attribute which will be removed
   */
  removeAttribute: function(name) {
    var length = this.declaredAttributes.length;
    this.declaredAttributes = this.declaredAttributes.filter(function(val) {
      return val.name != name;
    });

    if (length == this.declaredAttributes.length)
      throw new Error("An Attribute with the name " + name + " is not declared.");
  },

  /**
   * @param {!String} name
   * @returns {baqend.metamodel.Attribute}
   */
  getAttribute: function(name) {
    var attr = this.getDeclaredAttribute(name);

    if (!attr && this.superType) {
      attr = this.superType.getAttribute(name);
    }

    return attr;
  },

  /**
   * @param {String|Number} val Name or order of the attribute
   * @returns {baqend.metamodel.Attribute}
   */
  getDeclaredAttribute: function(val) {
    for (var i = 0, attr; attr = this.declaredAttributes[i]; ++i) {
      if (attr.name === val || attr.order === val) {
        return attr;
      }
    }

    return null;
  },

  /**
   * @inheritDoc
   */
  fromJsonValue: function(state, jsonObject, currentObject) {
    if (jsonObject) {
      for (var iter = this.attributes(), item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        if (!attribute.isMetadata)
          attribute.setJsonValue(state, currentObject, jsonObject[attribute.name]);
      }
    } else {
      currentObject = null;
    }

    return currentObject;
  },

  /**
   * @inheritDoc
   */
  toJsonValue: function(state, object) {
    var value = null;

    if (this.typeConstructor.isInstance(object)) {
      value = {};
      for (var iter = this.attributes(), item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        if (!attribute.isMetadata)
          value[attribute.name] = attribute.getJsonValue(state, object);
      }
    }

    return value;
  },

  /**
   * Converts ths type schema to json
   * @returns {Object}
   */
  toJSON: function() {
    var json = {};
    json['class'] = this.ref;

    if (this.superType)
      json['superClass'] = this.superType.ref;

    if (this.isEmbeddable)
      json['embedded'] = true;

    json['acl'] = {
      load: this.loadPermission,
      schemaAdd: this.schemaAddPermission,
      schemaReplace: this.schemaReplacePermission
    };

    var fields = json['fields'] = {};
    for (var i = 0, attribute; attribute = this.declaredAttributes[i]; i++) {
      if (!attribute.isMetadata)
        fields[attribute.name] = attribute;
    }

    return json;
  },

  /**
   * Returns iterator to get all referenced entities
   * @return {baqend.metamodel.ManagedType.ReferenceIterator}
   */
  references: function() {
    return new this.ReferenceIterator(this);
  },

  ReferenceIterator: Object.inherit({

    constructor: function ReferenceIterator(type) {
      this.type = type;
      this.attributes = this.type.attributes();
      this.embedded = [];
    },

    /**
     * @return {baqend.metamodel.Attribute}
     */
    next: function() {
      for (var iter = this.attributes, item; !(item = iter.next()).done; ) {
        var attribute = item.value;
        var type = attribute.isCollection ? attribute.elementType : attribute.type;
        if(type.isEntity) {
          return {done: false, value: {path: [attribute.name]}};
        } else if(type.isEmbeddable) {
          for (var emIter = type.references(), emItem; !(emItem = emIter.next()).done; ) {
            this.embedded.push({done: false, value: {path: [attribute.name].concat(emItem.value.path)}});
          }
        }
      }

      return this.embedded.length ? this.embedded.pop() : {done: true};
    }
  })
});

module.exports = ManagedType;
},{"../binding":16,"../collection":17,"../util/Permission":56,"../util/Validator":60,"./Type":47}],41:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');
var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.MapAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var MapAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.MapAttribute.prototype */ {

  extend: {
    ref: '/db/collection.Map'
  },

  collectionType: PluralAttribute.CollectionType.MAP,

  /**
   * @type baqend.metamodel.Type
   */
  keyType: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} keyType
   * @param {baqend.metamodel.Type} elementType
   */
  constructor: function MapAttribute(name, keyType, elementType) {
    PluralAttribute.call(this, name, elementType);

    this.keyType = keyType;
    this.typeConstructor = collection.Map;
  },

  /**
   * @inheritDoc
   */
  getJsonValue: function (state, object) {
    var value = this.getValue(object);

    if (value) {
      if (state._root && !value._metadata)
        Object.defineProperty(value, '_metadata', {value: {_root: state._root}});

      var json = {};
      for (var iter = value.entries(), item; !(item = iter.next()).done; ) {
        if (item.value[0] === null || item.value[1] === undefined)
          throw new PersistentError('Map keys can\'t be null nor undefined.');

        json[this.keyType.toJsonValue(state, item.value[0])] =
          this.elementType.toJsonValue(state, item.value[1]);
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @inheritDoc
   */
  setJsonValue: function (state, obj, json) {
    var value = null;
    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();
      }

      if (state._root && !value._metadata)
        Object.defineProperty(value, '_metadata', {value: {_root: state._root}});

      var copy = new this.typeConstructor(value);
      value.clear();

      for (var jsonKey in json) {
        // ensure that "false" keys will be converted to false
        var key = this.keyType.name == "Boolean"? jsonKey != "false": this.keyType.fromJsonValue(state, jsonKey);
        var val = this.elementType.fromJsonValue(state, json[jsonKey], copy.get(key));

        value.set(key, val);
      }
    }

    this.setValue(obj, value);
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: MapAttribute.ref + '[' + this.keyType.ref + ',' + this.elementType.ref + ']',
      order: this.order
    };
  }
});

module.exports = MapAttribute;
},{"../collection":17,"../error/PersistentError":28,"./PluralAttribute":44}],42:[function(require,module,exports){
var BasicType = require('./BasicType');
var ManagedType = require('./ManagedType');
var EntityType = require('./EntityType');
var Enhancer = require('../binding/Enhancer');
var ModelBuilder = require('./ModelBuilder');
var DbIndex = require('./DbIndex');
var Lockable = require('../util/Lockable');
var StatusCode = require('../connector/Message').StatusCode;

var message = require('../message');

/**
 * @class baqend.metamodel.Metamodel
 * @extends baqend.util.Lockable
 */
var Metamodel = Object.inherit(Lockable, /** @lends baqend.metamodel.Metamodel.prototype */ {

  /**
   * Defines if the Metamodel has been finalized
   * @type Boolean
   */
  isInitialized: false,

  /**
   * @type baqend.EntityManagerFactory
   * @private
   */
  entityManagerFactory: null,

  /**
   * @type Array.<baqend.metamodel.EntityType>
   */
  entities: null,

  /**
   * @type Array.<baqend.metamodel.EmbeddableType>
   */
  embeddables: null,

  /**
   * @type Array.<baqend.metamodel.BasicType>
   */
  baseTypes: null,

  constructor: function Metamodel(entityManagerFactory) {
    this._enhancer = new Enhancer();
    this.entityManagerFactory = entityManagerFactory;
  },

  /**
   * Prepare the Metamodel for custom schema creation
   * @param {Object=} jsonMetamodel initialize the metamodel with the serialized json schema
   */
  init: function(jsonMetamodel) {
    if (this.isInitialized) {
      throw new Error('Metamodel is already initialized.');
    }

    this.fromJSON(jsonMetamodel || []);
    this.isInitialized = true;
  },

  /**
   * @param {(Function|String)} arg
   * @return {String}
   */
  _getRef: function(arg) {
    var ref;
    if (String.isInstance(arg)) {
      ref = arg;

      if (ref.indexOf('/db/') != 0) {
        ref = '/db/' + arg;
      }
    } else {
      ref = this._enhancer.getIdentifier(arg);
    }

    return ref;
  },

  /**
   * Return the metamodel entity type representing the entity.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented entity
   * @returns {baqend.metamodel.EntityType} the metamodel entity type
   */
  entity: function(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.entities[ref] : null;
  },

  /**
   * Return the metamodel basic type representing the native class.
   * @param {(Function|String)} typeConstructor - the type of the represented native class
   * @returns {baqend.metamodel.BasicType} the metamodel basic type
   */
  baseType: function(typeConstructor) {
    var ref = null;
    if (String.isInstance(typeConstructor)) {
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
  },

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param {(Function|String)} typeConstructor - the type of the represented embeddable class
   * @returns {baqend.metamodel.EmbeddableType} the metamodel embeddable type
   */
  embeddable: function(typeConstructor) {
    var ref = this._getRef(typeConstructor);
    return ref ? this.embeddables[ref] : null;
  },

  /**
   * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
   *
   * @param {(Function|String)} typeConstructor - the type of the represented managed class
   * @returns {baqend.metamodel.Type} the metamodel managed type
   */
  managedType: function(typeConstructor) {
    return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
  },

  /**
   * @param {baqend.metamodel.Type} type
   * @return the added type
   */
  addType: function(type) {
    var types;

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
  },

  /**
   * Load all schema data from the server
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  load: function() {
    if(!this.isInitialized) {
      return this.withLock(function() {
        var msg = new message.GetAllSchemas();

        return this.entityManagerFactory.send(msg).then(function(message) {
          this.init(message.response.entity);
          return this;
        }.bind(this));
      }.bind(this));
    } else {
      throw new Error("Metamodel is already initialized.");
    }
  },

  /**
   * Store all local schema data on the server, or the provided one
   *
   * Note: The schema must be initialized, by init or load
   *
   * @param {baqend.metamodel.ManagedType=} managedType The specific type to persist, if omitted the complete schema will be updated
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  save: function(managedType) {
    return this._send(managedType || this.toJSON()).then(function() {
      return this;
    }.bind(this));
  },

  /**
   * The provided options object will be forwarded to the UpdateAllSchemas resource.
   * The underlying schema of this Metamodel object will be replaced by the result.
   *
   * @param {Object} data The JSON which will be send to the UpdateAllSchemas resource.
   * @returns {Promise<baqend.metamodel.Metamodel>}
   */
  update: function(data) {
    return this._send(data).then(function(message) {
      this.fromJSON(message.response.entity);
      return this;
    }.bind(this))
  },

  _send: function(data) {
    if (!this.isInitialized)
      throw new Error("Metamodel is not initialized.");

    return this.withLock(function() {
      var msg;
      if(ManagedType.isInstance(data)) {
        msg = new message.UpdateSchema(data.name, data.toJSON());
      } else {
        msg = new message.UpdateAllSchemas(data);
      }

      return this.entityManagerFactory.send(msg);
    }.bind(this));
  },

  /**
   * Get the current schema types as json
   * @returns {object} the json data
   */
  toJSON: function() {
    var json = [];

    for (var ref in this.entities) {
      json.push(this.entities[ref]);
    }

    for (ref in this.embeddables) {
      json.push(this.embeddables[ref]);
    }

    return json;
  },

  /**
   * Replace the current schema by the provided one in json
   * @param json The json schema data
   */
  fromJSON: function(json) {
    var builder = new ModelBuilder();
    var models = builder.buildModels(json);

    this.baseTypes = {};
    this.embeddables = {};
    this.entities = {};

    for (var ref in models) {
      var type = models[ref];
      this.addType(type);
    }
  },

  /**
   * Creates an index
   *
   * @param {String} bucket Name of the Bucket
   * @param {baqend.metamodel.DbIndex} index Will be applied for the given bucket
   * @return {Promise}
   */
  createIndex: function(bucket, index) {
    index.drop = false;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    return this.entityManagerFactory.send(msg);
  },

  /**
   * Drops an index
   *
   * @param {String} bucket Name of the Bucket
   * @param {baqend.metamodel.DbIndex} index Will be dropped for the given bucket
   * @return {Promise}
   */
  dropIndex: function(bucket, index) {
    index.drop = true;
    var msg = new message.CreateDropIndex(bucket, index.toJSON());
    return this.entityManagerFactory.send(msg);
  },

  /**
   * Drops all indexes
   *
   * @param bucket Indexes will be dropped for the given bucket
   * @returns {Promise}
   */
  dropAllIndexes: function(bucket) {
    var msg = new message.DropAllIndexes(bucket);
    return this.entityManagerFactory.send(msg);
  },

  /**
   * Loads all indexes for the given bucket
   *
   * @param bucket Current indexes will be loaded for the given bucket
   * @returns {Promise<Array<baqend.metamodel.DbIndex>>}
   */
  getIndexes: function(bucket) {
    var msg = new message.ListIndexes(bucket);
    return this.entityManagerFactory.send(msg).then(function(data) {
      return data.response.entity.map(function(el) {
        return new DbIndex(el.keys, el.unique);
      });
    }, function(e) {
      if (e.status == StatusCode.BUCKET_NOT_FOUND || e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    });
  }
});

module.exports = Metamodel;
},{"../binding/Enhancer":8,"../connector/Message":20,"../message":32,"../util/Lockable":52,"./BasicType":34,"./DbIndex":36,"./EntityType":38,"./ManagedType":40,"./ModelBuilder":43}],43:[function(require,module,exports){
var BasicType = require('./BasicType');
var EntityType = require('./EntityType');
var EmbeddableType = require('./EmbeddableType');

var ListAttribute = require('./ListAttribute');
var MapAttribute = require('./MapAttribute');
var SetAttribute = require('./SetAttribute');
var SingularAttribute = require('./SingularAttribute');

var PersistentError = require('../error/PersistentError');

/**
 * @class baqend.metamodel.ModelBuilder
 */
var ModelBuilder = Object.inherit( /** @lends baqend.metamodel.ModelBuilder.prototype */ {

  /**
   * @type Object<string,baqend.metamodel.ManagedType>
   */
  models: null,

  /**
   * @type Object<string,Object>
   */
  modelDescriptors: null,

  /**
   * @param {baqend.metamodel.Metamodel} metamodel
   */
  constructor: function ModelBuilder() {
    this.models = {};

    for (var typeName in BasicType) {
      if (BasicType.hasOwnProperty(typeName)) {
        var basicType = BasicType[typeName];
        if (basicType instanceof BasicType) {
          this.models[basicType.ref] = basicType;
        }
      }
    }
  },

  /**
   * @param {String} ref
   * @returns {baqend.metamodel.ManagedType}
   */
  getModel: function (ref) {
    if (ref in this.models) {
      return this.models[ref];
    } else {
      return this.models[ref] = this.buildModel(ref);
    }
  },

  /**
   * @param {Object} modelDescriptors
   * @returns {Object<string,baqend.metamodel.ManagedType>}
   */
  buildModels: function (modelDescriptors) {
    this.modelDescriptors = {};
    for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
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
  },

  /**
   * @param {String} ref
   * @returns {baqend.metamodel.ManagedType}
   */
  buildModel: function (ref) {
    var modelDescriptor = this.modelDescriptors[ref];
    var type;
    if (ref == EntityType.Object.ref) {
      type = new EntityType.Object();
    } else if (modelDescriptor) {
      if (modelDescriptor.embedded) {
        type = new EmbeddableType(ref)
      } else {
        var superTypeIdentifier = modelDescriptor['superClass'] || EntityType.Object.ref;
        type = new EntityType(ref, this.getModel(superTypeIdentifier));
      }
    } else {
      throw new TypeError('No model available for ' + ref);
    }

    if (modelDescriptor) {
      var permissions = modelDescriptor['acl'];
      for (var permission in permissions) {
        type[permission + 'Permission'].fromJSON(permissions[permission]);
      }
    }

    return type;
  },

  /**
   * @param {baqend.metamodel.EntityType} model
   */
  buildAttributes: function (model) {
    var modelDescriptor = this.modelDescriptors[model.ref];
    var fields = modelDescriptor['fields'];

    for (var name in fields) {
      var field = fields[name];
      if (!model.getAttribute(name)) //skip predefined attributes
        model.addAttribute(this.buildAttribute(field.name, field.type), field.order);
    }

    if(modelDescriptor.validationCode) {
      model.validationCode = modelDescriptor.validationCode;
    }
  },

  /**
   * @param {baqend.metamodel.EntityType} model
   * @param {String} name
   * @param {String} ref
   * @returns {baqend.metamodel.Attribute}
   */
  buildAttribute: function(name, ref) {
    if (ref.indexOf('/db/collection.') == 0) {
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
    } else {
      return new SingularAttribute(name, this.getModel(ref));
    }
  }
});

module.exports = ModelBuilder;
},{"../error/PersistentError":28,"./BasicType":34,"./EmbeddableType":37,"./EntityType":38,"./ListAttribute":39,"./MapAttribute":41,"./SetAttribute":45,"./SingularAttribute":46}],44:[function(require,module,exports){
var Attribute = require('./Attribute');

/**
 * @class baqend.metamodel.PluralAttribute
 * @extends baqend.metamodel.Attribute
 */
var PluralAttribute = Attribute.inherit(/** @lends baqend.metamodel.PluralAttribute.prototype */{
  /**
   * @lends baqend.metamodel.PluralAttribute
   */
  extend: {
    /**
     * @enum {number}
     */
    CollectionType: {
      COLLECTION: 0,
      LIST: 1,
      MAP: 2,
      SET: 3
    }
  },

  /**
   * @type Function
   */
  typeConstructor: null,

  persistentAttributeType: Attribute.PersistentAttributeType.ELEMENT_COLLECTION,

  /**
   * @type baqend.metamodel.Type
   */
  elementType: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor: function PluralAttribute(name, elementType) {
    Attribute.call(this, name);
    this.elementType = elementType;
  },

  /**
   * @inheritDoc
   */
  getJsonValue: function (state, object) {
    var value = this.getValue(object);

    if (this.typeConstructor.isInstance(value)) {
      // convert normal collections to tracked collections
      if (state._root && !value._metadata)
        Object.defineProperty(value, '_metadata', {value: {_root: state._root}});

      var json = [];
      for (var iter = value.values(), item; !(item = iter.next()).done; ) {
        json.push(this.elementType.toJsonValue(state, item.value));
      }

      return json;
    } else {
      return null;
    }
  },

  /**
   * @inheritDoc
   */
  setJsonValue: function (state, obj, json) {
    var value = null;

    if (json) {
      value = this.getValue(obj);

      if (!this.typeConstructor.isInstance(value)) {
        value = new this.typeConstructor();
      }

      if (state._root && !value._metadata)
        Object.defineProperty(value, '_metadata', {value: {_root: state._root}});

      var items = value.array;
      value.array = [];

      for (var i = 0, len = json.length; i < len; ++i) {
        value.add(this.elementType.fromJsonValue(state, json[i], items[i]));
      }
    }

    this.setValue(obj, value);
  }
});

module.exports = PluralAttribute;
},{"./Attribute":33}],45:[function(require,module,exports){
var PluralAttribute = require('./PluralAttribute');
var collection = require('../collection');
var SetAttribute;

/**
 * @class baqend.metamodel.SetAttribute
 * @extends baqend.metamodel.PluralAttribute
 */
var SetAttribute = PluralAttribute.inherit(/** @lends baqend.metamodel.SetAttribute.prototype */ {

  extend: {
    ref: '/db/collection.Set'
  },

  collectionType: PluralAttribute.CollectionType.SET,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} elementType
   */
  constructor: function SetAttribute(name, elementType) {
    PluralAttribute.call(this, name, elementType);

    this.typeConstructor = collection.Set;
  },

  /**
   * {@inheritDoc}
   * @returns {Object} {@inheritDoc}
   */
  toJSON: function() {
    return {
      name: this.name,
      type: SetAttribute.ref + '[' + this.elementType.ref + ']',
      order: this.order
    };
  }
});

module.exports = SetAttribute;
},{"../collection":17,"./PluralAttribute":44}],46:[function(require,module,exports){
var Attribute = require('./Attribute');
var Type = require('./Type');

/**
 * @class baqend.metamodel.SingularAttribute
 * @extends baqend.metamodel.Attribute
 */
var SingularAttribute = Attribute.inherit(/** @lends baqend.metamodel.SingularAttribute.prototype */ {

  get typeConstructor() {
    return this.type.typeConstructor;
  },

  /**
   * @type baqend.metamodel.Type
   */
  type: null,

  /**
   * @param {String} name
   * @param {baqend.metamodel.Type} type
   * @param {Boolean=} isMetadata
   */
  constructor: function SingularAttribute(name, type, isMetadata) {
    Attribute.call(this, name, isMetadata);

    this.type = type;

    switch (type.persistenceType) {
      case Type.PersistenceType.BASIC:
        this.persistentAttributeType = Attribute.PersistentAttributeType.BASIC;
        break;
      case Type.PersistenceType.EMBEDDABLE:
        this.persistentAttributeType = Attribute.PersistentAttributeType.EMBEDDED;
        break;
      case Type.PersistenceType.ENTITY:
        this.persistentAttributeType = Attribute.PersistentAttributeType.ONE_TO_MANY;
        break;
    }
  },

  /**
   * @inheritDoc
   */
  getJsonValue: function(state, object) {
    return this.type.toJsonValue(state, this.getValue(object));
  },

  /**
   * @inheritDoc
   */
  setJsonValue: function(state, object, jsonValue) {
    this.setValue(object, this.type.fromJsonValue(state, jsonValue, this.getValue(object)));
  },

  /**
   * @inheritDoc
   */
  toJSON: function() {
    return {
      name: this.name,
      type: this.type.ref,
      order: this.order
    }
  }
});

module.exports = SingularAttribute;
},{"./Attribute":33,"./Type":47}],47:[function(require,module,exports){
/**
 * @class baqend.metamodel.Type
 */
var Type = Object.inherit(/** @lends baqend.metamodel.Type.prototype */ {
  /**
   * @lends baqend.metamodel.Type
   */
  extend: {
    /**
     * @enum {number}
     */
    PersistenceType: {
      BASIC: 0,
      EMBEDDABLE: 1,
      ENTITY: 2,
      MAPPED_SUPERCLASS: 3
    }
  },

  /**
   * @type Boolean
   */
  get isBasic() {
    return this.persistenceType == Type.PersistenceType.BASIC;
  },

  /**
   * @type Boolean
   */
  get isEmbeddable() {
    return this.persistenceType == Type.PersistenceType.EMBEDDABLE;
  },

  /**
   * @type Boolean
   */
  get isEntity() {
    return this.persistenceType == Type.PersistenceType.ENTITY;
  },

  /**
   * @type Boolean
   */
  get isMappedSuperclass() {
    return this.persistenceType == Type.PersistenceType.MAPPED_SUPERCLASS;
  },

  /**
   * @type Number
   */
  persistenceType: -1,

  /**
   * @type Function
   */
  get typeConstructor() {
    return this._typeConstructor;
  },

  /**
   * @param {Function} typeConstructor
   */
  set typeConstructor(typeConstructor) {
    if(this._typeConstructor) {
      throw new Error("typeConstructor has already been set.")
    }
    this._typeConstructor = typeConstructor;
  },

  /**
   * @type String
   */
  ref: null,

  /**
   * @type String
   */
  name: null,

  /**
   * @param {String} ref
   * @param {Function} typeConstructor
   */
  constructor: function Type(ref, typeConstructor) {
    if (ref.indexOf("/db/") != 0) {
      throw new SyntaxError("Type ref " + ref + " is invalid.");
    }

    this.ref = ref;
    this.name = ref.substring(4);
    this._typeConstructor = typeConstructor;
  },

  /**
   * Merge the json data into the current object instance and returns the merged object
   * @param {baqend.util.Metadata} state The root object state
   * @param {Object} jsonValue The json data to merge
   * @param {*=} currentValue The object where the jsonObject will be merged into, if the current object is null,
   *  a new instance will be created
   * @return {*} The merged object instance
   * @abstract
   */
  fromJsonValue: function(state, jsonValue, currentValue) {},

  /**
   * Converts the given object to json
   * @param {baqend.util.Metadata} state The root object state
   * @param {*} object The object to convert
   * @return {Object} The converted object as json
   * @abstract
   */
  toJsonValue: function(state, object) {}
});

module.exports = Type;
},{}],48:[function(require,module,exports){
/**
 * @namespace baqend.metamodel
 */

var Metamodel = require('./Metamodel');

Metamodel.prototype.Attribute = require('./Attribute');
Metamodel.prototype.BasicType = require('./BasicType');
Metamodel.prototype.CollectionAttribute = require('./CollectionAttribute');
Metamodel.prototype.EmbeddableType = require('./EmbeddableType');
Metamodel.prototype.EntityType = require('./EntityType');
Metamodel.prototype.ListAttribute = require('./ListAttribute');
Metamodel.prototype.ManagedType = require('./ManagedType');
Metamodel.prototype.MapAttribute = require('./MapAttribute');
Metamodel.prototype.Metamodel = require('./Metamodel');
Metamodel.prototype.ModelBuilder = require('./ModelBuilder');
Metamodel.prototype.PluralAttribute = require('./PluralAttribute');
Metamodel.prototype.SetAttribute = require('./SetAttribute');
Metamodel.prototype.SingularAttribute = require('./SingularAttribute');
Metamodel.prototype.Type = require('./Type');
Metamodel.prototype.DbIndex = require('./DbIndex');

exports = module.exports = new Metamodel();

},{"./Attribute":33,"./BasicType":34,"./CollectionAttribute":35,"./DbIndex":36,"./EmbeddableType":37,"./EntityType":38,"./ListAttribute":39,"./ManagedType":40,"./MapAttribute":41,"./Metamodel":42,"./ModelBuilder":43,"./PluralAttribute":44,"./SetAttribute":45,"./SingularAttribute":46,"./Type":47}],49:[function(require,module,exports){
/******
 * START - BIND POLYFILL
 *****/
Function.prototype.bind = Function.prototype.bind || function (oThis) {
  if (typeof this !== "function") {
    // closest thing possible to the ECMAScript 5
    // internal IsCallable function
    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
  }

  var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {},
      fBound = function () {
        return fToBind.apply(this instanceof fNOP && oThis
                ? this
                : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments)));
      };

  fNOP.prototype = this.prototype;
  fBound.prototype = new fNOP();

  return fBound;
};
/******
 * END - BIND POLYFILL
 *****/
},{}],50:[function(require,module,exports){
var Permission = require('./Permission');

/**
 * @class baqend.Acl
 *
 * @classdesc Creates a new Acl object, with an empty rule set for an object
 * @param {baqend.util.Metadata} metadata the metadata of the object
 */
var Acl = Object.inherit(/** @lends baqend.Acl.prototype */ {

  /**
   * The read permission of the object
   * @type baqend.util.Permission
   */
  read: null,

  /**
   * The write permission of the object
   * @type baqend.util.Permission
   */
  write: null,

  constructor: function Acl(metadata) {
    this.read = new Permission(metadata);
    this.write = new Permission(metadata);
  },

  /**
   * Removes all acl rules, read and write access is public afterwards
   */
  clear: function() {
    this.read.clear();
    this.write.clear();
  },

  /**
   * Gets whenever all users and roles have the permission to read the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicReadAllowed: function() {
    return this.read.isPublicAllowed();
  },

  /**
   * Sets whenever all users and roles should have the permission to read the object.
   * Note: All other allow read rules will be removed.
   */
  setPublicReadAllowed: function() {
    return this.read.setPublicAllowed();
  },

  /**
   * Checks whenever the user or role is explicit allowed to read the object.
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isReadAllowed: function(userOrRole) {
    return this.read.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to read the object
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isReadDenied: function(userOrRole) {
    return this.read.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to read the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to allow
   * @return {baqend.Acl} this acl object
   */
  allowReadAccess: function(userOrRole) {
    this.read.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to read the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to deny
   * @return {baqend.Acl} this acl object
   */
  denyReadAccess: function(userOrRole) {
    this.read.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any read allow/deny rule for the given user or role
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role
   * @return {baqend.Acl} this acl object
   */
  deleteReadAccess: function(userOrRole) {
    this.read.deleteAccess(userOrRole);
    return this;
  },

  /**
   * Gets whenever all users and roles have the permission to write the object
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicWriteAllowed: function() {
    return this.write.isPublicAllowed();
  },

  /**
   * Sets whenever all users and roles should have the permission to write the object.
   * Note: All other allow write rules will be removed.
   */
  setPublicWriteAllowed: function() {
    return this.write.setPublicAllowed();
  },

  /**
   * Checks whenever the user or role is explicit allowed to write the object.
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteAllowed: function(userOrRole) {
    return this.write.isAllowed(userOrRole);
  },

  /**
   * Checks whenever the user or role is explicit denied to write the object
   *
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to check for
   */
  isWriteDenied: function(userOrRole) {
    return this.write.isDenied(userOrRole);
  },

  /**
   * Allows the given user or rule to write the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to allow
   * @return {baqend.Acl} this acl object
   */
  allowWriteAccess: function(userOrRole) {
    this.write.allowAccess(userOrRole);
    return this;
  },

  /**
   * Denies the given user or rule to write the object
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role to deny
   * @return {baqend.Acl} this acl object
   */
  denyWriteAccess: function(userOrRole) {
    this.write.denyAccess(userOrRole);
    return this;
  },

  /**
   * Deletes any write allow/deny rule for the given user or role
   * @param {baqend.binding.User|baqend.binding.Role|String} userOrRole The user or role
   * @return {baqend.Acl} this acl object
   */
  deleteWriteAccess: function(userOrRole) {
    this.write.deleteAccess(userOrRole);
    return this;
  },

  /**
   * A Json representation of the set of rules
   * @return {object}
   */
  toJSON: function() {
    return {
      read: this.read,
      write: this.write
    };
  },

  /**
   * Sets the acl rules form json
   * @param {object} json The json encoded acls
   */
  fromJSON: function(json) {
    this.read.fromJSON(json.read || {});
    this.write.fromJSON(json.write || {});
  }

});

module.exports = Acl;
},{"./Permission":56}],51:[function(require,module,exports){
var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

/**
 * @class baqend.util.Code
 * @param {baqend.metamodel.Metamodel} metamodel
 */
var Code = Object.inherit(/** @lends baqend.util.Code.prototype */ {

  /**
   * @type baqend.EntityManagerFactory
   */
  entityManagerFactory: null,

  /**
   * @type baqend.metamodel.Metamodel
   * @private
   */
  _metamodel: null,

  constructor: function Code(metamodel, entityManagerFactory) {
    this._metamodel = metamodel;
    this.entityManagerFactory = entityManagerFactory;
  },

  /**
   * Converts the given function to a string
   * @param {Function} fn The JavaScript function to serialize
   * @return {String} The serialized function
   */
  functionToString: function(fn) {
    if(!fn)
      return "";

    var str = fn.toString();
    str = str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
    if (str.charAt(0) == '\n')
      str = str.substring(1);

    if (str.charAt(str.length - 1) == '\n')
      str = str.substring(0, str.length - 1);

    return str;
  },

  /**
   * Converts the given string to a module wrapper function
   * @param {Array<String>} signature The expected parameters of the function
   * @param {String} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */
  stringToFunction: function(signature, code) {
    return new Function(signature, code);
  },

  /**
   * Loads a list of all available baqend modules
   * Does not include handlers
   *
   * @returns {Promise<Array<String>>}
   */
  loadModules: function() {
    var msg = new message.GetAllModules();
    return this.entityManagerFactory.send(msg).then(function(data) {
      return data.response.entity;
    });
  },

  /**
   * Loads Baqend code which will be identified by the given bucket and code codeType
   *
   * @param {baqend.metamodel.ManagedType|String} type The entity type for the baqend handler or the Name of the
   * Baqend code
   * @param {String} codeType The type of the code
   * @param {boolean} [asFunction=false] set it to <code>true</code>, to parse the code as a function and return it
   * instead of a string
   * @returns {Promise<Function|String>} The baqend code as string or as a parsed function
   */
  loadCode: function(type, codeType, asFunction) {
    var bucket = String.isInstance(type)? type: type.name;
    var msg = new message.GetBaqendCode(bucket, codeType);

    return this.entityManagerFactory.send(msg).then(function(msg) {
      return this._parseCode(bucket, codeType, asFunction, msg.response.entity);
    }.bind(this), function(e) {
      if (e.status == StatusCode.OBJECT_NOT_FOUND)
        return null;

      throw e;
    });
  },

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param {baqend.metamodel.ManagedType|String} type The entity type for the baqend handler or the Name of the
   * Baqend code
   * @param {String} codeType The type of the code
   * @param {String|Function} fn Baqend code as a string or function
   * @returns {Promise<Function|String>} The stored baqend code as a string or as a parsed function
   */
  saveCode: function(type, codeType, fn) {
    var bucket = String.isInstance(type)? type: type.name;
    var asFunction = Function.isInstance(fn);

    var msg = new message.SetBaqendCode(bucket, codeType, asFunction? this.functionToString(fn): fn);
    return this.entityManagerFactory.send(msg).then(function(msg) {
      return this._parseCode(bucket, codeType, asFunction, msg.response.entity);
    }.bind(this));
  },

  /**
   * Deletes Baqend code identified by the given bucket and code type
   *
   * @param {baqend.metamodel.ManagedType|String} type The entity type for the baqend handler or the Name of the
   * Baqend code
   * @param {String} codeType The type of the code
   * @returns {Promise<void>} succeed if the code was deleted
   */
  deleteCode: function(type, codeType) {
    var bucket = String.isInstance(type)? type: type.name;
    var msg = new message.DeleteBaqendCode(bucket, codeType);
    return this.entityManagerFactory.send(msg).then(function() {
      return this._parseCode(bucket, codeType, false, null);
    }.bind(this));
  },

  _parseCode: function(bucket, codeType, asFunction, code) {
    if (codeType == 'validate') {
      var type = this._metamodel.entity(bucket);
      type.validationCode = code;
      return asFunction? type.validationCode: code;
    } else {
      return asFunction? this.stringToFunction(['module', 'exports'], code): code;
    }
  }
});

module.exports = Code;

},{"../connector/Message":20,"../message":32}],52:[function(require,module,exports){
/**
 * This mixin provides an lock interface to execute exclusive operations
 *
 * @class baqend.util.Lockable
 */
var Lockable = Trait.inherit(/** @lends baqend.util.Lockable.prototype */{

  /**
   * Indicates if there is currently an onging exclusive operation
   * @type Boolean
   * @private
   */
  _isLocked: false,

  /**
   * A promise which represents the state of the least exclusive operation
   * @type Promise
   * @private
   */
  _readyPromise: Promise.resolve(null),

  /**
   * A deferred used to explicit lock and unlock this instance
   * @private
   */
  _deferred: null,

  /**
   * Indicates if there is currently no exclusive operation executed
   * <code>true</code> If no exclusive lock is hold
   * @type {Boolean}
   */
  get isReady() {
    return !this._isLocked;
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {baqend.util.Lockable~callback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @param {baqend.util.Lockable~callback=} failCallback When the lock can't be released caused by a none
   * recoverable error
   * @return {Promise<baqend.util.Lockable>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready: function(doneCallback, failCallback) {
    return this._readyPromise.then(doneCallback, failCallback);
  },

  /**
   * Try to aquire an exclusive lock and executes the given callback.
   * @param {baqend.util.Lockable~callback} callback The exclusive operation to execute
   * @param {Boolean} [critical=false] Indicates if the operation is critical. If the operation is critical and the
   * operation fails, then the lock will not be released
   * @return {Promise<baqend.util.Lockable>} A promise
   * @throws {Error} If the lock can't be aquired
   * @protected
   */
  withLock: function(callback, critical) {
    if(this._isLocked)
      throw new Error('Current operation has not been finished.');

    var self = this;
    try {
      this._isLocked = true;
      var result = callback().then(function(result) {
        self._isLocked = false;
        return result;
      }, function(e) {
        if (!critical)
          self._isLocked = false;
        throw e;
      });

      this._readyPromise = result.then(function() {
        return self;
      }, function(e) {
        if (!critical)
          return self;
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
  }
});

module.exports = Lockable;

/**
 * The operation callback is used by the {@link baqend.util.Lockable#withLock} method,
 * to perform an exclusive operation on the baqend.
 * @callback baqend.util.Lockable~callback
 * @return {Promise<*>} A Promise, which reflects the result of the operation
 */
},{}],53:[function(require,module,exports){

var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

/**
 * @class baqend.util.Logger
 */
var Logger = Object.inherit(/** @lends baqend.util.Logger.prototype */ {

  /** @lends baqend.util.Logger */
  extend: {
    LEVELS: ['trace', 'debug', 'info', 'warn', 'error'],
    FORMAT_REGEXP: /%[sdj%]/g,

    create: function(entityManager) {
      var proto = this.prototype;

      function Logger() {
        proto.log.apply(Logger, arguments);
      }

      Object.cloneOwnProperties(Logger, proto);
      Logger._init(entityManager);

      return Logger;
    }
  },

  /**
   * @type baqend.EntityManager
   */
  entityManager: null,
  levelIndex: 2,

  get level() {
    return Logger.LEVELS[this.levelIndex];
  },

  set level(level) {
    var index = Logger.LEVELS.indexOf(level);
    if (index == -1)
      throw new Error("Unknown logging level " + level);

    this.levelIndex = index;
  },

  /**
   * Logs a message with the given log level
   * @param {String} [level='info'] The level used to log the message
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  log: function(level, message, data) {
    var args = Array.prototype.slice.call(arguments);

    if (Logger.LEVELS.indexOf(args[0]) == -1) {
      level = 'info';
    } else {
      level = args.shift();
    }

    if (this.levelIndex > Logger.LEVELS.indexOf(level))
      return;

    message = this._format(args.shift(), args);
    data = null;
    if (args.length && typeof args[args.length - 1] === 'object') {
      data = args.pop();
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
  },

  _format: function(f, args) {
    if (args.length == 0)
      return f;

    var str = String(f).replace(Logger.FORMAT_REGEXP, function(x) {
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
  },

  _init: function(entityManager) {
    this.entityManager = entityManager;

    Logger.LEVELS.forEach(function(level) {
      this[level] = this.log.bind(this, level);
    }.bind(this));
  },

  _log: function(json) {
    if (!this.entityManager.isReady) {
      return this.entityManager.ready(this._log.bind(this, json));
    } else {
      return this.entityManager._send(new message.CreateObject('logs.AppLog', json));
    }
  }

  /**
   * Log message at trace level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function trace
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at debug level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function debug
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at info level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function info
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at warn level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function warn
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at error level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function error
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
});
module.exports = Logger;
},{"../connector/Message":20,"../message":32}],54:[function(require,module,exports){
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
},{"../":31,"../error/PersistentError":28,"./Acl":50,"./Lockable":52}],55:[function(require,module,exports){
var message = require('../message');

/**
 * @class baqend.util.Modules
 */
var Modules = Object.inherit(/** @lends baqend.util.Modules.prototype */ {

  /**
   * @type baqend.EntityManager
   * @private
   */
  _entityManager: null,

  /**
   * The connector used for baqend requests
   * @type baqend.connector.Connector
   * @private
   */
  _connector: null,

  /**
   * @param {baqend.EntityManager} entityManager
   * @param {baqend.connector.Connector} connector
   */
  constructor: function Modules(entityManager, connector) {
    this._entityManager = entityManager;
    this._connector = connector;
  },

  /**
   * Calls the baqend module, which is identified by the given bucket.
   * The optional query parameter will be attached as GET-parameters.
   *
   * @param {String} bucket Name of the baqend module
   * @param {Object|String=} query GET-Parameter as key-value-pairs or query string
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  get: function(bucket, query, doneCallback, failCallback) {
    if(Function.isInstance(query)) {
      failCallback = doneCallback;
      doneCallback = query;
      query = null;
    }

    var msg = new message.GetBaqendModule(bucket);
    msg.addQueryString(query);

    return this._send(msg, doneCallback, failCallback);
  },

  /**
   * Calls the baqend module, which is identified by the given bucket.
   *
   * @param {String} bucket Name of the baqend module
   * @param {Object|String} body Body of the POST-request
   * @param {Function=} doneCallback
   * @param {Function=} failCallback
   * @returns {Promise<Object>}
   */
  post: function(bucket, body, doneCallback, failCallback) {
    var msg = new message.PostBaqendModule(bucket, body);

    return this._send(msg, doneCallback, failCallback);
  },

  _send: function(msg, doneCallback, failCallback) {
    return this._entityManager._send(msg).then(function(code) {
      return code.response.entity;
    }).then(doneCallback, failCallback);
  }
});

module.exports = Modules;

},{"../message":32}],56:[function(require,module,exports){
/**
 * @class baqend.util.Permission
 */
var Permission = Object.inherit(/** @lends baqend.util.Permission.prototype */ {

  /**
   * @type baqend.util.Metadata
   * @private
   */
  _metadata: null,

  /**
   * The set of rules
   * @type object
   * @private
   */
  _rules: null,

  /**
   * Creates a new Permission object, with an empty rule set
   * @param {baqend.util.Metadata} metadata The metadata of the object
   */
  constructor: function Permission(metadata) {
    this._rules = {};
    this._metadata = metadata;
  },

  /**
   * Returns a list of user and role references of all rules
   * @return {String[]} a list of references
   */
  allRules: function() {
    return Object.keys(this._rules);
  },

  /**
   * Removes all rules from this permission object
   */
  clear: function() {
    this._metadata && this._metadata.writeAccess();
    this._rules = {};
  },

  /**
   * Gets whenever all users and roles have the permission to perform the operation
   * @return {boolean} <code>true</code> If public access is allowed
   */
  isPublicAllowed: function() {
    if ('*' in this._rules)
      return false;

    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        return false;
      }
    }

    return true;
  },

  /**
   * Sets whenever all users and roles should have the permission to perform the operation.
   * Note: All other allow rules will be removed.
   */
  setPublicAllowed: function() {
    this._metadata && this._metadata.writeAccess();
    for (var ref in this._rules) {
      if (this._rules[ref] == 'allow') {
        delete this._rules[ref];
      }
    }
  },

  /**
   * Returns the actual rule of the given user or role.
   * @param userOrRole The user or role to check for
   * @return {String|undefined} The actual access rule
   */
  getRule: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)];
  },

  /**
   * Checks whenever the user or role is explicit allowed to perform the operation.
   *
   * @param userOrRole The user or role to check for
   */
  isAllowed: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'allow';
  },

  /**
   * Checks whenever the user or role is explicit denied to perform the operation.
   *
   * @param userOrRole The user or role to check for
   */
  isDenied: function(userOrRole) {
    return this._rules[this._getRef(userOrRole)] == 'deny';
  },

  /**
   * Allows the given user or rule to perform the operation
   * @param userOrRole The user or role to allow
   * @return {baqend.util.Permission} this permission object
   */
  allowAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'allow';
    return this;
  },

  /**
   * Denies the given user or rule to perform the operation
   * @param userOrRole The user or role to deny
   * @return {baqend.util.Permission} this permission object
   */
  denyAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    this._rules[this._getRef(userOrRole)] = 'deny';
    return this;
  },

  /**
   * Deletes any allow/deny rule for the given user or role
   * @param userOrRole The user or role
   * @return {baqend.util.Permission} this permission object
   */
  deleteAccess: function(userOrRole) {
    this._metadata && this._metadata.writeAccess();
    delete this._rules[this._getRef(userOrRole)];
    return this;
  },

  /**
   * A Json representation of the set of rules
   * @return {object}
   */
  toJSON: function() {
    return this._rules;
  },

  /**
   * Sets the permission rules from json
   * @param {object} json The permission json representation
   */
  fromJSON: function(json) {
    this._rules = json;
  },

  /**
   * Resolves user and role references and validate given references
   * @param userOrRole The user, role or reference
   * @return {String} The resolved and validated reference
   * @private
   */
  _getRef: function(userOrRole) {
    if (!String.isInstance(userOrRole)) {
      userOrRole = userOrRole._metadata.id;
    }

    if (userOrRole.indexOf('/db/User/') == 0 || userOrRole.indexOf('/db/Role/') == 0) {
      return userOrRole;
    }

    throw new TypeError('The given object isn\'t a user, role or a valid reference.');
  }

});

module.exports = Permission;
},{}],57:[function(require,module,exports){
var Set = require('../collection').Set;
var List = require('../collection').List;
var Metadata = require('./Metadata');
var Entity = require('../binding/Entity');


/**
 * @class baqend.util.PushMessage
 */
var PushMessage = Object.inherit(/** @lends baqend.util.PushMessage.prototype */ {

  /**
   * Set of devices
   * @type Set<baqend.binding.Entity>
   */
  devices: null,

  /**
   * push notification message
   * @type String
   */
  message: null,

  /**
   * push notification subject
   * @type String
   */
  subject: null,

  /**
   * push notification sound
   * @type String
   */
  sound: null,

  /**
   * badge count
   * @type Number
   */
  badge: 0,

  /**
   * data object
   * @type Object
   */
  data: null,

  /**
   * Push message will be used to send a push notification to a set of devices
   *
   * @param {Set<baqend.binding.Entity>|List<baqend.binding.Entity>|Array=} devices The Set of device references which
   * will receive this push notification.
   * @param {String=} message The message of the push notification.
   * @param {String=} subject The subject of the push notification.
   * @param {String=} sound The file reference of the sound file as a string. The device uses this file as the
   * notification sound.
   * @param {Number=} badge The badge count.
   * @param {Object=} data The data object which can contain additional information.
   * @constructor
   */
  constructor: function PushMessage(devices, message, subject, sound, badge, data) {
    if(Array.isInstance(devices) || List.isInstance(devices) || !devices) {
      this.devices = new Set(devices);
    } else if(Entity.isInstance(devices)) {
      this.devices = new Set();
      this.devices.add(devices);
    } else if(!Set.isInstance(devices)) {
      throw new Error("Only Sets, Lists and Arrays can be used as devices.")
    }

    this.message = message;
    this.subject = subject;
    this.sound = sound;
    this.badge = badge;
    this.data = data;
  },


  /**
   * Adds a new object to the set of devices
   *
   * @param {baqend.binding.Entity} device will be added to the device set to receive the push notification
   */
  addDevice: function(device) {
    if(!this.devices) {
      this.devices = new Set();
    } else if(Array.isInstance(this.devices)) {
      this.devices = new Set(this.devices);
    }

    this.devices.add(device);
  },

  toJSON: function() {
    if(Array.isInstance(this.devices) || List.isInstance(this.devices))
      this.devices = new Set(this.devices);

    if(!this.devices || !this.devices.size)
      throw new Error("Set of devices is empty.");

    return Object.extend(Object.extend({}, this), {
      devices: this.devices.map(function(device) {
        return device.id;
      })
    });
  }
});

module.exports = PushMessage;
},{"../binding/Entity":9,"../collection":17,"./Metadata":54}],58:[function(require,module,exports){
var hmac = require('./hmac');

/**
 * @class baqend.util.TokenStorage
 */
var TokenStorage = Object.inherit( /** @lends baqend.util.TokenStorage */ {
  constructor: function TokenStorage() {
    /**
     * The actual token storage
     * @type Object<String,String>
     */
    this.tokens = {};
  },

  /**
   * Get the stored token for the given origin
   * @param {string} origin The origin of the token
   * @returns {string} The token or undefined, if no token is available for the origin
   */
  get: function(origin) {
    return this.tokens[origin] || null;
  },

  /**
   * Update the token for the givin origin
   * @param {string} origin The origin of the token
   * @param {string|null} token The token to store, <code>null</code> to remove the token
   */
  update: function(origin, token) {
    if (token) {
      this.tokens[origin] = token;
    } else {
      delete this.tokens[origin];
    }
  },

  /**
   * Derived a resource token from the the stored origin token for the resource
   * @param {string} origin The origin of the token which is used to drive the resource token from
   * @param {string} resource The resource which will be accessible with the returned token
   * @returns {String} A resource token which can only be used to access the specified resource
   */
  createResourceToken: function(origin, resource) {
    var token = this.get(origin);
    if (token) {
      var data = token.substring(0, token.length - 40);
      var sig = token.substring(data.length);
      return data + hmac(resource + data, sig);
    }
    return null;
  }
});

TokenStorage.GLOBAL = new TokenStorage();

try {
  if (typeof localStorage != "undefined") {
    TokenStorage.WEB_STORAGE = new (TokenStorage.inherit({
      constructor: function TokenWebStorage() {},
      get: function(origin) {
        return sessionStorage.getItem('BAT:' + origin) || localStorage.getItem('BAT:' + origin);
      },
      update: function(origin, token, useLocalStorage) {
        if (useLocalStorage === undefined)
          useLocalStorage = typeof localStorage.getItem('BAT:' + origin) == "string";

        var webStorage = useLocalStorage? localStorage: sessionStorage;
        if (typeof token === "string") {
          webStorage.setItem('BAT:' + origin, token);
        } else {
          webStorage.removeItem('BAT:' + origin);
        }
      }
    }));
  }
} catch (e) {
  //firefox throws an exception if we try to access the localStorage while cookies are disallowed
}

module.exports = TokenStorage;
},{"./hmac":61}],59:[function(require,module,exports){
/**
 * @class baqend.util.ValidationResult
 */
var ValidationResult = Object.inherit(/** @lends baqend.util.ValidationResult.prototype */ {

  fields: null,

  get isValid() {
    for (var key in this.fields) {
      if(!this.fields[key].isValid) {
        return false;
      }
    }
    return true;
  },

  constructor: function ValidationResult() {
    this.fields = {};
  },

  toJSON: function() {
    var json = {};
    for(var key in this.fields) {
      json[key] = this.fields[key].toJSON();
    }
    return json;
  }
});

module.exports = ValidationResult;
},{}],60:[function(require,module,exports){
var valLib = require('validator');
var ValidationResult = require('./ValidationResult');

/**
 * @class baqend.util.Validator
 */
var Validator = Object.inherit(/** @lends baqend.util.Validator.prototype */ {

  extend: {
    initialize: function() {
      Object.keys(valLib).forEach(function(name) {
        if (typeof valLib[name] == 'function' && name !== 'toString' &&
            name !== 'toDate' && name !== 'extend' && name !== 'init') {

          this.prototype[name] = function(error) {
            //noinspection JSPotentiallyInvalidUsageOfThis
            return this._callMethod(name, error || name, Array.prototype.slice.call(arguments, error? 1: 0));
          }

        }
      }.bind(this));
    },

    /**
     * Compiles the given validation code for the managedType
     * @param {baqend.metamodel.ManagedType} managedType The managedType of the code
     * @param {String} validationCode The validation code
     */
    compile: function(managedType, validationCode) {
      var keys = [];
      for (var iter = managedType.attributes(), item; !(item = iter.next()).done; ) {
        keys.push(item.value.name);
      }

      var fn = new Function(keys, validationCode);
      return function onValidate(argObj) {
        var args = keys.map(function(name) {
          return argObj[name];
        });

        return fn.apply({}, args);
      }
    }
  },

  /**
   * Name of the attribute
   * @type String
   */
  key: null,

  /**
   * Result of the validation
   * @type Array
   */
  errors: null,

  /**
   * Entity to get the value of the attribute
   * @type {baqend.binding.Entity}
   * @private
   */
  _entity: null,

  /**
   * Gets the value of the attribute
   * @return {*} Value
   */
  get value() {
    return this._entity[this.key];
  },

  /**
   * Checks if the attribute is valid
   * @return {Boolean}
   */
  get isValid() {
    return this.errors.length == 0;
  },

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param {String=} error The error message which will be used if the value is invalid
   * @param {Function} fn will be used to validate the value
   * @returns {baqend.util.Validator}
   */
  is: function(error, fn) {
    if(Function.isInstance(error)) {
      fn = error;
      error = 'is';
    }
    if(fn(this.value, valLib) === false) {
      this.errors.push(error);
    }
    return this;
  },

  constructor: function Validator(key, entity) {
    this.key = key;
    this._entity = entity;
    this.errors = [];
  },

  _callMethod: function(method, error, args) {
    args = args || [];
    args.unshift(this.value);
    if(valLib[method].apply(this, args) === false) {
      this.errors.push(error);
    }
    return this;
  },

  toString: function() {
    return this.value;
  },

  toJSON: function() {
    return {
      isValid: this.isValid,
      errors: this.errors
    }
  }
});

module.exports = Validator;
},{"./ValidationResult":59,"validator":71}],61:[function(require,module,exports){
/*
 * TODO: Remove this if browerify 12+ is supported by grunt-browserify
 */
module.exports = require('crypto-js/hmac-sha1');
},{"crypto-js/hmac-sha1":64}],62:[function(require,module,exports){
/**
 * @namespace baqend.util
 */
exports.Metadata = require('./Metadata');
exports.Permission = require('./Permission');
exports.Acl = require('./Acl');
exports.Validator = require('./Validator');
exports.ValidationResult = require('./ValidationResult');
exports.Code = require('./Code');
exports.Modules = require('./Modules');
exports.Lockable = require('./Lockable');
exports.Logger = require('./Logger');
exports.uuid = require('node-uuid').v4;
exports.hmac = require('./hmac');
exports.PushMessage = require('./PushMessage');
exports.TokenStorage = require('./TokenStorage');
},{"./Acl":50,"./Code":51,"./Lockable":52,"./Logger":53,"./Metadata":54,"./Modules":55,"./Permission":56,"./PushMessage":57,"./TokenStorage":58,"./ValidationResult":59,"./Validator":60,"./hmac":61,"node-uuid":69}],63:[function(require,module,exports){
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
	        function F() {}

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
	                F.prototype = this;
	                var subtype = new F();

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init')) {
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
},{}],64:[function(require,module,exports){
;(function (root, factory, undef) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"), require("./sha1"), require("./hmac"));
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
},{"./core":63,"./hmac":65,"./sha1":66}],65:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"));
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
},{"./core":63}],66:[function(require,module,exports){
;(function (root, factory) {
	if (typeof exports === "object") {
		// CommonJS
		module.exports = exports = factory(require("./core"));
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
},{"./core":63}],67:[function(require,module,exports){
/*! Jahcode v1.1.6 | jahcode.com | Copyright 2011-2014 by Florian Buecklers | MIT license */

(function(global) {
    var fakePrototype = Object.getPrototypeOf({
            constructor : String
        }) == String.prototype;

    if (!Function.prototype.extend) {
        /**
         * Extends the target with the properties of props and return target
         * @param {*=} target The target to extends or thisArg, if it is not set
         * @param {Object} props The properties to extend
         * @returns {*} The extended target
         */
        Function.prototype.extend = function(target, props) {
            if (!props) {
                props = target;
                target = this;
            }

            for (var name in props) {
                if (props.hasOwnProperty(name)) {
                    target[name] = props[name];
                }
            }

            return target;
        };
    }

    Object.extend(Function.prototype, /** @lends Function.prototype */ {
        /**
         * The linearized type hierarchy of this class
         * @type Function[]
         */
        linearizedTypes : [Object],

        /**
         * Inherits this constructor and extends it by additional properties and methods. Optional there can be mixined
         * additional Traits
         * @param {Trait...} traits Additional traits to mixin
         * @param {Object} classDescriptor The descriptor of the class properties and methods
         * @returns {Function} The new created child class
         */
        inherit : function() {
            var objectDescriptor = arguments[arguments.length - 1];
            var klass = objectDescriptor.constructor !== Object? objectDescriptor.constructor: function Class(toCast) {
                if (!(this instanceof klass)) {
                    return klass.asInstance(toCast);
                }

                if (this.initialize)
                    arguments.length ? this.initialize.apply(this, arguments) : this.initialize();
            };

            var proto = Object.createPrototypeChain(klass, this, Array.prototype.slice.call(arguments, 0, arguments.length - 1));

            var names = Object.getOwnPropertyNames(objectDescriptor);
            for ( var i = 0; i < names.length; ++i) {
                var name = names[i];
                var result = false;
                if (Object.properties.hasOwnProperty(name)) {
                    result = Object.properties[name](proto, objectDescriptor, name);
                }

                if (!result) {
                    var d = Object.getOwnPropertyDescriptor(objectDescriptor, name);

                    if (d.value) {
                        var val = d.value;
                        if (val instanceof Function) {
                            if (/this\.superCall/.test(val.toString())) {
                                d.value = Object.createSuperCallWrapper(klass, name, val);
                            }
                        } else if (val && (val.hasOwnProperty('get') || val.hasOwnProperty('value'))) {
                            d = val;
                        }
                    }

                    Object.defineProperty(proto, name, d);
                }
            }

            if (klass.initialize) {
                klass.initialize();
            }

            return klass;
        },

        /**
         * Indicates if this class is a subclass of the given class or mixin the given trait.
         * @param {Function} cls The parent class or trait to check
         * @returns {boolean} <code>true</code> if this class is a subclass or mixin the trait
         */
        isA: function(cls) {
            return this.prototype instanceof cls || this.linearizedTypes.lastIndexOf(cls) != -1;
        },

        /**
         * Indicates if the object is an instance of this class
         * @param obj The object to check for
         * @returns {boolean} <code>true</code> if the object is defined and
         */
        isInstance : function(obj) {
            if (obj === null || obj === void 0)
                return false;

            return Object(obj) instanceof this || classOf(obj).linearizedTypes.lastIndexOf(this) != -1;
        },

        /**
         * Checks if the object is an instance of this class and returns the object or try to convert the
         * object to an instance of this class by calling {@link #conv}
         * @param obj The object to check
         * @returns {*} The typed object or null, if the object can't be typed to an instance of this class
         */
        asInstance : function(obj) {
            if (this.isInstance(obj)) {
                return obj;
            } else {
                return this.conv(obj);
            }
        },

        /**
         * Converts the given value to an instance of this class, or returns null, if the value can't be converted
         * @param {*} value The value to convert
         * @returns {null} The converted value or null
         */
        conv : function() {
            return null;
        }
    });

    Object.extend( /** @lends Object **/ {
        properties : {},
        cloneOwnProperties : function(target, src) {
            var names = Object.getOwnPropertyNames(src);
            for ( var i = 0; i < names.length; ++i) {
                var name = names[i];
                if (name != '__proto__') {
                    var descr = Object.getOwnPropertyDescriptor(src, name);

                    Object.defineProperty(target, name, descr);
                }
            }
        },
        createPrototypeChain : function(cls, parentClass, traits) {
            var proto = parentClass.prototype;
            var linearizedTypes = parentClass.linearizedTypes.slice();
            var prototypeChain = parentClass.prototypeChain ? parentClass.prototypeChain.slice() : [proto];

            for ( var i = 0, trait; trait = traits[i]; ++i) {
                if (!(trait.prototype instanceof Trait)) {
                    throw new TypeError("Only traits can be mixed in.");
                }

                var linearizedTraitTypes = trait.linearizedTypes;
                for ( var j = 0, type; type = linearizedTraitTypes[j]; ++j) {
                    if (linearizedTypes.indexOf(type) == -1 && type != Trait) {
                        proto = Object.create(proto);
                        Object.cloneOwnProperties(proto, type.wrappedPrototype ? type.wrappedPrototype : type.prototype);

                        proto.constructor = type;

                        linearizedTypes.push(type);
                        prototypeChain.push(proto);
                    }
                }
            }

            proto = Object.create(proto);
            proto.constructor = cls;

            linearizedTypes.push(cls);
            prototypeChain.push(proto);

            if (fakePrototype) {
                cls.wrappedPrototype = proto;
                cls.prototype = Object.create(proto);
            } else {
                cls.prototype = proto;
            }

            cls.linearizedTypes = linearizedTypes;
            cls.prototypeChain = prototypeChain;

            return proto;
        },
        createSuperCallWrapper : function(declaringClass, methodName, method) {
            var superCall = function() {
                var cls = classOf(this);
                var index = cls.linearizedTypes.lastIndexOf(declaringClass);
                if (index == -1) {
                    throw new ReferenceError("superCall can't determine any super method");
                }

                var proto = cls.prototypeChain[index - 1];

                if (methodName != 'initialize' || proto[methodName])
                    return arguments.length ? proto[methodName].apply(this, arguments) : proto[methodName].call(this);
            };

            return function() {
                var current = this.superCall;
                this.superCall = superCall;

                try {
                    return arguments.length ? method.apply(this, arguments) : method.call(this);
                } finally {
                    if (current) {
                        this.superCall = current;
                    } else {
                        // made the property invisible again
                        delete this.superCall;
                    }
                }
            };
        }
    });

    Object.extend(Object.properties, {
        initialize : function(proto, objectDescriptor) {
            var init = objectDescriptor.initialize;
            var test = /this\.superCall/.test(init.toString());
            if (proto instanceof Trait) {
                if (test) {
                    throw new TypeError('Trait constructors can not call super constructors directly.');
                }

                objectDescriptor.initialize = function() {
                    arguments.length ? this.superCall.apply(this, arguments) : this.superCall.call(this);
                    init.call(this);
                };
            } else if (!test && classOf(proto) != Object) {
                objectDescriptor.initialize = function() {
                    this.superCall.call(this);
                    arguments.length ? init.apply(this, arguments) : init.call(this);
                };
            }
        },
        extend : function(proto, objectDescriptor) {
            Object.extend(proto.constructor, objectDescriptor.extend);
            return true;
        }
    });

    /**
     * Returns the constructor of the given object, works for objects and primitive types
     * @param {*} object The constructor to return for
     * @returns {Function} The constructor of the object
     * @global
     */
    var classOf = function(object) {
        if (object === null || object === void 0)
            return object;

        return Object.getPrototypeOf(Object(object)).constructor;
    };

    /**
     * @mixin Trait
     * @global
     */
    var Trait = Object.inherit({});

    /**
     * @extends Trait
     * @mixin Bind
     * @global
     */
    var Bind = Trait.inherit({
        /** @lends Bind */
        extend : {
            initialize : function() {
                try {
                    Object.defineProperty(this.prototype, 'bind', {
                        get : function() {
                            return this.bind = Bind.create(this);
                        },
                        set : function(val) {
                            Object.defineProperty(this, 'bind', {
                                value : val
                            });
                        },
                        configurable : true
                    });

                    this.Object = Object.inherit({
                        initialize : function(self) {
                            this.self = self;
                        }
                    });
                } catch (e) {
                    this.Object = Object.inherit({
                        initialize : function(self) {
                            this.self = self;

                            var bind = this;
                            Bind.each(self, function(name, method) {
                                bind[name] = method.bind(bind.self);
                            });
                        }
                    });
                }
            },

            /**
             * Creates a bind proxy for the given object
             * Each method of the given object is reflected on the proxy and
             * bound to the object context
             * @param {*} obj The object which will be bound
             * @returns {Bind} The bound proxy
             */
            create : function(obj) {
                if (!obj.constructor.Bind) {
                    try {
                        var descr = {};
                        Bind.each(obj, function(name, method) {
                            descr[name] = {
                                get : function() {
                                    return this[name] = method.bind(this.self);
                                },
                                set : function(val) {
                                    Object.defineProperty(this, name, {
                                        value : val
                                    });
                                },
                                configurable : true
                            };
                        });
                        obj.constructor.Bind = Bind.Object.inherit(descr);
                    } catch (e) {
                        obj.constructor.Bind = Bind.Object.inherit({});
                    }
                }

                return new obj.constructor.Bind(obj);
            },
            each : function(obj, callback) {
                var proto = Object.getPrototypeOf(obj);

                for ( var name in proto) {
                    var method = proto[name];
                    if (name != 'initialize' && name != 'constructor' && method instanceof Function) {
                        callback(name, method);
                    }
                }
            }
        },

        initialize : function() {
            if (!('bind' in this)) {
                this.bind = Bind.create(this);
            }
        }

        /**
         * @type Bind
         * @name Bind.prototype.bind
         */
    });

    var nativeClasses = [Boolean, Number, String, Function, RegExp, Error];
    for ( var i = 0, cls; cls = nativeClasses[i]; ++i) {
        cls.conv = cls;
    }

    Date.conv = function(object) {
        return new Date(object);
    };

    Array.conv = function(object) {
        return Array.prototype.slice.call(object);
    };

    Array.prototype.initialize = function() {
        for ( var i = 0; i < arguments.length; ++i) {
            this[i] = arguments[i];
        }

        this.length = arguments.length;
    };

    Error.prototype.initialize = function(message) {
        var stack = new Error().stack || 'Error';
        stack = stack.substring(stack.indexOf('\n') + 1);

        this.stack = message + '\n' + stack;
        this.message = message;
    };

    if (TypeError instanceof Error) { // ie8 uses error instances for subtype constructors
        Error.prototype.isInstance = Error.isInstance;
        Error.prototype.asInstance = Error.asInstance;
        Error.prototype.conv = Error.conv;
    }

    Object.extend(global, {
        classOf : classOf,
        Trait : Trait,
        Bind : Bind
    });
})(typeof window != 'undefined' ? window : global);
},{}],68:[function(require,module,exports){
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw (f.code="MODULE_NOT_FOUND", f)}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';
var immediate = _dereq_('immediate');

/* istanbul ignore next */
function INTERNAL() {}

var handlers = {};

var REJECTED = ['REJECTED'];
var FULFILLED = ['FULFILLED'];
var PENDING = ['PENDING'];

module.exports = exports = Promise;

function Promise(resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    safelyResolveThenable(this, resolver);
  }
}

Promise.prototype["catch"] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
    typeof onRejected !== 'function' && this.state === REJECTED) {
    return this;
  }
  var promise = new this.constructor(INTERNAL);
  if (this.state !== PENDING) {
    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}

handlers.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return handlers.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    safelyResolveThenable(self, thenable);
  } else {
    self.state = FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
handlers.reject = function (self, error) {
  self.state = REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}

function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }

  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}

exports.resolve = resolve;
function resolve(value) {
  if (value instanceof this) {
    return value;
  }
  return handlers.resolve(new this(INTERNAL), value);
}

exports.reject = reject;
function reject(reason) {
  var promise = new this(INTERNAL);
  return handlers.reject(promise, reason);
}

exports.all = all;
function all(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    self.resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len && !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}

exports.race = race;
function race(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    self.resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}

},{"immediate":2}],2:[function(_dereq_,module,exports){
(function (global){
'use strict';
var Mutation = global.MutationObserver || global.WebKitMutationObserver;

var scheduleDrain;

{
  if (Mutation) {
    var called = 0;
    var observer = new Mutation(nextTick);
    var element = global.document.createTextNode('');
    observer.observe(element, {
      characterData: true
    });
    scheduleDrain = function () {
      element.data = (called = ++called % 2);
    };
  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
    var channel = new global.MessageChannel();
    channel.port1.onmessage = nextTick;
    scheduleDrain = function () {
      channel.port2.postMessage(0);
    };
  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
    scheduleDrain = function () {

      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
      var scriptEl = global.document.createElement('script');
      scriptEl.onreadystatechange = function () {
        nextTick();

        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      global.document.documentElement.appendChild(scriptEl);
    };
  } else {
    scheduleDrain = function () {
      setTimeout(nextTick, 0);
    };
  }
}

var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}

module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(_dereq_,module,exports){
(function (global){
'use strict';
if (typeof global.Promise !== 'function') {
  global.Promise = _dereq_('./lib');
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib":1}]},{},[3]);


},{}],69:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

/*global window, require, define */
(function(_window) {
  'use strict';

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng, _mathRNG, _nodeRNG, _whatwgRNG, _previousRoot;

  function setupBrowser() {
    // Allow for MSIE11 msCrypto
    var _crypto = _window.crypto || _window.msCrypto;

    if (!_rng && _crypto && _crypto.getRandomValues) {
      // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
      //
      // Moderately fast, high quality
      try {
        var _rnds8 = new Uint8Array(16);
        _whatwgRNG = _rng = function whatwgRNG() {
          _crypto.getRandomValues(_rnds8);
          return _rnds8;
        };
        _rng();
      } catch(e) {}
    }

    if (!_rng) {
      // Math.random()-based (RNG)
      //
      // If all else fails, use Math.random().  It's fast, but is of unspecified
      // quality.
      var  _rnds = new Array(16);
      _mathRNG = _rng = function() {
        for (var i = 0, r; i < 16; i++) {
          if ((i & 0x03) === 0) { r = Math.random() * 0x100000000; }
          _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }

        return _rnds;
      };
      if ('undefined' !== typeof console && console.warn) {
        console.warn("[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()");
      }
    }
  }

  function setupNode() {
    // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
    //
    // Moderately fast, high quality
    if ('function' === typeof require) {
      try {
        var _rb = require('crypto').randomBytes;
        _nodeRNG = _rng = _rb && function() {return _rb(16);};
        _rng();
      } catch(e) {}
    }
  }

  if (_window) {
    setupBrowser();
  } else {
    setupNode();
  }

  // Buffer class to use
  var BufferClass = ('function' === typeof Buffer) ? Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = (options.clockseq != null) ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = (options.msecs != null) ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = (options.nsecs != null) ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) === 'string') {
      buf = (options === 'binary') ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;
  uuid._rng = _rng;
  uuid._mathRNG = _mathRNG;
  uuid._nodeRNG = _nodeRNG;
  uuid._whatwgRNG = _whatwgRNG;

  if (('undefined' !== typeof module) && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});


  } else {
    // Publish as global (in browsers)
    _previousRoot = _window.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _window.uuid = _previousRoot;
      return uuid;
    };

    _window.uuid = uuid;
  }
})('undefined' !== typeof window ? window : null);

},{"crypto":undefined}],70:[function(require,module,exports){
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

},{}],71:[function(require,module,exports){
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
            typeof require === 'function';
    };

    var depd = null;
    validator.deprecation = function (msg) {
        if (depd === null) {
            if (!validator.isServerSide()) {
                return;
            }
            depd = require('depd')('validator');
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

},{"depd":70}],72:[function(require,module,exports){
var _global = (function() { return this; })();
var nativeWebSocket = _global.WebSocket || _global.MozWebSocket;
var websocket_version = require('./version');


/**
 * Expose a W3C WebSocket class with just one or two arguments.
 */
function W3CWebSocket(uri, protocols) {
	var native_instance;

	if (protocols) {
		native_instance = new nativeWebSocket(uri, protocols);
	}
	else {
		native_instance = new nativeWebSocket(uri);
	}

	/**
	 * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
	 * class). Since it is an Object it will be returned as it is when creating an
	 * instance of W3CWebSocket via 'new W3CWebSocket()'.
	 *
	 * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
	 */
	return native_instance;
}


/**
 * Module exports.
 */
module.exports = {
    'w3cwebsocket' : nativeWebSocket ? W3CWebSocket : null,
    'version'      : websocket_version
};

},{"./version":73}],73:[function(require,module,exports){
module.exports = require('../package.json').version;

},{"../package.json":74}],74:[function(require,module,exports){
module.exports={
  "name": "websocket",
  "description": "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
  "keywords": [
    "websocket",
    "websockets",
    "socket",
    "networking",
    "comet",
    "push",
    "RFC-6455",
    "realtime",
    "server",
    "client"
  ],
  "author": {
    "name": "Brian McKelvey",
    "email": "brian@worlize.com",
    "url": "https://www.worlize.com/"
  },
  "contributors": [
    {
      "name": "Iñaki Baz Castillo",
      "email": "ibc@aliax.net",
      "url": "http://dev.sipdoc.net"
    }
  ],
  "version": "1.0.22",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/theturtle32/WebSocket-Node.git"
  },
  "homepage": "https://github.com/theturtle32/WebSocket-Node",
  "engines": {
    "node": ">=0.8.0"
  },
  "dependencies": {
    "debug": "~2.2.0",
    "nan": "~2.0.5",
    "typedarray-to-buffer": "~3.0.3",
    "yaeti": "~0.0.4"
  },
  "devDependencies": {
    "buffer-equal": "^0.0.1",
    "faucet": "^0.0.1",
    "gulp": "git+https://github.com/gulpjs/gulp.git#4.0",
    "gulp-jshint": "^1.11.2",
    "jshint-stylish": "^1.0.2",
    "tape": "^4.0.1"
  },
  "config": {
    "verbose": false
  },
  "scripts": {
    "install": "(node-gyp rebuild 2> builderror.log) || (exit 0)",
    "test": "faucet test/unit",
    "gulp": "gulp"
  },
  "main": "index",
  "directories": {
    "lib": "./lib"
  },
  "browser": "lib/browser.js",
  "license": "Apache-2.0",
  "gitHead": "19108bbfd7d94a5cd02dbff3495eafee9e901ca4",
  "bugs": {
    "url": "https://github.com/theturtle32/WebSocket-Node/issues"
  },
  "_id": "websocket@1.0.22",
  "_shasum": "8c33e3449f879aaf518297c9744cebf812b9e3d8",
  "_from": "websocket@>=1.0.18 <2.0.0",
  "_npmVersion": "2.14.3",
  "_nodeVersion": "3.3.1",
  "_npmUser": {
    "name": "theturtle32",
    "email": "brian@worlize.com"
  },
  "maintainers": [
    {
      "name": "theturtle32",
      "email": "brian@worlize.com"
    }
  ],
  "dist": {
    "shasum": "8c33e3449f879aaf518297c9744cebf812b9e3d8",
    "tarball": "http://registry.npmjs.org/websocket/-/websocket-1.0.22.tgz"
  },
  "_resolved": "https://registry.npmjs.org/websocket/-/websocket-1.0.22.tgz",
  "readme": "ERROR: No README data found!"
}

},{}]},{},[31])(31)
});