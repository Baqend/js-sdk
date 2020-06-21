'use strict';

import * as messages from "./message";
import {
  FileFactory,
  UserFactory,
  Entity,
  ManagedFactory,
  Managed,
  EntityFactory,
  DeviceFactory,
  LoginOption
} from "./binding";
import {
  atob,
  Class,
  isNode,
  JsonMap,
  Lockable,
  uuid,
  deprecated,
} from "./util";
import { Message, StatusCode } from "./connector";
import { BloomFilter } from "./caching";
import { GeoPoint } from "./GeoPoint";
import { ConnectData, EntityManagerFactory } from "./EntityManagerFactory";
import { model } from "./model";
import { Metamodel } from "./metamodel/Metamodel";
import { Connector } from "./connector";
import { Builder } from "./query";
import { EntityExistsError, IllegalEntityError, PersistentError } from './error';
import { MapAttribute } from "./metamodel/MapAttribute";
import Device = model.Device;
import { ManagedType, PluralAttribute } from "./metamodel";
import { Code, Logger, Metadata, Modules, TokenStorage, ValidationResult, Validator } from "./intersection";

const DB_PREFIX = '/db/';

type MessageFactory = (state: Metadata, json: JsonMap) => Message;

export class EntityManager extends Lockable {
  /**
   * Constructor for a new List collection
   */
  public readonly List = Array;

  /**
   * Constructor for a new Set collection
   */
  public readonly Set = Set;

  /**
   * Constructor for a new Map collection
   */
  public readonly Map = Map;

  /**
   * Constructor for a new GeoPoint
   */
  public readonly GeoPoint = GeoPoint;

  /**
   * Determine whether the entity manager is open.
   * true until the entity manager has been closed
   */
  get isOpen(): boolean {
    return !!this.connection;
  }

  /**
   * The authentication token if the user is logged in currently
   */
  get token(): string | null {
    return this.tokenStorage.token;
  }

  /**
   * Whether caching is disabled
   * @deprecated
   */
  get isCachingDisabled() {
    console.log('isCachingDisabled is deprecated use isCachingEnabled() instead.');
    return !this.isCachingEnabled();
  }

  /**
   * Whether caching is enabled
   */
  isCachingEnabled(): this is { bloomFilter: BloomFilter, cacheWhiteList: Set<string>, cacheBlackList: Set<string> } {
    return !!this.bloomFilter;
  }

  /**
   * Returns true if the device token is already registered, otherwise false.
   */
  get isDeviceRegistered(): boolean {
    return !!this.deviceMe;
  }

  /**
   * The authentication token if the user is logged in currently
   * @param value
   */
  set token(value: string | null) {
    this.tokenStorage!.update(value);
  }

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
   */
  public readonly log: Logger = Logger.create(this);

  /**
   * The connector used for requests
   */
  public connection : Connector | null = null ; // is never null after em is ready

  /**
   * All managed and cached entity instances
   * @type Map<String,Entity>
   * @private
   */
  private entities: { [id: string]: Entity } = {};

  public readonly entityManagerFactory: EntityManagerFactory;
  public readonly metamodel: Metamodel;
  public readonly code: Code;
  public readonly modules: Modules = new Modules(this);

  /**
   * The current logged in user object
   */
  public me: model.User | null = null;

  /**
   * The current registered device object
   */
  public deviceMe: model.Device | null = null;

  /**
   * Returns the tokenStorage which will be used to authorize all requests.
   */
  public tokenStorage: TokenStorage = null as any; // is never null after em is ready

  /**
   * The bloom filter which contains staleness information of cached objects
   */
  public bloomFilter: BloomFilter | null = null;

  /**
   * Set of object ids that were revalidated after the Bloom filter was loaded.
   */
  public cacheWhiteList: Set<string> | null = null;

  /**
   * Set of object ids that were updated but are not yet included in the bloom filter.
   * This set essentially implements revalidation by side effect which does not work in Chrome.
   */
  public cacheBlackList: Set<string> | null = null;

  /**
   * Bloom filter refresh interval in seconds.
   */
  public bloomFilterRefresh: number = 60;

