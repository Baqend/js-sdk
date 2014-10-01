var message = require('./message');
var Q = require('q');
var Metamodel = require('./metamodel').Metamodel;
var Connector = require('./connector').Connector;
var EntityManager = require('./EntityManager').EntityManager;
var EntityManagerFactory;

/**
 * @class jspa.EntityManagerFactory
 */
exports.EntityManagerFactory = EntityManagerFactory = Object.inherit(Bind, /** @lends jspa.EntityManagerFactory.prototype */ {
  /**
   * @lends jspa.EntityManagerFactory
   */
  extend: {
    /**
     * @param {Error} e
     */
    onError: function(e) {
      console.error(e.stack);
      //throw e;
    }
  },

  isDefining: false,

  /**
   * @type jspa.metamodel.Metamodel
   */
  metamodel: null,

  /**
   * @param {String} host
   * @param {Number} [port]
   * @param {Object} [schema]
   */
  initialize: function(host, port, schema) {
    if (!Number.isInstance(port)) {
      schema = port;
    }

    this.connector = Connector.create(host, port);
    this.metamodel = new Metamodel(this.connector);

    if (schema) {
      this.metamodel.fromJSON(schema);
      this.metamodel.save().fail(EntityManagerFactory.onError);
    }
  },

  /**
   * Create a new application-managed EntityManager. This method returns a Promise which will be resolved
   * when the new EntityManger instance is invoked.
   *
   * @param {jspa.EntityManagerFactory~onCreateEntityManager} [doneCallback]
   * @param {jspa.EntityManagerFactory~onCreateFailed} [failCallback]
   * @returns {Q.Promise<jspa.EntityManager>} a promise which been resolved with the initialized entityManager
   */
  createEntityManager: function(doneCallback, failCallback) {
    return this.metamodel.ready().then(function() {
      return new EntityManager(this);
    }.bind(this)).then(doneCallback, failCallback);
  }

  /**
   * Callback used by {@link #createEntityManager}
   * @callback jspa.EntityManagerFactory~onCreateEntityManager
   * @param {jspa.EntityManager} db the entity manager instance
   */

  /**
   * Callback used by {@link #createEntityManager}
   * @callback jspa.EntityManagerFactory~onCreateFailed
   * @param {jspa.error.PersistentError} error which was raised
   */
});