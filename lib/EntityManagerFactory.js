"use strict";

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
class EntityManagerFactory extends Lockable {

  _connected() {}

  constructor(options) {
    super();

    options = Object(options) instanceof String? {host: options}: options || {};

    /** @type baqend.connector.Connector */
    this._connector = null;

    if (options.host) {
      this.connect(options.host, options.port, options.secure);
    } else {
      this.withLock(function() {
        return new Promise(function(success) {
          this._connected = success;
        }.bind(this));
      }.bind(this), true);
    }

    /** @type baqend.metamodel.Metamodel */
    this.metamodel = this.createMetamodel(options.global);
    /** @type baqend.util.Code */
    this.code = this.createCode();

    if (options.schema) {
      this.metamodel.init(options.schema);
    }
  }

  /**
   * Connects this EntityManager to the given destination
   * @param {String} host The host to connect with
   * @param {Number} [port] The port to connect to
   * @param {Boolean} [secure] <code>true</code> To use a secure connection
   */
  connect(host, port, secure) {
    if (this._connector)
      throw new Error('The EntityManagerFactory is already connected.');

    this._connector = Connector.create(host, port, secure);
    this._connected();
  }

  /**
   * Creates a new Metamodel instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel(global) {
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
  }

  /**
   * Creates a new Code instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.util.Code} A new Code instance
   */
  createCode() {
    var code = new Code(this.metamodel);
    if (this.isReady) {
      code.connected(this._connector);
    } else {
      this.ready().then(function(emf) {
        code.connected(emf._connector);
      });
    }
    return code;
  }

  /**
   * Create a new application-managed EntityManager.
   *
   * @param {Boolean=} global <code>true</code> To use the global authorization
   *
   * @returns {baqend.EntityManagerFactory} a new entityManager
   */
  createEntityManager(global) {
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
}

module.exports = EntityManagerFactory;