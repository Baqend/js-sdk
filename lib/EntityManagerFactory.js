"use strict";

var message = require('./message');
var metamodel = require('./metamodel');

var util = require('./util');
var caching = require('./caching');
var Connector = require('./connector/Connector');
var EntityManager = require('./EntityManager');

/**
 * @alias EntityManagerFactory
 * @extends util.Lockable
 */
class EntityManagerFactory extends util.Lockable {

  _connected() {}

  /**
   * Creates a new EntityManagerFactory connected to the given destination
   * @param {string|Object} [options] The destination to connect with, or an options object
   * @param {string} [options.host] The destination to connect with
   * @param {number} [options.port=80|443] The optional destination port to connect with
   * @param {boolean} [options.secure=false] <code>true</code> To use a secure ssl encrypted connection
   * @param {string} [options.basePath="/v1"] The base path of the api
   * @param {Object} [options.schema=null] The serialized schema as json used to initialize the metamodel
   * @param {boolean} [options.global=false] <code>true</code> To create the emf for the global DB
   * @param {util.TokenStorage} [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param {util.TokenStorageFactory} [options.tokenStorageFactory] The tokenStorage factory implementation which should
   * be used for token storage
   * @param {number} [options.bloomFilterRefresh=60] Bloom filter refresh interval in seconds
   */
  constructor(options) {
    super();

    options = Object(options) instanceof String? {host: options}: options || {};

    /** @type connector.Connector */
    this._connector = null;
    /** @type metamodel.Metamodel */
    this.metamodel = this.createMetamodel();
    /** @type util.Code */
    this.code = new util.Code(this.metamodel, this);
    /** @type util.TokenStorage */
    this.tokenStorage = options.tokenStorage;
    /** @type util.TokenStorageFactory */
    this.tokenStorageFactory = options.tokenStorageFactory || util.TokenStorage.WEB_STORAGE || util.TokenStorage.GLOBAL;
    /** @type number */
    this.bloomFilterRefresh = options.bloomFilterRefresh;

    var isReady = true;
    var ready = new Promise((success) => {
      this._connected = success;
    });

    if (options.host) {
      this.connect(options.host, options.port, options.secure, options.basePath);
    } else {
      isReady = false;
    }

    if (!this.tokenStorage) {
      isReady = false;
      ready = ready.then(() => {
        return this.tokenStorageFactory.create(this._connector.origin);
      }).then((tokenStorage) => {
        this.tokenStorage = tokenStorage;
      });
    }

    if (options.schema) {
      this._connectData = options;
      this.metamodel.init(options.schema);
    } else {
      isReady = false;
      ready = ready.then(() => {
        var msg = new message.Connect();
        msg.withCredentials = true; //used for registered devices
        return this.send(msg);
      }).then((response) => {
        this._connectData = response.entity;

        if(this.bloomFilterRefresh === undefined) {
          this.bloomFilterRefresh = this._connectData.bloomFilterRefresh || 60;
        }

        if (!this.metamodel.isInitialized)
          this.metamodel.init(this._connectData.schema);

        this.tokenStorage.update(this._connectData.token);
      });
    }

    if (!isReady) {
      this.withLock(() => {
        return ready;
      }, true);
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
    if (this._connector)
      throw new Error('The EntityManagerFactory is already connected.');

    if (Object(port) instanceof Boolean) {
      secure = port;
      port = 0;
    }
    
    this._connector = Connector.create(hostOrApp, port, secure, basePath);

    this._connected();
    return this.ready();
  }

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
    var em = new EntityManager(this);

    if (this.isReady) {
      em.connected(this._connector, this._connectData, useSharedTokenStorage? this.tokenStorage: new util.TokenStorage(this._connector.origin));
    } else {
      em.withLock(() => {
        return this.ready().then(() => {
          em.connected(this._connector, this._connectData, useSharedTokenStorage? this.tokenStorage: new util.TokenStorage(this._connector.origin));
        });
      }, true);
    }

    return em;
  }

  send(message) {
    if (!message.tokenStorage)
      message.tokenStorage = this.tokenStorage;
    return this._connector.send(message);
  }
}

module.exports = EntityManagerFactory;