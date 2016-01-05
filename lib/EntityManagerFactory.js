var message = require('./message');
var metamodel = require('./metamodel');

var Lockable = require('./util/Lockable');
var Code = require('./util/Code');
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
var EntityManagerFactory = Object.inherit(Lockable, /** @lends baqend.EntityManagerFactory.prototype */ {

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

  _connected: function() {},

  constructor: function EntityManagerFactory(options) {
    options = String.isInstance(options)? {host: options}: options || {};

    if (options.host) {
      this.connect(options.host, options.port, options.secure, options.basePath);
    } else {
      this.withLock(function() {
        return new Promise(function(success) {
          this._connected = success;
        }.bind(this));
      }.bind(this), true);
    }

    this.metamodel = this.createMetamodel(options.global);
    this.code = this.createCode();

    if (options.schema) {
      this.metamodel.init(options.schema);
    }
  },

  /**
   * Connects this EntityManager to the given destination
   * @param {String} host The host to connect with
   * @param {Number} [port=80|443] The port to connect to
   * @param {Boolean} [secure=false] <code>true</code> To use a secure connection
   * @param {String} [basePath="/v1"] The base path of the baqend api
   */
  connect: function(host, port, secure, basePath) {
    if (this._connector)
      throw new Error('The EntityManagerFactory is already connected.');

    if (Boolean.isInstance(port)) {
      secure = port;
      port = 0;
    }

    this._connector = Connector.create(host, port, secure, basePath);
    this._connected();
  },

  /**
   * Creates a new Metamodel instance, connected to the same destination as this EntityManagerFactory is connected to
   * @param {boolean=} global indicates if this entityManager use the global credentials
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel: function(global) {
    var model = global? metamodel: new metamodel.Metamodel();

    if (this.isReady) {
      model.connected(this._connector);
    } else {
      model.withLock(function() {
        return this.ready().then(function() {
          model.connected(this._connector);
        }.bind(this));
      }.bind(this), true);
    }

    return model;
  },

  /**
   * Creates a new Code instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.util.Code} A new Code instance
   */
  createCode: function() {
    var code = new Code(this.metamodel);
    if (this.isReady) {
      code.connected(this._connector);
    } else {
      this.ready().then(function(emf) {
        code.connected(emf._connector);
      });
    }
    return code;
  },

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {Boolean=} global <code>true</code> To use the global authorization
   *
   * @returns {baqend.EntityManagerFactory} a new entityManager
   */
  createEntityManager: function(global) {
    var em = new EntityManager(this, global);

    var promise;
    if (this.metamodel.isReady && this.metamodel.isInitialized) {
      promise = em.connected(this._connector);
    } else {
      promise = this.metamodel.ready().then(function() {
        return this.metamodel.init();
      }.bind(this)).then(function() {
        return em.connected(this._connector);
      }.bind(this));
    }

    if (promise) {
      em.withLock(function() {
        return promise;
      }, true);
    }

    return em;
  }
});

module.exports = EntityManagerFactory;