  /**
   * Bloom filter refresh Promise
   */
  public readonly bloomFilterLock = new Lockable();

  /**
   * A File factory for file objects.
   * The file factory can be called to create new instances for files.
   * The created instances implements the {@link File} interface
   */
  public File: FileFactory = null as any; // is never null after the em is ready

  /**
   * @param entityManagerFactory The factory which of this entityManager instance
   */
  constructor(entityManagerFactory: EntityManagerFactory) {
    super();
    this.entityManagerFactory = entityManagerFactory;
    this.metamodel = entityManagerFactory.metamodel;
    this.code = entityManagerFactory.code;
  }

  /**
   * Connects this entityManager, used for synchronous and asynchronous initialization
   * @param connector
   * @param connectData
   * @param tokenStorage The used tokenStorage for token persistence
   */
  connected(connector: Connector, connectData: ConnectData, tokenStorage: TokenStorage) {
    this.connection = connector;
    this.tokenStorage = tokenStorage;
    this.bloomFilterRefresh = this.entityManagerFactory.staleness!;

    this.File = FileFactory.create(this);
    this._createObjectFactory(this.metamodel.embeddables);
    this._createObjectFactory(this.metamodel.entities);

    if (connectData) {
      if (connectData.device) {
        this.updateDevice(connectData.device);
      }

      if (connectData.user && tokenStorage.token) {
        this._updateUser(connectData.user, true);
      }

      if (this.bloomFilterRefresh > 0 && connectData.bloomFilter && atob && !isNode) {
        this.updateBloomFilter(connectData.bloomFilter);
      }
    }
  }

