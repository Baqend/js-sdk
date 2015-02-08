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
 * @param {Number} [options.secure=false] <code>true</code> To use a secure ssl encrypted connection
 * @param {Object} [options.schema=null] The serialized schema as json used to initialize the metamodel
 * @param {Boolean} [options.global=false] <code>true</code> To create the emf for the global DB
 */
var EntityManagerFactory = module.exports = Object.inherit(Lockable, /** @lends baqend.EntityManagerFactory.prototype */ {

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
   * @type baqend.metamodel.Code
   */
  code: null,

  initialize: function(options) {
    options = String.isInstance(options)? {host: options}: options || {};

    this.lock();
    if (options.host) {
      this.connect(options.host, options.port, options.secure);
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
   * @param {Number} [port] The port to connect to
   * @param {Boolean} [secure] <code>true</code> To use a secure connection
   */
  connect: function(host, port, secure) {
    this._connector = Connector.create(host, port, secure);
    this.unlock();
  },

  /**
   * Creates a new Metamodel instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel: function(global) {
    var model = global? metamodel: new metamodel.Metamodel();
    if (this.isReady) {
      model.connected(this._connector);
    } else {
      this.ready().then(function(emf) {
        model.connected(emf._connector);
      });
    }
    return model;
  },

  /**
   * Creates a new Code instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.metamodel.Code} A new Code instance
   */
  createCode: function() {
    var code = new Code();
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
   * @returns a new entityManager
   */
  createEntityManager: function() {
    var em = new EntityManager(this);

    if (this.isReady && this.metamodel.isInitialized) {
      em.connected(this._connector);
    } else {
      this.ready().then(function() {
        return this.metamodel.init();
      }.bind(this)).then(function() {
        em.connected(this._connector);
      }.bind(this));
    }

    return em;
  }
});