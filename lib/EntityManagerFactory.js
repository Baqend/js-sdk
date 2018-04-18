'use strict';

const message = require('./message');
const metamodel = require('./metamodel');

const util = require('./util');
const deprecated = require('./util/deprecated');
const Connector = require('./connector/Connector');
const EntityManager = require('./EntityManager');

const CONNECTED = Symbol('Connected');

/**
 * @alias EntityManagerFactory
 * @extends util.Lockable
 */
class EntityManagerFactory extends util.Lockable {
  /**
   * Creates a new EntityManagerFactory connected to the given destination
   * @param {string|Object} [options] The destination to connect with, or an options object
   * @param {string} [options.host] The destination to connect with
   * @param {number} [options.port=80|443] The optional destination port to connect with
   * @param {boolean} [options.secure=false] <code>true</code> To use a secure ssl encrypted connection
   * @param {string} [options.basePath="/v1"] The base path of the api
   * @param {Object} [options.schema=null] The serialized schema as json used to initialize the metamodel
   * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which
   * should be used for token storage
   * @param {number} [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached
   * data
   */
  constructor(options) {
    super();

    const opt = Object(options) instanceof String ? { host: options } : options || {};

    /** @type connector.Connector */
    this.connection = null;
    /** @type metamodel.Metamodel */
    this.metamodel = this.createMetamodel();
    /** @type util.Code */
    this.code = new util.Code(this.metamodel, this);
    /** @type util.TokenStorageFactory */
    this.tokenStorageFactory = util.TokenStorage.WEB_STORAGE || util.TokenStorage.GLOBAL;

    this.configure(opt);

    let isReady = true;
    let ready = new Promise((success) => {
      this[CONNECTED] = success;
    });

    if (opt.host) {
      this.connect(opt.host, opt.port, opt.secure, opt.basePath);
    } else {
      isReady = false;
    }

    if (!this.tokenStorage) {
      isReady = false;
      ready = ready
        .then(() => this.tokenStorageFactory.create(this.connection.origin))
        .then((tokenStorage) => {
          this.tokenStorage = tokenStorage;
        });
    }

    if (opt.schema) {
      this.connectData = opt;
      this.metamodel.init(opt.schema);
    } else {
      isReady = false;
      ready = ready.then(() => {
        const msg = new message.Connect();
        msg.withCredentials = true; // used for registered devices

        if (this.staleness === 0) {
          msg.noCache();
        }

        return this.send(msg);
      }).then((response) => {
        this.connectData = response.entity;

        if (this.staleness === undefined) {
          this.staleness = this.connectData.bloomFilterRefresh || 60;
        }

        if (!this.metamodel.isInitialized) {
          this.metamodel.init(this.connectData.schema);
        }

        this.tokenStorage.update(this.connectData.token);
      });
    }

    if (!isReady) {
      this.withLock(() => ready, true);
    }
  }

  /**
   * Apply additional configurations to this EntityManagerFactory
   * @param {Object} options The additional configuration options
   * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which
   * should be used for token storage
   * @param {number} [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached
   * data, <code>0</code> to always bypass the browser cache
   */
  configure(options) {
    if (this.connection) {
      throw new Error('The EntityManagerFactory can only be configured before is is connected.');
    }

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
  }

  /**
   * Connects this EntityManager to the given destination
   * @param {string} hostOrApp The host or the app name to connect with
   * @param {number} [port=80|443] The port to connect to
   * @param {boolean} [secure=false] <code>true</code> To use a secure connection
   * @param {string} [basePath="/v1"] The base path of the api
   */
  connect(hostOrApp, port, secure, basePath) {
    if (this.connection) {
      throw new Error('The EntityManagerFactory is already connected.');
    }

    if (Object(port) instanceof Boolean) {
      return this.connect(hostOrApp, 0, port, secure);
    }

    this.connection = Connector.create(hostOrApp, port, secure, basePath);

    this[CONNECTED]();
    return this.ready();
  }

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
  createMetamodel() {
    return new metamodel.Metamodel(this);
  }

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {boolean=} useSharedTokenStorage The token storage to persist the authorization token, or
   * <code>true</code> To use the shared token storage of the emf.
   * <code>false</code> To use a instance based storage.
   *
   * @returns {EntityManager} a new entityManager
   */
  createEntityManager(useSharedTokenStorage) {
    const em = new EntityManager(this);

    if (this.isReady) {
      em.connected(
        this.connection,
        this.connectData,
        useSharedTokenStorage ? this.tokenStorage : new util.TokenStorage(this.connection.origin)
      );
    } else {
      em.withLock(() => this.ready().then(() => {
        em.connected(
          this.connection,
          this.connectData,
          useSharedTokenStorage ? this.tokenStorage : new util.TokenStorage(this.connection.origin)
        );
      }), true);
    }

    return em;
  }

  send(msg) {
    if (!msg.tokenStorage) {
      msg.tokenStorage = this.tokenStorage;
    }
    return this.connection.send(msg);
  }
}

deprecated(EntityManagerFactory.prototype, '_connector', 'connection');
deprecated(EntityManagerFactory.prototype, '_connected', CONNECTED);

module.exports = EntityManagerFactory;