  /**
   * @param types
   * @return    * @private
   */
  _createObjectFactory(types: {[type: string]: ManagedType<any>}): void {
    Object.entries(types).forEach(([ref, type]) => {
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

  send(mesage, ignoreCredentialError = true) {
    if (!this.connection) {
      throw new Error("This EntityManager is not connected.")
    }

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
   * Get an instance whose state may be lazily fetched
   *
   * If the requested instance does not exist in the database, the
   * EntityNotFoundError is thrown when the instance state is first accessed.
   * The application should not expect that the instance state will be available upon detachment,
   * unless it was accessed by the application while the entity manager was open.
   *
   * @param entityClass
   * @param key
   * @return
   */
  getReference<T extends Entity>(entityClass: Class<T> | string, key?: string): T {
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

    let entity = this.entities[id] as T;
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
   * Creates an instance of {@link Builder<T>} for query creation and execution
   *
   * The query results are instances of the resultClass argument.
   *
   * @param resultClass - the type of the query result
   * @return A query builder to create one ore more queries for the specified class
   */
  createQueryBuilder<T extends Entity>(resultClass: Class<T>): Builder<T> {
    return new Builder(this, resultClass);
  }

  /**
   * Clear the persistence context, causing all managed entities to become detached
   *
   * Changes made to entities that have not been flushed to the database will not be persisted.
   *
   * @return
   */
  clear(): void {
    this.entities = {};
  }

  /**
   * Close an application-managed entity manager
   *
   * After the close method has been invoked, all methods on the EntityManager instance
   * and any Query and TypedQuery objects obtained from it will throw the IllegalStateError
   * except for transaction, and isOpen (which will return false). If this method
   * is called when the entity manager is associated with an active transaction,
   * the persistence context remains managed until the transaction completes.
   *
   * @return
   */
  close(): void {
    this.connection = null;

    return this.clear();
  }

  /**
   * Check if the instance is a managed entity instance belonging to the current persistence context
   *
   * @param entity - entity instance
   * @return boolean indicating if entity is in persistence context
   */
  contains(entity: Entity): boolean {
    return !!entity && !!entity.id && this.entities[entity.id] === entity;
  }

  /**
   * Check if an object with the id from the given entity is already attached
   *
   * @param entity - entity instance
   * @return boolean indicating if entity with same id is attached
   */
  containsById(entity: Entity): boolean {
    return !!(entity && entity.id && this.entities[entity.id]);
  }

  /**
   * Remove the given entity from the persistence context, causing a managed entity to become detached
   *
   * Unflushed changes made to the entity if any (including removal of the entity),
   * will not be synchronized to the database. Entities which previously referenced the detached entity will continue
   * to reference it.
   *
   * @param entity The entity instance to detach.
   * @return
   */
  detach(entity: Entity): Promise<Entity> {
    const state = Metadata.get(entity);
    return state.withLock(() => {
      this.removeReference(entity);
      return Promise.resolve(entity);
    });
  }

  /**
   * Resolve the depth by loading the referenced objects of the given entity
   *
   * @param entity - entity instance
   * @param [options] The load options
   * @return
   */
  resolveDepth<T extends Entity>(entity: T, options?: { refresh?: boolean, local?: boolean, depth?: number | boolean, resolved?: Entity[]}): Promise<T> {
    if (!options || !options.depth) {
      return Promise.resolve(entity);
    }

    options.resolved = options.resolved || [];

    const promises: Promise<Entity | null>[] = [];
    const subOptions = {
      ...options,
      depth: options.depth === true ? true : options.depth - 1,
    };

    this.getSubEntities(entity, 1).forEach((subEntity: Entity) => {
      if (subEntity !== null && options.resolved!.indexOf(subEntity) === -1 && subEntity.id) {
        options.resolved!.push(subEntity);
        promises.push(this.load(subEntity.id, undefined, subOptions));
      }
    });

    return Promise.all(promises).then(() => entity);
  }

  /**
   * Search for an entity of the specified oid
   *
   * If the entity instance is contained in the persistence context, it is returned from there.
   *
   * @param entityClass - entity class
   * @param oid - Object ID
   * @param [options] The load options.
   * @return the loaded entity or null
   */
  load<T extends Entity> (
      entityClass: Class<T> | string,
      oid?: string,
      options?: { refresh?: boolean, local?: boolean }
  ) : Promise<T | null>
  {
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
      if (entity.version && entity.version > response.entity.version) {
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
   * @param entity
   * @param options
   * @return
   */
  insert(entity: Entity, options?: { depth?: number | boolean, refresh?: boolean }): Promise<Entity> {
    const opt = options || {};
    let isNew;

    return this._save(entity, opt, (state, json) => {
      if (state.version) {
        throw new PersistentError('Existing objects can\'t be inserted.');
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
   * @param entity
   * @param options
   * @return
   */
  update(entity: Entity, options?: { force?: boolean, depth?: number | boolean, refresh?: boolean }): Promise<Entity> {
    const opt = options || {};

    return this._save(entity, opt, (state, json) => {
      if (!state.version) {
        throw new PersistentError('New objects can\'t be inserted.');
      }

      if (opt.force) {
        delete json.version;
        return new messages.ReplaceObject(state.bucket, state.key, json)
          .ifMatch('*');
      }

      return new messages.ReplaceObject(state.bucket, state.key, json)
        .ifMatch(state.version + '');
    });
  }

  /**
   * @param entity
   * @param options The save options
   * @param withoutLock Set true to save the entity without locking
   * @return
   */
  save<E extends Entity>(entity: E, options?: { force?: boolean, depth?: number | boolean, refresh?: boolean}, withoutLock = false): Promise<E> {
    const opt = options || {};

    const msgFactory = (state, json) => {
      if (opt.force) {
        if (!state.id) {
          throw new PersistentError('New special objects can\'t be forcedly saved.');
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
   * @param entity
   * @param cb pre-safe callback
   * @return
   */
  optimisticSave<E extends Entity>(entity: E, cb: (entity: E, abort: () => void) => any): Promise<E> {
    return Metadata.get(entity).withLock(() => this._optimisticSave(entity, cb));
  }

  /**
   * @param entity
   * @param cb pre-safe callback
   * @return
   * @private
   */
  _optimisticSave<E extends Entity>(entity: E, cb: (entity: E, abort: () => void) => any): Promise<E> {
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
   * @param entity
   * @param options
   * @param msgFactory
   * @return
   * @private
   */
  _locklessSave<T extends Entity>(entity: T, options: { depth?: number | boolean, refresh?: boolean }, msgFactory: MessageFactory): Promise<T> {
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
        if (state.id && state.id !== response.entity.id) {
          this.removeReference(entity);
          state.id = response.entity.id;
          this._attach(entity);
        }

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
   * @param entity
   * @param options
   * @param msgFactory
   * @return
   * @private
   */
  _save<T extends Entity>(entity: T, options: { depth?: number | boolean, refresh?: boolean }, msgFactory: MessageFactory): Promise<T> {
    this.ensureBloomFilterFreshness();

    const state = Metadata.get(entity);
    if (state.version) {
      this.addToBlackList(entity.id);
    }

    return state.withLock(() => this._locklessSave(entity, options, msgFactory));
  }

  /**
   * Returns all referenced sub entities for the given depth and root entity
   * @param entity
   * @param depth
   * @param [resolved]
   * @param initialEntity
   * @return
   */
  getSubEntities(entity: Entity, depth?: boolean | number, resolved: Entity[] = [], initialEntity? : Entity): Entity[] {
    if (!depth) {
      return resolved;
    }

    const obj = initialEntity || entity;
    const state = Metadata.get(entity);
    const iter = state.type.references();
    for (let item = iter.next(); !item.done; item = iter.next()) {
      const value = item.value;
      const subEntities = this.getSubEntitiesByPath(entity, value.path);
      for (let i = 0, len = subEntities.length; i < len; i += 1) {
        const subEntity = subEntities[i];
        if (resolved.indexOf(subEntity) === -1 && subEntity !== obj) {
          resolved.push(subEntity);
          resolved = this.getSubEntities(subEntity, depth === true ? depth : depth - 1, resolved, obj);
        }
      }
    }

    return resolved;
  }

  /**
   * Returns all referenced one level sub entities for the given path
   * @param entity
   * @param path
   * @return
   */
  getSubEntitiesByPath(entity: Entity, path: string[]): Entity[] {
    let subEntities = [entity];

    path.forEach((attributeName) => {
      const tmpSubEntities: Entity[] = [];
      subEntities.forEach((subEntity) => {
        const curEntity = subEntity[attributeName];
        if (!curEntity) {
          return;
        }

        const attribute = this.metamodel.managedType(subEntity.constructor)!.getAttribute(attributeName);
        if (attribute instanceof PluralAttribute) {
          const iter = curEntity.entries();
          for (let item = iter.next(); !item.done; item = iter.next()) {
            const entry = item.value;
            tmpSubEntities.push(entry[1]);
            if (attribute instanceof MapAttribute && attribute.keyType.isEntity) {
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
   * @param entity
   * @param options The delete options
   * @return
   */
  delete<T extends Entity>(entity: T, options?: { force?: boolean, depth?: number | boolean }): Promise<T> {
    const opt = options || {};

    this.attach(entity);
    const state = Metadata.get(entity);

    return state.withLock(() => {
      if (!state.version && !opt.force) {
        throw new IllegalEntityError(entity);
      }

      const msg = new messages.DeleteObject(state.bucket, state.key);

      this.addToBlackList(entity.id);

      if (!opt.force) {
        msg.ifMatch(state.version + '');
      }

      const refPromises: Promise<Entity>[] = [this.send(msg).then(() => {
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
   * @return
   */
  flush(): Promise<any> {
    throw new Error('Not implemented.')
  }

  /**
   * Make an instance managed and persistent.
   * @param entity - entity instance
   * @return
   */
  persist(entity: Entity): void {
    this.attach(entity);
  }

  /**
   * Refresh the state of the instance from the database, overwriting changes made to the entity, if any.
   * @param entity - entity instance
   * @param options The refresh options
   * @return
   */
  refresh<T extends Entity>(entity: T, options: { depth?: number | boolean }): Promise<T | null> {
    if (!entity.id) {
      // entity is not persisted so far
      return Promise.resolve(entity);
    }

    return this.load(entity.id, undefined, { ...options, refresh: true });
  }

  /**
   * Attach the instance to this database context, if it is not already attached
   * @param entity The entity to attach
   * @return
   */
  attach(entity: Entity): void {
    if (!this.contains(entity)) {
      const type = this.metamodel.entity(entity.constructor);
      if (!type) {
        throw new IllegalEntityError(entity);
      }

      if (this.containsById(entity)) {
        throw new EntityExistsError(entity);
      }

      this._attach(entity);
    }
  }

  _attach(entity) {
    const metadata = Metadata.get(entity);
    if (metadata.isAttached) {
      if (metadata.db !== this) {
        throw new EntityExistsError(entity);
      }
    } else {
      metadata.db = this;
    }

    if (!metadata.id) {
      if (metadata.type.name !== 'User' && metadata.type.name !== 'Role' && metadata.type.name !== 'logs.AppLog') {
        metadata.id = DB_PREFIX + metadata.type.name + '/' + uuid();
      }
    }

    if (metadata.id) {
      this.entities[metadata.id] = entity;
    }
  }

  removeReference(entity) {
    const state = Metadata.get(entity);
    if (!state || !state.id) {
      throw new IllegalEntityError(entity);
    }

    delete this.entities[state.id];
  }

  register(user, password, loginOption) {
    const login = loginOption > LoginOption.NO_LOGIN;
    if (this.me && login) {
      throw new PersistentError('User is already logged in.');
    }

    return this.withLock(() => {
      const msg = new messages.Register({ user, password, login });
      return this._userRequest(msg, loginOption);
    });
  }

  login(username, password, loginOption) {
    if (this.me) {
      throw new PersistentError('User is already logged in.');
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
    if (!this.connection) {
      throw new Error("This EntityManager is not connected.")
    }

    if (this.me) {
      throw new PersistentError('User is already logged in.');
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
        reject(new PersistentError('OAuth login timeout.'));
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
   * @return
   */
  openOAuthWindow(url: string, targetOrTitle: string, options: {[option: string]: string}): void {
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

  changeUsername(username, newUsername, password) {
    return this.send(new messages.ChangeUsername({ username, newUsername, password }));
  }

  _updateUser(obj, updateMe = false) {
    const user = this.getReference(obj.id) as model.User;
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
    const login = opt > LoginOption.NO_LOGIN;
    if (login) {
      this.tokenStorage.temporary = opt < LoginOption.PERSIST_LOGIN;
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

  /**
   * @param devicetype The OS of the device (IOS/Android)
   * @param subscription WebPush subscription
   * @param device
   * @return
   */
  registerDevice(devicetype: string, subscription: PushSubscription | { token: string }, device: model.Device | null): Promise<model.Device> {
    const msg = new messages.DeviceRegister({ devicetype, subscription, device });

    msg.withCredentials = true;
    return this.send(msg)
      .then(response => this.updateDevice(response.entity));
  }

  updateDevice(obj) {
    const device = this.getReference(obj.id);
    const metadata = Metadata.get(device);
    metadata.setJson(obj, { persisting: true });

    this.deviceMe = device;
    return device;
  }

  checkDeviceRegistration(): Promise<boolean> {
    return this.send(new messages.DeviceRegistered())
      .then(() => {
        return true;
      }, (e) => {
        if (e.status === StatusCode.OBJECT_NOT_FOUND) {
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
   * @param entity
   * @return result
   */
  validate(entity: Entity): ValidationResult {
    const type = Metadata.get(entity).type;

    const result = new ValidationResult();
    const iter = type.attributes();
    for (let item = iter.next(); !item.done; item = iter.next()) {
      const validate = new Validator(item.value.name, entity);
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
   * @param objectId The id to add.
   * @return
   */
  addToWhiteList(objectId: string): void {
    if (this.isCachingEnabled()) {
      if (this.bloomFilter.contains(objectId)) {
        this.cacheWhiteList.add(objectId);
      }
      this.cacheBlackList.delete(objectId);
    }
  }

  /**
   * Adds the given object id to the cacheBlackList if needed.
   * @param objectId The id to add.
   * @return
   */
  addToBlackList(objectId: string | null): void {
    if (this.isCachingEnabled() && objectId) {
      if (!this.bloomFilter.contains(objectId)) {
        this.cacheBlackList.add(objectId);
      }
      this.cacheWhiteList.delete(objectId);
    }
  }

  refreshBloomFilter(): Promise<BloomFilter | null> {
    if (!this.isCachingEnabled()) {
      return Promise.resolve(null);
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
  ensureBloomFilterFreshness(): void {
    if (!this.isCachingEnabled()) {
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
   * @param id The object id to check
   * @return Indicates if the resource must be revalidated
   */
  mustRevalidate(id: string): boolean {
    if (isNode) {
      return false;
    }

    this.ensureBloomFilterFreshness();

    if (!this.isCachingEnabled() || !this.bloomFilterLock.isReady) {
      return true;
    }

    return !this.cacheWhiteList.has(id) && (this.cacheBlackList.has(id) || this.bloomFilter.contains(id));
  }

  /**
   * @param id To check the bloom filter
   * @param message To attach the headers
   * @param refresh To force the reload headers
   * @return
   */
  ensureCacheHeader(id: string | null, message: Message, refresh?: boolean): void {
    const noCache = refresh || !id || this.mustRevalidate(id);

    if (noCache) {
      message.noCache();
    }
  }

  /**
   * Creates a absolute url for the given relative one
   * @param relativePath the relative url
   * @param authorize indicates if authorization credentials should be generated and be attached to the url
   * @return a absolute url wich is optionaly signed with a resource token which authenticates the currently
   * logged in user
   */
  createURL(relativePath: string, authorize?: boolean): Promise<string> {
    const connection = this.connection;
    if (!connection) {
      throw new Error("This EntityManager is not connected.");
    }

    return this.tokenStorage.signPath(connection.basePath + relativePath, authorize)
      .then(path => {
        if (this.mustRevalidate(relativePath)) {
          path += '&BCB';
        }

        return connection.origin + path;
      });
  }

  /**
   * Requests a perpetual token for the given user
   *
   * Only users with the admin role are allowed to request an API token.
   *
   * @param entityClass
   * @param user The user object or id of the user object
   * @return
   */
  requestAPIToken(entityClass: Class<model.User>, user: model.User | string): Promise<JsonMap> {
    const userObj = this._getUserReference(entityClass, user);

    const msg = new messages.UserToken(userObj.key);
    return this.send(msg).then(resp => resp.entity);
  }

  /**
   * Revoke all created tokens for the given user
   *
   * This method will revoke all previously issued tokens and the user must login again.
   *
   * @param entityClass
   * @param user The user object or id of the user object
   */
  revokeAllTokens(entityClass: Class<model.User>, user: model.User | string): Promise<any> {
    const userObj = this._getUserReference(entityClass, user);

    const msg = new messages.RevokeUserToken(userObj.key);
    return this.send(msg);
  }

  _getUserReference(entityClass, user) {
    if (typeof user === 'string') {
      return this.getReference(entityClass, user);
    }

    return user;
  }
}

export interface EntityManager extends Lockable {
  /**
   * An User factory for user objects.
   * The User factory can be called to create new instances of users or can be used to register/login/logout users.
   * The created instances implements the {@link model.User} interface
   */
  readonly User: UserFactory;

  /**
   * An Role factory for role objects.
   * The Role factory can be called to create new instances of roles, later on users can be attached to roles to manage
   * the access permissions through this role
   * The created instances implements the {@link model.Role} interface
   */
  readonly Role: EntityFactory<model.Role>;

  /**
   * An Device factory for user objects.
   * The Device factory can be called to create new instances of devices or can be used to register, push to and
   * check registration status of devices.
   */
  readonly Device: DeviceFactory;

  /**
   * An Object factory for entity or embedded objects,
   * that can be accessed by the type name of the entity type.
   * An object factory can be called to create new instances of the type.
   * The created instances implements the {@link Entity} or the {@link Managed} interface
   * whenever the class is an entity or embedded object
   * @name [YourEntityClass: string]
   * @memberOf EntityManager.prototype
   * @type {*}
   */
}
