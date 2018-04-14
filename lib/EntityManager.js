'use strict';

const messages = require('./message');
const error = require('./error');
const binding = require('./binding');
const util = require('./util');
const query = require('./query');

const UserFactory = require('./binding/UserFactory');
const Metadata = require('./util/Metadata');
const Message = require('./connector/Message');
const BloomFilter = require('./caching/BloomFilter');
const deorecated = require('./util/deprecated');

const StatusCode = Message.StatusCode;
const DB_PREFIX = '/db/';

/**
 * @alias EntityManager
 * @extends util.Lockable
 */
class EntityManager extends util.Lockable {
  /**
   * Determine whether the entity manager is open.
   * true until the entity manager has been closed
   * @type boolean
   */
  get isOpen() {
    return !!this.connection;
  }

  /**
   * The authentication token if the user is logged in currently
   * @type string
   */
  get token() {
    return this.tokenStorage.token;
  }

  get isCachingDisabled() {
    return !this.bloomFilter;
  }

  /**
   * The authentication token if the user is logged in currently
   * @param {string} value
   */
  set token(value) {
    this.tokenStorage.update(value);
  }

  /**
   * @param {EntityManagerFactory} entityManagerFactory The factory which of this entityManager instance
   */
  constructor(entityManagerFactory) {
    super();

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
    this.log = util.Logger.create(this);

    /**
     * The connector used for requests
     * @type connection.Connector
     * @private
     */
    this.connection = null;

    /**
     * All managed and cached entity instances
     * @type Map<String,binding.Entity>
     * @private
     */
    this.entities = null;

    /** @type EntityManagerFactory */
    this.entityManagerFactory = entityManagerFactory;

    /** @type metamodel.Metamodel */
    this.metamodel = entityManagerFactory.metamodel;

    /** @type util.Code */
    this.code = entityManagerFactory.code;

    /** @type util.Modules */
    this.modules = null;

    /**
     * The current logged in user object
     * @type model.User
     */
    this.me = null;

    /**
     * Returns true if the device token is already registered, otherwise false.
     * @type boolean
     */
    this.isDeviceRegistered = false;

    /**
     * Returns the tokenStorage which will be used to authorize all requests.
     * @type {util.TokenStorage}
     */
    this.tokenStorage = null;

    /**
     * @type {caching.BloomFilter}
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
    this.bloomFilterRefresh = 60;

    /**
     * Bloom filter refresh Promise
     *
     */
    this.bloomFilterLock = new util.Lockable();
  }

  /**
   * Connects this entityManager, used for synchronous and asynchronous initialization
   * @param {connection.Connector} connector
   * @param {Object} connectData
   * @param {util.TokenStorage} tokenStorage The used tokenStorage for token persistence
   */
  connected(connector, connectData, tokenStorage) {
    this.connection = connector;
    this.tokenStorage = tokenStorage;
    this.bloomFilterRefresh = this.entityManagerFactory.staleness;
    this.entities = {};

    this.File = binding.FileFactory.create(this);
    this._createObjectFactory(this.metamodel.embeddables);
    this._createObjectFactory(this.metamodel.entities);

    this.transaction = {}; // TODO: implement this
    this.modules = new util.Modules(this);

    if (connectData) {
      this.isDeviceRegistered = !!connectData.device;
      if (connectData.user && tokenStorage.token) {
        this._updateUser(connectData.user, true);
      }

      if (this.bloomFilterRefresh > 0 && connectData.bloomFilter && util.atob && !util.isNode) {
        this.updateBloomFilter(connectData.bloomFilter);
      }
    }
  }

  /**
   * @param {metamodel.ManagedType[]} types
   * @return {binding.ManagedFactory}
   * @private
   */
  _createObjectFactory(types) {
    Object.keys(types).forEach((ref) => {
      const type = this.metamodel.managedType(ref);
      const name = type.name;

      if (this[name]) {
        type.typeConstructor = this[name];
        Object.defineProperty(this, name, {
          value: type.createObjectFactory(this),
        });
      } else {
        Object.defineProperty(this, name, {
          get() {
            Object.defineProperty(this, name, {
              value: type.createObjectFactory(this),
            });

            return this[name];
          },
          set(typeConstructor) {
            type.typeConstructor = typeConstructor;
          },
          configurable: true,
        });
      }
    }, this);
  }

