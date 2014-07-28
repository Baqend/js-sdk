var message = require('./message');

var Metamodel = require('./metamodel').Metamodel;
var Connector = require('./connector').Connector;
var PersistenceUnitUtil = require('./PersistenceUnitUtil').PersistenceUnitUtil;
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
    onError: function (e) {
      console.error(e.stack);
      //throw e;
    }
  },

  isDefining: false,

  /**
   * @param {String} host
   * @param {Number} [port]
   */
  initialize: function (host, port) {
    this.connector = Connector.create(host, port);
    this.metamodel = new Metamodel(this.connector);
    this.persistenceUnitUtil = new PersistenceUnitUtil(this.metamodel);

    this.pendingQueues = [];

    this.metamodel.load()
        .done(this.onInit)
        .fail(EntityManagerFactory.onError);
  },

  onInit: function() {
    for (var i = 0, queue; queue = this.pendingQueues[i]; ++i) {
      queue.start();
    }

    this.pendingQueues = null;
  },

  /**
   * Create a new application-managed EntityManager. This method returns a new EntityManager
   * instance each time it is invoked. The isOpen method will return true on the returned instance.
   *
   * @returns {jspa.EntityManager} entity manager instance
   */
  createEntityManager: function () {
    var entityManager = new EntityManager(this);

    if (this.pendingQueues) {
      var queue = entityManager.queue;
      queue.wait();
      this.pendingQueues.push(queue);
    }

    return entityManager;
  }
});