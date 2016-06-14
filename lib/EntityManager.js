"use strict";

var message = require('./message');
var error = require('./error');
var binding = require('./binding');
var util = require('./util');

var EntityTransaction = require('./EntityTransaction');
var Query = require('./Query');
var Metadata = require('./util/Metadata');
var Message = require('./connector/Message');
var BloomFilter = require('./caching/BloomFilter');
var StatusCode = Message.StatusCode;

/**
 * @alias baqend.EntityManager
 * @extends baqend.util.Lockable
 */
class EntityManager extends util.Lockable {

  /**
   * Determine whether the entity manager is open.
   * true until the entity manager has been closed
   * @type Boolean
   */
  get isOpen() {
    return !!this._connector;
  }

  /**
   * The authentication token if the user is logged in currently
   * @type String
   */
  get token() {
    return this.tokenStorage.get(this._connector.origin);
  }

  get isCachingDisabled() {
    return !this.bloomFilter;
  }

  /**
   * The authentication token if the user is logged in currently
   * @param {String} value
   */
  set token(value) {
    this.tokenStorage.update(this._connector.origin, value);
  }

  /**
   * @param {baqend.EntityManagerFactory} entityManagerFactory The factory which of this entityManager instance
   * @param {baqend.util.TokenStorage} tokenStorage The token storage to persist the authorization token
   */
  constructor(entityManagerFactory, tokenStorage) {
    super();

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
    this.log = util.Logger.create(this);

    /**
     * The connector used for baqend requests
     * @type baqend.connector.Connector
     * @private
     */
    this._connector = null;

    /**
     * All managed and cached entity instances
     * @type WeakMap<String,baqend.binding.Entity>
     */
    this._entities = null;

    /** @type baqend.EntityManagerFactory */
    this.entityManagerFactory = entityManagerFactory;

    /** @type baqend.metamodel.Metamodel */
    this.metamodel = entityManagerFactory.metamodel;

    /** @type baqend.metamodel.Code */
    this.code = entityManagerFactory.code;

    /** @type baqend.util.Modules */
    this.modules = null;

    /**
     * The current logged in user object
     * @type baqend.binding.User
     */
    this.me = null;

    /**
     * Returns true if the device token is already registered, otherwise false.
     * @type boolean
     */
    this.isDeviceRegistered = false;

    /**
     * Returns the tokenStorage which will be used to authorize all requests.
     * @type {baqend.util.TokenStorage}
     */
    this.tokenStorage = tokenStorage;

    /**
     * @type {baqend.caching.BloomFilter}
     */
    this.bloomFilter = null;

    /**
     * Set of object ids that were revalidated after the Bloom filter was loaded.
     */
    this.cacheWhiteList = null;

    /**
     * Set of object ids that were updated but are not yet included in the bloom filter.
     * This set essentially implements revalidation by side effect which does not work in Chrome.
     */
    this.cacheBlackList = null;

    /**
     * Bloom filter refresh interval in seconds.
     *
     * @type {number}
     */
    this.bloomFilterRefresh = entityManagerFactory.bloomFilterRefresh;

    /**
     * Bloom filter refresh Promise
     *
     */
    this._bloomFilterLock = new util.Lockable();
  }

  /**
   * Connects this entityManager, used for synchronous and asynchronous initialization
   * @param {baqend.connector.Connector} connector
   * @param {Object=} connectData
   */
  connected(connector, connectData) {
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

    if (connectData && connectData.bloomFilter) {
      this.bloomFilter = new BloomFilter(connectData.bloomFilter);
      this.cacheWhiteList = new Set([]);
      this.cacheBlackList = new Set([]);
    }
  }