  send(mesage, ignoreCredentialError) {
    const msg = mesage;
    msg.tokenStorage = this.tokenStorage;
    let result = this.connection.send(msg);
    if (!ignoreCredentialError) {
      result = result.catch((e) => {
        if (e.status === StatusCode.BAD_CREDENTIALS) {
          this._logout();
        }
        throw e;
      });
    }
    return result;
  }

  /**
   * Get an instance, whose state may be lazily fetched. If the requested instance does not exist
   * in the database, the EntityNotFoundError is thrown when the instance state is first accessed.
   * The application should not expect that the instance state will be available upon detachment,
   * unless it was accessed by the application while the entity manager was open.
   *
   * @param {(Class<binding.Entity>|string)} entityClass
   * @param {string=} key
   */
  getReference(entityClass, key) {
    let id;
    let type;
    if (key) {
      const keyAsStr = key;
      type = this.metamodel.entity(entityClass);
      if (keyAsStr.indexOf(DB_PREFIX) === 0) {
        id = keyAsStr;
      } else {
        id = type.ref + '/' + encodeURIComponent(keyAsStr);
      }
    } else if (typeof entityClass === 'string') {
      const keyIndex = entityClass.indexOf('/', DB_PREFIX.length); // skip /db/
      if (keyIndex !== -1) {
        id = entityClass;
      }
      type = this.metamodel.entity(keyIndex === -1 ? entityClass : id.substring(0, keyIndex));
    } else {
      type = this.metamodel.entity(entityClass);
    }

    let entity = this.entities[id];
    if (!entity) {
      entity = type.create();
      const metadata = Metadata.get(entity);
      if (id) {
        metadata.id = id;
      }
      metadata.setUnavailable();
      this._attach(entity);
    }

    return entity;
  }

  /**
   * Creates an instance of Query.Builder for query creation and execution. The Query results are instances of the
   * resultClass argument.
   * @alias EntityManager.prototype.createQueryBuilder<T>
   * @param {Class<T>=} resultClass - the type of the query result
   * @return {query.Builder<T>} A query builder to create one ore more queries for the specified class
   */
  createQueryBuilder(resultClass) {
    return new query.Builder(this, resultClass);
  }

  /**
   * Clear the persistence context, causing all managed entities to become detached.
   * Changes made to entities that have not been flushed to the database will not be persisted.
   */
  clear() {
    this.entities = {};
  }

  /**
   * Close an application-managed entity manager. After the close method has been invoked,
   * all methods on the EntityManager instance and any Query and TypedQuery objects obtained from it
   * will throw the IllegalStateError except for transaction, and isOpen (which will return false).
   * If this method is called when the entity manager is associated with an active transaction,
   * the persistence context remains managed until the transaction completes.
   */
  close() {
    this.connection = null;

    return this.clear();
  }

  /**
   * Check if the instance is a managed entity instance belonging to the current persistence context.
   * @param {binding.Entity} entity - entity instance
   * @returns {boolean} boolean indicating if entity is in persistence context
   */
  contains(entity) {
    return !!entity && this.entities[entity.id] === entity;
  }

  /**
   * Check if an object with the id from the given entity is already attached.
   * @param {binding.Entity} entity - entity instance
   * @returns {boolean} boolean indicating if entity with same id is attached
   */
  containsById(entity) {
    return !!(entity && this.entities[entity.id]);
  }

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached.
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue
   * to reference it.
   * @param {binding.Entity} entity - entity instance
   */
  detach(entity) {
    const state = Metadata.get(entity);
    return state.withLock(() => {
      this.removeReference(entity);
      return Promise.resolve(entity);
    });
  }

