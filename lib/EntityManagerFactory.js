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

  /**
   * @type Object
   * @private
   */
  _connectData: null,

  _connected: function() {},

  constructor: function EntityManagerFactory(options) {
    options = String.isInstance(options)? {host: options}: options || {};

    this.metamodel = this.createMetamodel(options.global);
    this.code = new Code(this.metamodel);

    if (options.schema) {
      this._connectData = options;
    }

    if (options.host) {
      this.connect(options.host, options.port, options.secure, options.basePath);
    } else {
      this.withLock(function() {
        return new Promise(function(success) {
          this._connected = success;
        }.bind(this));
      }.bind(this), true);
    }

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

    this.metamodel.connected(this._connector);
    this.code.connected(this._connector);

    if(!this._connectData) {
      this._loadConnect();
    } else {
      this._connected();
    }
  },

  /**
   * Creates a new Metamodel instance, which is not connected
   * @param {boolean=} global indicates if this entityManager use the global credentials
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel: function(global) {
    return global? metamodel: new metamodel.Metamodel();
  },

  /**
   * Creates a new Metamodel instance, connected to the same destination as this EntityManagerFactory is connected to
   * @param {boolean=} global indicates if this entityManager use the global credentials
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createConnectedMetamodel: function(global) {
    var metamodel = this.createMetamodel(global)
    metamodel.connected(this._connector);
    return metamodel;
  },

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {Boolean=} global <code>true</code> To use the global authorization
   *
   * @returns {baqend.EntityManager} a new entityManager
   */
  createEntityManager: function(global) {
    var em = new EntityManager(this, global);

    if (this.isReady && this.metamodel.isInitialized) {
      em.connected(this._connector, this._connectData);
      return em;
    }

    var promise = this.ready().then(function() {
      if (!this.metamodel.isInitialized) {
        return this.metamodel.init(global? this._connectData.schema: null);
      }
    }.bind(this));

    em.withLock(function() {
      return promise.then(function() {
        em.connected(this._connector, this._connectData);
      }.bind(this));
    }.bind(this), true);

    return em;
  },

  _loadConnect: function() {
    if (this.isReady) {
      return this.withLock(function() {
        return this._loadConnectData().then(function() {
          this._connected()
        }.bind(this));
      }.bind(this), true);
    } else {
      return this._loadConnectData().then(function() {
        this._connected();
      }.bind(this));
    }
  },

  _loadConnectData: function() {
    var msg = new message.Connect();
    msg.withAuthorizationToken();
    return this._connector.send(msg).then(function(data) {
      this._connectData = data.response.entity;
    }.bind(this));
  }
});

module.exports = EntityManagerFactory;