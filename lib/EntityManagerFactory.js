var message = require('./message');
var Metamodel = require('./metamodel').Metamodel;
var Code = require('./metamodel').Code;
var Connector = require('./connector').Connector;
var EntityManager = require('./EntityManager').EntityManager;
var EntityManagerFactory;

/**
 * @class baqend.EntityManagerFactory
 */
exports.EntityManagerFactory = EntityManagerFactory = Object.inherit(Bind, /** @lends baqend.EntityManagerFactory.prototype */ {

  /**
   * @type baqend.connector.Connector
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

  /**
   * @param {String} host
   * @param {Number} [port]
   * @param {Object} [schema]
   */
  initialize: function(host, port, schema) {
    if (!Number.isInstance(port)) {
      schema = port;
      port = null;
    }

    this._connector = Connector.create(host, port);
    this.metamodel = this.createMetamodel();
    this.code = this.createCode();

    if (schema) {
      this.metamodel.init(schema);
    }
  },

  /**
   * Creates a new Metamodel instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.metamodel.Metamodel} A new Metamodel instance
   */
  createMetamodel: function() {
    return new Metamodel(this._connector);
  },

  /**
   * Creates a new Code instance, connected to the same destination as this EntityManagerFactory is connected to
   * @return {baqend.metamodel.Code} A new Code instance
   */
  createCode: function() {
    return new Code(this._connector);
  },

  /**
   * Create a new application-managed EntityManager. This method returns a Promise which will be resolved
   * when the new EntityManger instance is invoked.
   *
   * @param {baqend.EntityManagerFactory~onCreateEntityManager} [doneCallback]
   * @param {baqend.EntityManagerFactory~onCreateFailed} [failCallback]
   * @returns {Promise<baqend.EntityManager>} a promise which been resolved with the initialized entityManager
   */
  createEntityManager: function(doneCallback, failCallback) {
    return this.metamodel.ready().then(function() {
      return new EntityManager(this);
    }.bind(this)).then(doneCallback, failCallback);
  }

  /**
   * Callback used by {@link #createEntityManager}
   * @callback baqend.EntityManagerFactory~onCreateEntityManager
   * @param {baqend.EntityManager} db the entity manager instance
   */

  /**
   * Callback used by {@link #createEntityManager}
   * @callback baqend.EntityManagerFactory~onCreateFailed
   * @param {baqend.error.PersistentError} error which was raised
   */
});