  /**
   * @param {baqend.metamodel.ManagedType[]} types
   * @return {baqend.binding.ManagedFactory}
   * @private
   */
  _createObjectFactory(types) {
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
          get() {
            Object.defineProperty(this, name, {
              value: type.createObjectFactory(this)
            });

            return this[name];
          },
          set(typeConstructor) {
            type.typeConstructor = typeConstructor;
          },
          configurable: true
        });
      }
    }, this);
  }

  _sendOverSocket(message) {
    message.token = this.token;
    this._connector.sendOverSocket(message);
  }

  _subscribe(topic, cb) {
    this._connector.subscribe(topic, cb);
  }

  _unsubscribe(topic, cb) {
    this._connector.unsubscribe(topic, cb);
  }

  _send(message) {
    message.tokenStorage = this.tokenStorage;
    return this._connector.send(message).catch((e) => {
      if (e.status == StatusCode.BAD_CREDENTIALS) {
        this._logout();
      }
      throw e;
    });
  }

  /**
   * Get an instance, whose state may be lazily fetched. If the requested instance does not exist
   * in the database, the EntityNotFoundError is thrown when the instance state is first accessed.
   * The application should not expect that the instance state will be available upon detachment,
   * unless it was accessed by the application while the entity manager was open.
   *
   * @param {(Function|String)} entityClass
   * @param {String=} key
   */
  getReference(entityClass, key) {
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
  }

  /**
   * Creates an instance of Query.Builder for query creation and execution. The Query results are instances of the
   * resultClass argument.
   * @param {Function=} resultClass - the type of the query result
   * @return {baqend.Query.Builder} A query builder to create one ore more queries for the specified class
   */
  createQueryBuilder(resultClass) {
    return new Query.Builder(this, resultClass);
  }

  /**
   * Clear the persistence context, causing all managed entities to become detached.
   * Changes made to entities that have not been flushed to the database will not be persisted.
   */
  clear() {
    this._entities = {};
  }

  /**
   * Close an application-managed entity manager. After the close method has been invoked,
   * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it
   * will throw the IllegalStateError except for transaction, and isOpen (which will return false).
   * If this method is called when the entity manager is associated with an active transaction,
   * the persistence context remains managed until the transaction completes.
   */
  close() {
    this._connector = null;

    return this.clear();
  }

  /**
   * Check if the instance is a managed entity instance belonging to the current persistence context.
   * @param {baqend.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity is in persistence context
   */
  contains(entity) {
    return !!entity && this._entities[entity.id] === entity;
  }

  /**
   * Check if an object with the id from the given entity is already attached.
   * @param {baqend.binding.Entity} entity - entity instance
   * @returns {Boolean} boolean indicating if entity with same id is attached
   */
  containsById(entity) {
    return !!(entity && this._entities[entity.id]);
  }

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached.
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue to reference it.
   * @param {baqend.binding.Entity} entity - entity instance
   */
  detach(entity) {
    var state = Metadata.get(entity);
    return state.withLock(() => {
      this.removeReference(entity);
      return Promise.resolve(entity);
    });
  }

  /**
   * Resolve the depth by loading the referenced objects of the given entity.
   *
   * @param {baqend.binding.Entity} entity - entity instance
   * @param {Object} [options] The load options
   * @return {Promise<baqend.binding.Entity>}
   */
  resolveDepth(entity, options) {
    if (!options || !options.depth)
      return Promise.resolve(entity);

    options.resolved = options.resolved || [];
    var promises = [];
    var subOptions = Object.assign({}, options, {
      depth: options.depth === true ? true : options.depth - 1
    });
    this.getSubEntities(entity, 1).forEach((subEntity) => {
      if (subEntity != null && !~options.resolved.indexOf(subEntity)) {
        options.resolved.push(subEntity);
        promises.push(this.load(subEntity.id, null, subOptions));
      }
    });

    return Promise.all(promises).then(function() {
      return entity;
    });
  }

  /**
   * Search for an entity of the specified oid.
   * If the entity instance is contained in the persistence context, it is returned from there.
   * @param {(Function|String)} entityClass - entity class
   * @param {String} oid - Object ID
   * @param {Object} [options] The load options.
   * @return {Promise<baqend.binding.Entity>}
   */
  load(entityClass, oid, options) {
    options = options || {};
    var entity = this.getReference(entityClass, oid);
    var state = Metadata.get(entity);

    if (!options.refresh && options.local && state.isAvailable) {
      return this.resolveDepth(entity, options);
    }

    var msg = new message.GetObject(state.bucket, state.key);

    this.ensureCacheHeader(entity, msg, options.refresh);

    return this._send(msg).then((msg) => {
      // refresh object if loaded older version from cache
      // chrome doesn't using cache when setIfNoneMatch is set
      if (entity.version > msg.response.entity.version) {
        options.refresh = true;
        return this.load(entityClass, oid, options)
      }

      this.addToWhiteList(msg.response.entity.id);

      if (msg.response.status != StatusCode.NOT_MODIFIED) {
        state.setJson(msg.response.entity);
      }

      state.setPersistent();

      return this.resolveDepth(entity, options);
    }, (e) => {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        this.removeReference(entity);
        state.setRemoved();
        return null;
      } else {
        throw e;
      }
    });
  }

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @return {Promise<baqend.binding.Entity>}
   */
  insert(entity, options) {
    options = options || {};
    var isNew;

    return this._save(entity, options, function(state, json) {
      if (state.version)
        throw new error.PersistentError('Existing objects can\'t be inserted.');

      isNew = !state.id;

      return new message.CreateObject(state.bucket, json);
    }).then((val) => {
      if (isNew)
        this._attach(entity);

      return val;
    });
  }

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @return {Promise<baqend.binding.Entity>}
   */
  update(entity, options) {
    options = options || {};

    return this._save(entity, options, function(state, json) {
      if (!state.version)
        throw new error.PersistentError("New objects can't be inserted.");

      if (options.force) {
        delete json.version;
        var msg = new message.ReplaceObject(state.bucket, state.key, json);
        msg.setIfMatch('*');
        return msg;
      } else {
        msg = new message.ReplaceObject(state.bucket, state.key, json);
        msg.setIfMatch(state.version);
        return msg;
      }
    });
  }

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Object} options The save options
   * @param {boolean=} withoutLock Set true to save the entity without locking
   * @return {Promise<baqend.binding.Entity>}
   */
  save(entity, options, withoutLock) {
    options = options || {};

    var msgFactory = function(state, json) {
      if (options.force) {
        if (!state.id)
          throw new error.PersistentError("New special objects can't be forcedly saved.");

        delete json.version;
        return new message.ReplaceObject(state.bucket, state.key, json);
      } else if (state.version) {
        var msg = new message.ReplaceObject(state.bucket, state.key, json);
        msg.setIfMatch(state.version);
        return msg;
      } else {
        return new message.CreateObject(state.bucket, json);
      }
    };

    return withoutLock ? this._locklessSave(entity, options, msgFactory) : this._save(entity, options, msgFactory)
  }

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Function} cb pre-safe callback
   * @return {Promise<baqend.binding.Entity>}
   */
  optimisticSave(entity, cb) {
    return Metadata.get(entity).withLock(() => {
      return this._optimisticSave(entity, cb);
    });
  }

  /**
   * @param {baqend.binding.Entity} entity
   * @param {Function} cb pre-safe callback
   * @return {Promise<baqend.binding.Entity>}
   * @private
   */
  _optimisticSave(entity, cb) {
    var abort = false;
    var abortFn = function() {
      abort = true;
    };
    var promise = Promise.resolve(cb(entity, abortFn));

    if (abort)
      return Promise.resolve(entity);

    return promise.then(() => {
      return this.save(entity, {}, true).catch((e) => {
        if (e.status == 412) {
          return this.refresh(entity, {}).then(() => {
            return this._optimisticSave(entity, cb);
          });
        } else {
          throw e;
        }
      });
    });
  }

  /**
   * Save the object state without locking
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @param {Function} msgFactory
   * @return {Promise.<baqend.binding.Entity>}
   * @private
   */
  _locklessSave(entity, options, msgFactory) {
    this.attach(entity);
    var state = Metadata.get(entity);
    var refPromises;

    var json;
    if (state.isAvailable) {
      //getting json will check all collections changes, therefore we must do it before proofing the dirty state
      json = state.getJson();
    }

    if (state.isDirty) {
      if (!options.refresh) {
        state.setPersistent();
      }

      var sendPromise = this._send(msgFactory(state, json)).then((msg) => {
        if (options.refresh) {
          state.setJson(msg.response.entity);
          state.setPersistent();
        } else {
          state.setJsonMetadata(msg.response.entity);
        }
        return entity;
      }, (e) => {
        if (e.status == StatusCode.OBJECT_NOT_FOUND) {
          this.removeReference(entity);
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
    this.getSubEntities(entity, options.depth).forEach((sub) => {
      refPromises.push(this._save(sub, subOptions, msgFactory));
    });

    return Promise.all(refPromises).then(() => entity);
  }

  /**
   * Save and lock the object state
   * @param {baqend.binding.Entity} entity
   * @param {Object} options
   * @param {Function} msgFactory
   * @return {Promise.<baqend.binding.Entity>}
   * @private
   */
  _save(entity, options, msgFactory) {
    this.ensureBloomFilterFreshness();

    var state = Metadata.get(entity);
    if (state.version) {
      this.addToBlackList(entity.id);
    }

    return state.withLock(() => {
      return this._locklessSave(entity, options, msgFactory);
    });
  }

  /**
   * Returns all referenced sub entities for the given depth and root entity
   * @param {baqend.binding.Entity} entity
   * @param {Boolean|Number} depth
   * @param {baqend.binding.Entity[]} [resolved]
   * @param {baqend.binding.Entity=} initialEntity
   * @returns {baqend.binding.Entity[]}
   */
  getSubEntities(entity, depth, resolved, initialEntity) {
    resolved = resolved || [];
    if (!depth) {
      return resolved;
    }
    initialEntity = initialEntity || entity;

    var state = Metadata.get(entity);
    for (let value of state.type.references()) {
      this.getSubEntitiesByPath(entity, value.path).forEach((subEntity) => {
        if (!~resolved.indexOf(subEntity) && subEntity != initialEntity) {
          resolved.push(subEntity);
          resolved = this.getSubEntities(subEntity, depth === true ? depth : depth - 1, resolved, initialEntity);
        }
      });
    }

    return resolved;
  }

  /**
   * Returns all referenced one level sub entities for the given path
   * @param {baqend.binding.Entity} entity
   * @param {Array} path
   * @returns {baqend.binding.Entity[]}
   */
  getSubEntitiesByPath(entity, path) {
    var subEntities = [entity];

    path.forEach((attributeName) => {

      var tmpSubEntities = [];
      subEntities.forEach((subEntity) => {
        var curEntity = subEntity[attributeName];
        if (!curEntity)
          return;

        var attribute = this.metamodel.managedType(subEntity.constructor).getAttribute(attributeName);
        if (attribute.isCollection) {
          for (let entry of curEntity.entries()) {
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
  }

  /**
   * Delete the entity instance.
   * @param {baqend.binding.Entity} entity
   * @param {Object} options The delete options
   * @return {Promise<baqend.binding.Entity>}
   */
  'delete'(entity, options) {
    options = options || {};

    this.attach(entity);
    var state = Metadata.get(entity);

    return state.withLock(() => {
      if (!state.version && !options.force)
        throw new error.IllegalEntityError(entity);

      var msg = new message.DeleteObject(state.bucket, state.key);

      this.addToBlackList(entity.id);

      if (!options.force)
        msg.setIfMatch(state.version);

      var refPromises = [this._send(msg).then(() => {
        this.removeReference(entity);
        state.setRemoved();
        return entity;
      })];

      var subOptions = Object.assign({}, options);
      subOptions.depth = 0;
      this.getSubEntities(entity, options.depth).forEach((sub) => {
        refPromises.push(this.delete(sub, subOptions));
      });

      return Promise.all(refPromises).then(function() {
        return entity;
      });
    });
  }

  /**
   * Synchronize the persistence context to the underlying database.
   *
   * @returns {Promise}
   */
  flush(doneCallback, failCallback) {
    // TODO: implement this
  }

  /**
   * Make an instance managed and persistent.
   * @param {baqend.binding.Entity} entity - entity instance
   */
  persist(entity) {
    entity.attach(this);
  }

  /**
   * Refresh the state of the instance from the database, overwriting changes made to the entity, if any.
   * @param {baqend.binding.Entity} entity - entity instance
   * @param {Object} options The refresh options
   * @return {Promise<baqend.binding.Entity>}
   */
  refresh(entity, options) {
    options = options || {};
    options.refresh = true;

    return this.load(entity.id, null, options);
  }

  /**
   * Attach the instance to this database context, if it is not already attached
   * @param {baqend.binding.Entity} entity The entity to attach
   */
  attach(entity) {
    if (!this.contains(entity)) {
      var type = this.metamodel.entity(entity.constructor);
      if (!type)
        throw new error.IllegalEntityError(entity);

      if (this.containsById(entity))
        throw new error.EntityExistsError(entity);

      this._attach(entity);
    }
  }

  _attach(entity) {
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
  }

  removeReference(entity) {
    var state = Metadata.get(entity);
    if (!state)
      throw new error.IllegalEntityError(entity);

    delete this._entities[state.id];
  }

  register(user, password, loginOption) {
    var login = loginOption > binding.UserFactory.LoginOption.NO_LOGIN;

    if (this.me && login)
      throw new error.PersistentError('User is already logged in.');

    if (loginOption >= binding.UserFactory.LoginOption.PERSIST_LOGIN && !this.token)
      this.tokenStorage.update(this._connector.origin, "", true);

    return this.withLock(() => {
      var msg = new message.Register({
        user: user,
        password: password,
        login: login
      });
      return this._userRequest(msg, login);
    });
  }

  login(username, password, loginOption) {
    if (this.me)
      throw new error.PersistentError('User is already logged in.');

    if (loginOption >= binding.UserFactory.LoginOption.PERSIST_LOGIN && !this.token)
      this.tokenStorage.update(this._connector.origin, "", true);

    return this.withLock(() => {
      var msg = new message.Login({
        username: username,
        password: password
      });

      return this._userRequest(msg, true);
    });
  }

  logout() {
    return this.withLock(() => {
      return this._send(new message.Logout()).then(this._logout.bind(this));
    });
  }

  loginWithOAuth(provider, clientID, options) {
    options = Object.assign({
      title: "Login with " + provider,
      timeout: 5 * 60 * 1000,
      state: {},
      loginOption: true
    }, options);

    if (options.loginOption >= binding.UserFactory.LoginOption.PERSIST_LOGIN && !this.token)
      this.tokenStorage.update(this._connector.origin, "", true);

    var msg;
    if (Message[provider + 'OAuth']) {
      msg = new Message[provider + 'OAuth'](clientID, options.scope, JSON.stringify(options.state));
    } else {
      throw new Error("Provider not supported.");
    }

    var req = this._userRequest(msg, options.loginOption > binding.UserFactory.LoginOption.NO_LOGIN);
    var w = open(msg.request.path, options.title, 'width=' + options.width + ',height=' + options.height);

    return new Promise((resolve, reject) => {
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
    });
  }

  renew() {
    return this.withLock(() => {
      var msg = new message.Me();
      return this._userRequest(msg, true);
    });
  }

  newPassword(username, password, newPassword) {
    return this.withLock(() => {
      var msg = new message.NewPassword({
        username: username,
        password: password,
        newPassword: newPassword
      });

      return this._send(msg).then(() => {
        this._updateUser(msg.response.entity);
      });
    });
  }

  _updateUser(obj, updateMe) {
    var user = this.getReference(obj.id);
    var metadata = Metadata.get(user);
    metadata.setJson(obj);
    metadata.setPersistent();

    if (updateMe)
      this.me = user;

    return user;
  }

  _logout() {
    this.me = null;
    this.tokenStorage.update(this._connector.origin, null);
  }

  _userRequest(msg, updateMe) {
    return this._send(msg).then(() => {
      if (msg.response.entity) {
        return this._updateUser(msg.response.entity, updateMe);
      }
    }, (e) => {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        if (updateMe) {
          this._logout();
        }
        return null;
      } else {
        throw e;
      }
    });
  }

  registerDevice(os, token, device) {
    var msg = new message.DeviceRegister({
      token: token,
      devicetype: os,
      device: device
    });

    msg.withCredentials = true;
    return this._send(msg);
  }

  checkDeviceRegistration() {
    return this._send(new message.DeviceRegistered()).then(() => {
      return this.isDeviceRegistered = true;
    }, (e) => {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return this.isDeviceRegistered = false;
      } else {
        throw e;
      }
    });
  }

  pushDevice(pushMessage) {
    return this._send(new message.DevicePush(pushMessage));
  }

  /**
   * The given entity will be checked by the validation code of the entity type.
   *
   * @param {baqend.binding.Entity} entity
   * @returns {baqend.util.ValidationResult} result
   */
  validate(entity) {
    var type = Metadata.get(entity).type;

    var result = new util.ValidationResult();
    for (var iter = type.attributes(), item; !(item = iter.next()).done;) {
      var validate = new util.Validator(item.value.name, entity);
      result.fields[validate.key] = validate;
    }

    var validationCode = type.validationCode;
    if (validationCode) {
      validationCode(result.fields);
    }

    return result;
  }

  /**
   * Adds the given object id to the cacheWhiteList if needed.
   * @param objectId The id to add.
   */
  addToWhiteList(objectId) {
    if (!this.isCachingDisabled) {
      if (this.bloomFilter.contains(objectId)) {
        this.cacheWhiteList.add(objectId);
      }
      this.cacheBlackList.delete(objectId);
    }
  }

  /**
   * Adds the given object id to the cacheBlackList if needed.
   * @param objectId The id to add.
   */
  addToBlackList(objectId) {
    if (!this.isCachingDisabled) {
      if (!this.bloomFilter.contains(objectId)) {
        this.cacheBlackList.add(objectId);
      }
      this.cacheWhiteList.delete(objectId);
    }
  }

  refreshBloomFilter() {
    var msg = new message.GetBloomFilter();
    return this._send(msg).then((message) => {
      this.cacheWhiteList = new Set([]);
      this.cacheBlackList = new Set([]);
      return this.bloomFilter = new BloomFilter(message.response.entity);
    });
  }

  /**
   * Checks the freshness of the bloom filter and does a reload if necessary
   */
  ensureBloomFilterFreshness() {
    if (this.isCachingDisabled)
      return;

    var now = Math.round(new Date().getTime() / 1000);

    if (this._bloomFilterLock.isReady && now - this.bloomFilter.creation > this.bloomFilterRefresh) {
      this._bloomFilterLock.withLock(() => this.refreshBloomFilter());
    }
  }

  /**
   *
   * @param {baqend.binding.Entity} entity To check the bloom filter
   * @param {baqend.message} message To attach the headers
   * @param {boolean} refresh To force the reload headers
   */
  ensureCacheHeader(entity, message, refresh) {
    this.ensureBloomFilterFreshness();

    var isStale = () => !this.cacheWhiteList.has(entity.id) && (this.cacheBlackList.has(entity.id) || this.bloomFilter.contains(entity.id));
    var cacheBypass = () => this.isCachingDisabled || !this._bloomFilterLock.isReady;

    if (refresh || cacheBypass() || isStale()) {
      message.setIfNoneMatch('');
      message.setCacheControl('max-age=0, no-cache');
    }
  }
}

/**
 * Creates a new List collection
 * @function
 * @param {...*} arguments Same arguments can be passed as the Array constructor takes
 * @return {Array<*>} The new created List
 */
EntityManager.prototype.List = Array;

/**
 * Creates a new Set collection
 * @function
 * @param {Iterable<*>=} collection The initial array or collection to initialize the new Set
 * @return {Set} The new created Set
 */
EntityManager.prototype.Set = Set;

/**
 * Creates a new Map collection
 * @function
 * @param {Iterable<*>=} collection The initial array or collection to initialize the new Map
 * @return {Map} The new created Map
 */
EntityManager.prototype.Map = Map;

/**
 * Creates a new GeoPoint
 * @function
 * @param {String|Number|Object|Array=} latitude A coordinate pair (latitude first), a GeoPoint like object or the GeoPoint's latitude
 * @param {Number=} longitude The GeoPoint's longitude
 * @return {baqend.collection.GeoPoint} The new created GeoPoint
 */
EntityManager.prototype.GeoPoint = require('./GeoPoint');

/**
 * An User factory for user objects.
 * The User factory can be called to create new instances of users or can be used to register/login/logout users.
 * The created instances implements the {@link baqend.binding.User} interface
 * @type baqend.binding.UserFactory
 */
EntityManager.prototype.User = null;

/**
 * An Device factory for user objects.
 * The Device factory can be called to create new instances of devices or can be used to register, push to and
 * check registration status of devices.
 * @type baqend.binding.DeviceFactory
 */
EntityManager.prototype.Device = null;

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

module.exports = EntityManager;