  /**
   * Resolve the depth by loading the referenced objects of the given entity.
   *
   * @param {binding.Entity} entity - entity instance
   * @param {Object} [options] The load options
   * @return {Promise<binding.Entity>}
   */
  resolveDepth(entity, options) {
    if (!options || !options.depth) {
      return Promise.resolve(entity);
    }

    options.resolved = options.resolved || [];

    const promises = [];
    const subOptions = Object.assign({}, options, {
      depth: options.depth === true ? true : options.depth - 1,
    });
    this.getSubEntities(entity, 1).forEach((subEntity) => {
      if (subEntity !== null && options.resolved.indexOf(subEntity) === -1) {
        options.resolved.push(subEntity);
        promises.push(this.load(subEntity.id, null, subOptions));
      }
    });

    return Promise.all(promises).then(() => entity);
  }

  /**
   * Search for an entity of the specified oid.
   * If the entity instance is contained in the persistence context, it is returned from there.
   * @param {(Class<binding.Entity>|string)} entityClass - entity class
   * @param {String} oid - Object ID
   * @param {Object} [options] The load options.
   * @return {Promise<binding.Entity>} the loaded entity or null
   */
  load(entityClass, oid, options) {
    const opt = options || {};
    const entity = this.getReference(entityClass, oid);
    const state = Metadata.get(entity);

    if (!opt.refresh && opt.local && state.isAvailable) {
      return this.resolveDepth(entity, opt);
    }

    const msg = new messages.GetObject(state.bucket, state.key);

    this.ensureCacheHeader(entity.id, msg, opt.refresh);

    return this.send(msg).then((response) => {
      // refresh object if loaded older version from cache
      // chrome doesn't using cache when ifNoneMatch is set
      if (entity.version > response.entity.version) {
        opt.refresh = true;
        return this.load(entityClass, oid, opt);
      }

      this.addToWhiteList(response.entity.id);

      if (response.status !== StatusCode.NOT_MODIFIED) {
        state.setJson(response.entity, { persisting: true });
      }

      return this.resolveDepth(entity, opt);
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        this.removeReference(entity);
        state.setRemoved();
        return null;
      }

      throw e;
    });
  }

  /**
   * @param {binding.Entity} entity
   * @param {Object} options
   * @return {Promise<binding.Entity>}
   */
  insert(entity, options) {
    const opt = options || {};
    let isNew;

    return this._save(entity, opt, (state, json) => {
      if (state.version) {
        throw new error.PersistentError('Existing objects can\'t be inserted.');
      }

      isNew = !state.id;

      return new messages.CreateObject(state.bucket, json);
    }).then((val) => {
      if (isNew) {
        this._attach(entity);
      }

      return val;
    });
  }

  /**
   * @param {binding.Entity} entity
   * @param {Object} options
   * @return {Promise<binding.Entity>}
   */
  update(entity, options) {
    const opt = options || {};

    return this._save(entity, opt, (state, json) => {
      if (!state.version) {
        throw new error.PersistentError('New objects can\'t be inserted.');
      }

      if (opt.force) {
        delete json.version;
        return new messages.ReplaceObject(state.bucket, state.key, json)
          .ifMatch('*');
      }

      return new messages.ReplaceObject(state.bucket, state.key, json)
        .ifMatch(state.version);
    });
  }

  /**
   * @param {binding.Entity} entity
   * @param {Object} options The save options
   * @param {boolean=} withoutLock Set true to save the entity without locking
   * @return {Promise<binding.Entity>}
   */
  save(entity, options, withoutLock) {
    const opt = options || {};

    const msgFactory = (state, json) => {
      if (opt.force) {
        if (!state.id) {
          throw new error.PersistentError('New special objects can\'t be forcedly saved.');
        }

        delete json.version;
        return new messages.ReplaceObject(state.bucket, state.key, json);
      }

      if (state.version) {
        return new messages.ReplaceObject(state.bucket, state.key, json)
          .ifMatch(state.version);
      }

      return new messages.CreateObject(state.bucket, json);
    };

    return withoutLock ? this._locklessSave(entity, opt, msgFactory) : this._save(entity, opt, msgFactory);
  }

  /**
   * @param {binding.Entity} entity
   * @param {Function} cb pre-safe callback
   * @return {Promise<binding.Entity>}
   */
  optimisticSave(entity, cb) {
    return Metadata.get(entity).withLock(() => this._optimisticSave(entity, cb));
  }

  /**
   * @param {binding.Entity} entity
   * @param {Function} cb pre-safe callback
   * @return {Promise<binding.Entity>}
   * @private
   */
  _optimisticSave(entity, cb) {
    let abort = false;
    const abortFn = () => {
      abort = true;
    };
    const promise = Promise.resolve(cb(entity, abortFn));

    if (abort) {
      return Promise.resolve(entity);
    }

    return promise.then(() => (
      this.save(entity, {}, true)
        .catch((e) => {
          if (e.status === 412) {
            return this.refresh(entity, {})
              .then(() => this._optimisticSave(entity, cb));
          }

          throw e;
        })
    ));
  }

  /**
   * Save the object state without locking
   * @param {binding.Entity} entity
   * @param {Object} options
   * @param {Function} msgFactory
   * @return {Promise.<binding.Entity>}
   * @private
   */
  _locklessSave(entity, options, msgFactory) {
    this.attach(entity);
    const state = Metadata.get(entity);
    let refPromises;

    let json;
    if (state.isAvailable) {
      // getting json will check all collections changes, therefore we must do it before proofing the dirty state
      json = state.getJson({
        persisting: true,
      });
    }

    if (state.isDirty) {
      if (!options.refresh) {
        state.setPersistent();
      }

      const sendPromise = this.send(msgFactory(state, json)).then((response) => {
        state.setJson(response.entity, {
          persisting: options.refresh,
          onlyMetadata: !options.refresh,
        });
        return entity;
      }, (e) => {
        if (e.status === StatusCode.OBJECT_NOT_FOUND) {
          this.removeReference(entity);
          state.setRemoved();
          return null;
        }

        state.setDirty();
        throw e;
      });

      refPromises = [sendPromise];
    } else {
      refPromises = [Promise.resolve(entity)];
    }

    const subOptions = Object.assign({}, options);
    subOptions.depth = 0;
    this.getSubEntities(entity, options.depth).forEach((sub) => {
      refPromises.push(this._save(sub, subOptions, msgFactory));
    });

    return Promise.all(refPromises).then(() => entity);
  }

  /**
   * Save and lock the object state
   * @param {binding.Entity} entity
   * @param {Object} options
   * @param {Function} msgFactory
   * @return {Promise.<binding.Entity>}
   * @private
   */
  _save(entity, options, msgFactory) {
    this.ensureBloomFilterFreshness();

    const state = Metadata.get(entity);
    if (state.version) {
      this.addToBlackList(entity.id);
    }

    return state.withLock(() => this._locklessSave(entity, options, msgFactory));
  }

  /**
   * Returns all referenced sub entities for the given depth and root entity
   * @param {binding.Entity} entity
   * @param {boolean|number} depth
   * @param {binding.Entity[]} [resolved]
   * @param {binding.Entity=} initialEntity
   * @returns {binding.Entity[]}
   */
  getSubEntities(entity, depth, resolved, initialEntity) {
    let resolv = resolved || [];
    if (!depth) {
      return resolv;
    }

    const obj = initialEntity || entity;
    const state = Metadata.get(entity);
    const iter = state.type.references();
    for (let item = iter.next(); !item.done; item = iter.next()) {
      const value = item.value;
      const subEntities = this.getSubEntitiesByPath(entity, value.path);
      for (let i = 0, len = subEntities.length; i < len; i += 1) {
        const subEntity = subEntities[i];
        if (resolv.indexOf(subEntity) === -1 && subEntity !== obj) {
          resolv.push(subEntity);
          resolv = this.getSubEntities(subEntity, depth === true ? depth : depth - 1, resolv, obj);
        }
      }
    }

    return resolv;
  }

  /**
   * Returns all referenced one level sub entities for the given path
   * @param {binding.Entity} entity
   * @param {Array<string>} path
   * @returns {binding.Entity[]}
   */
  getSubEntitiesByPath(entity, path) {
    let subEntities = [entity];

    path.forEach((attributeName) => {
      const tmpSubEntities = [];
      subEntities.forEach((subEntity) => {
        const curEntity = subEntity[attributeName];
        if (!curEntity) {
          return;
        }

        const attribute = this.metamodel.managedType(subEntity.constructor).getAttribute(attributeName);
        if (attribute.isCollection) {
          const iter = curEntity.entries();
          for (let item = iter.next(); !item.done; item = iter.next()) {
            const entry = item.value;
            tmpSubEntities.push(entry[1]);
            if (attribute.keyType && attribute.keyType.isEntity) {
              tmpSubEntities.push(entry[0]);
            }
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
   * @param {binding.Entity} entity
   * @param {Object} options The delete options
   * @return {Promise<binding.Entity>}
   */
  'delete'(entity, options) {
    const opt = options || {};

    this.attach(entity);
    const state = Metadata.get(entity);

    return state.withLock(() => {
      if (!state.version && !opt.force) {
        throw new error.IllegalEntityError(entity);
      }

      const msg = new messages.DeleteObject(state.bucket, state.key);

      this.addToBlackList(entity.id);

      if (!opt.force) {
        msg.ifMatch(state.version);
      }

      const refPromises = [this.send(msg).then(() => {
        this.removeReference(entity);
        state.setRemoved();
        return entity;
      })];

      const subOptions = Object.assign({}, opt);
      subOptions.depth = 0;
      this.getSubEntities(entity, opt.depth).forEach((sub) => {
        refPromises.push(this.delete(sub, subOptions));
      });

      return Promise.all(refPromises).then(() => entity);
    });
  }

  /**
   * Synchronize the persistence context to the underlying database.
   *
   * @returns {Promise<*>}
   */
  flush() {
    // TODO: implement this
  }

  /**
   * Make an instance managed and persistent.
   * @param {binding.Entity} entity - entity instance
   */
  persist(entity) {
    this.attach(entity);
  }

  /**
   * Refresh the state of the instance from the database, overwriting changes made to the entity, if any.
   * @param {binding.Entity} entity - entity instance
   * @param {Object} options The refresh options
   * @return {Promise<binding.Entity>}
   */
  refresh(entity, options) {
    const opt = options || {};
    opt.refresh = true;

    return this.load(entity.id, null, opt);
  }

  /**
   * Attach the instance to this database context, if it is not already attached
   * @param {binding.Entity} entity The entity to attach
   */
  attach(entity) {
    if (!this.contains(entity)) {
      const type = this.metamodel.entity(entity.constructor);
      if (!type) {
        throw new error.IllegalEntityError(entity);
      }

      if (this.containsById(entity)) {
        throw new error.EntityExistsError(entity);
      }

      this._attach(entity);
    }
  }

  _attach(entity) {
    const metadata = Metadata.get(entity);
    if (metadata.isAttached) {
      if (metadata.db !== this) {
        throw new error.EntityExistsError(entity);
      }
    } else {
      metadata.db = this;
    }

    if (!metadata.id) {
      if (metadata.type.name !== 'User' && metadata.type.name !== 'Role' && metadata.type.name !== 'logs.AppLog') {
        metadata.id = DB_PREFIX + metadata.type.name + '/' + util.uuid();
      }
    }

    if (metadata.id) {
      this.entities[metadata.id] = entity;
    }
  }

  removeReference(entity) {
    const state = Metadata.get(entity);
    if (!state) {
      throw new error.IllegalEntityError(entity);
    }

    delete this.entities[state.id];
  }

  register(user, password, loginOption) {
    const login = loginOption > UserFactory.LoginOption.NO_LOGIN;
    if (this.me && login) {
      throw new error.PersistentError('User is already logged in.');
    }

    return this.withLock(() => {
      const msg = new messages.Register({ user, password, login });
      return this._userRequest(msg, loginOption);
    });
  }

  login(username, password, loginOption) {
    if (this.me) {
      throw new error.PersistentError('User is already logged in.');
    }

    return this.withLock(() => {
      const msg = new messages.Login({ username, password });
      return this._userRequest(msg, loginOption);
    });
  }

  logout() {
    return this.withLock(() => this.send(new messages.Logout()).then(this._logout.bind(this)));
  }

  loginWithOAuth(provider, clientID, options) {
    if (this.me) {
      throw new error.PersistentError('User is already logged in.');
    }

    const opt = Object.assign({
      title: 'Login with ' + provider,
      timeout: 5 * 60 * 1000,
      state: {},
      loginOption: true,
    }, options);

    if (opt.redirect) {
      Object.assign(opt.state, { redirect: opt.redirect, loginOption: opt.loginOption });
    }

    let msg;
    if (Message[provider + 'OAuth']) {
      msg = new Message[provider + 'OAuth'](clientID, opt.scope, JSON.stringify(opt.state));
      msg.addRedirectOrigin(this.connection.origin + this.connection.basePath);
    } else {
      throw new Error('OAuth provider ' + provider + ' not supported.');
    }

    const windowOptions = { width: opt.width, height: opt.height };
    if (opt.redirect) {
      // use oauth via redirect by opening the login in the same window
      // for app wrappers we need to open the system browser
      const isBrowser = document.URL.indexOf('http://') !== -1 || document.URL.indexOf('https://') !== -1;
      this.openOAuthWindow(msg.request.path, isBrowser ? '_self' : '_system', windowOptions);
      return new Promise(() => {});
    }

    const req = this._userRequest(msg, opt.loginOption);
    this.openOAuthWindow(msg.request.path, opt.title, windowOptions);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new error.PersistentError('OAuth login timeout.'));
      }, opt.timeout);

      req.then(resolve, reject).then(() => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Opens a new window use for OAuth logins
   * @param url The url to open
   * @param targetOrTitle The target of the window, or the title of the popup
   * @param options Additional window options
   */
  openOAuthWindow(url, targetOrTitle, options) {
    const str = Object.keys(options)
      .filter(key => options[key] !== undefined)
      .map(key => key + '=' + options[key])
      .join(',');

    open(url, targetOrTitle, str); // eslint-disable-line no-restricted-globals
  }

  renew(loginOption) {
    return this.withLock(() => {
      const msg = new messages.Me();
      return this._userRequest(msg, loginOption);
    });
  }

  newPassword(username, password, newPassword) {
    return this.withLock(() => {
      const msg = new messages.NewPassword({ username, password, newPassword });

      return this.send(msg, true).then(response => this._updateUser(response.entity));
    });
  }

  newPasswordWithToken(token, newPassword, loginOption) {
    return this.withLock(() => (
      this._userRequest(new messages.NewPassword({ token, newPassword }), loginOption)
    ));
  }

  resetPassword(username) {
    return this.send(new messages.ResetPassword({ username }));
  }

  _updateUser(obj, updateMe) {
    const user = this.getReference(obj.id);
    const metadata = Metadata.get(user);
    metadata.setJson(obj, { persisting: true });

    if (updateMe) {
      this.me = user;
    }

    return user;
  }

  _logout() {
    this.me = null;
    this.token = null;
  }

  _userRequest(msg, loginOption) {
    const opt = loginOption === undefined ? true : loginOption;
    const login = opt > UserFactory.LoginOption.NO_LOGIN;
    if (login) {
      this.tokenStorage.temporary = opt < UserFactory.LoginOption.PERSIST_LOGIN;
    }

    return this.send(msg, !login)
      .then(
        response => (response.entity ? this._updateUser(response.entity, login) : null),
        (e) => {
          if (e.status === StatusCode.OBJECT_NOT_FOUND) {
            if (login) {
              this._logout();
            }
            return null;
          }

          throw e;
        }
      );
  }

  registerDevice(os, token, device) {
    const msg = new messages.DeviceRegister({
      token,
      device,
      devicetype: os,
    });

    msg.withCredentials = true;
    return this.send(msg);
  }

  checkDeviceRegistration() {
    return this.send(new messages.DeviceRegistered())
      .then(() => {
        this.isDeviceRegistered = true;
        return true;
      }, (e) => {
        if (e.status === StatusCode.OBJECT_NOT_FOUND) {
          this.isDeviceRegistered = false;
          return false;
        }

        throw e;
      });
  }

  pushDevice(pushMessage) {
    return this.send(new messages.DevicePush(pushMessage));
  }

  /**
   * The given entity will be checked by the validation code of the entity type.
   *
   * @param {binding.Entity} entity
   * @returns {util.ValidationResult} result
   */
  validate(entity) {
    const type = Metadata.get(entity).type;

    const result = new util.ValidationResult();
    const iter = type.attributes();
    for (let item = iter.next(); !item.done; item = iter.next()) {
      const validate = new util.Validator(item.value.name, entity);
      result.fields[validate.key] = validate;
    }

    const validationCode = type.validationCode;
    if (validationCode) {
      validationCode(result.fields);
    }

    return result;
  }

  /**
   * Adds the given object id to the cacheWhiteList if needed.
   * @param {string} objectId The id to add.
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
   * @param {string} objectId The id to add.
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
    if (this.isCachingDisabled) {
      return Promise.resolve();
    }

    const msg = new messages.GetBloomFilter();
    msg.noCache();
    return this.send(msg).then((response) => {
      this.updateBloomFilter(response.entity);
      return this.bloomFilter;
    });
  }

  updateBloomFilter(bloomFilter) {
    this.bloomFilter = new BloomFilter(bloomFilter);
    this.cacheWhiteList = new Set();
    this.cacheBlackList = new Set();
  }

  /**
   * Checks the freshness of the bloom filter and does a reload if necessary
   */
  ensureBloomFilterFreshness() {
    if (this.isCachingDisabled) {
      return;
    }

    const now = new Date().getTime();
    const refreshRate = this.bloomFilterRefresh * 1000;

    if (this.bloomFilterLock.isReady && now - this.bloomFilter.creation > refreshRate) {
      this.bloomFilterLock.withLock(() => this.refreshBloomFilter());
    }
  }

  /**
   * Checks for a given id, if revalidation is required, the resource is stale or caching was disabled
   * @param {string} id The object id to check
   * @returns {boolean} Indicates if the resource must be revalidated
   */
  mustRevalidate(id) {
    if (util.isNode) {
      return false;
    }

    this.ensureBloomFilterFreshness();

    let refresh = this.isCachingDisabled || !this.bloomFilterLock.isReady;
    refresh = refresh || (
      !this.cacheWhiteList.has(id)
      && (this.cacheBlackList.has(id) || this.bloomFilter.contains(id))
    );
    return refresh;
  }

  /**
   *
   * @param {string} id To check the bloom filter
   * @param {connection.Message} message To attach the headers
   * @param {boolean} refresh To force the reload headers
   */
  ensureCacheHeader(id, message, refresh) {
    const noCache = refresh || this.mustRevalidate(id);

    if (noCache) {
      message.noCache();
    }
  }

  /**
   * Creates a absolute url for the given relative one
   * @param {string} relativePath the relative url
   * @param {boolean=} authorize indicates if authorization credentials should be generated and be attached to the url
   * @return {string} a absolute url wich is optionaly signed with a resource token which authenticates the currently
   * logged in user
   */
  createURL(relativePath, authorize) {
    let path = this.connection.basePath + relativePath;

    let append = false;
    if (authorize && this.me) {
      path = this.tokenStorage.signPath(path);
      append = true;
    } else {
      path = path.split('/').map(encodeURIComponent).join('/');
    }

    if (this.mustRevalidate(relativePath)) {
      path = path + (append ? '&' : '?') + 'BCB';
    }

    return this.connection.origin + path;
  }
}

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
 * @param {string|number|Object|Array<number>} [latitude] A coordinate pair (latitude first), a GeoPoint like object or
 * the GeoPoint's latitude
 * @param {number=} longitude The GeoPoint's longitude
 * @return {void} The new created GeoPoint
 */
EntityManager.prototype.GeoPoint = require('./GeoPoint');

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
 * The Role factory can be called to create new instances of roles, later on users can be attached to roles to manage
 * the access permissions through this role
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

deorecated(EntityManager.prototype, '_connector', 'connection');
deorecated(EntityManager.prototype, '_entities', 'entities');
deorecated(EntityManager.prototype, '_bloomFilterLock', 'bloomFilterLock');

module.exports = EntityManager;
