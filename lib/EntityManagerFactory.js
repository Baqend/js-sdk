"use strict";

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
class EntityManagerFactory extends util.Lockable {

  _connected() {}

  constructor(options) {
    super();

    options = Object(options) instanceof String? {host: options}: options || {};

    /** @type baqend.connector.Connector */
    this._connector = null;
    /** @type baqend.metamodel.Metamodel */
    this.metamodel = this.createMetamodel();
    /** @type baqend.util.Code */
    this.code = new util.Code(this.metamodel, this);
    /** @type baqend.util.TokenStorage */
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
  }

  /**
   * Connects this EntityManager to the given destination
   * @param {String} hostOrApp The host or the app name to connect with
   * @param {Number} [port=80|443] The port to connect to
   * @param {Boolean} [secure=false] <code>true</code> To use a secure connection
   * @param {String} [basePath="/v1"] The base path of the baqend api
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
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel() {
    return new metamodel.Metamodel(this);
  }

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {Boolean|baqend.util.TokenStorage=} tokenStorage The token storage to persist the authorization token, or
   * <code>true</code> To use the the global token storage for authorization tokens.
   * <code>false</code> To not use any token storage.
   *
   * @returns {baqend.EntityManager} a new entityManager
   */
  createEntityManager(tokenStorage) {
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
  }

  send(message) {
    if (!message.tokenStorage)
      message.tokenStorage = this.tokenStorage;
    return this._connector.send(message);
  }
}

module.exports = EntityManagerFactory;