var message = require('./message');

var Metamodel = require('./metamodel').Metamodel;
var Connector = require('./connector').Connector;
var PersistenceUnitUtil = require('./PersistenceUnitUtil').PersistenceUnitUtil;
var EntityManager = require('./EntityManager').EntityManager;
var EntityManagerFactory;

/**
 * @class jspa.EntityManagerFactory
 */
exports.EntityManagerFactory = EntityManagerFactory = Object.inherit(/** @lends jspa.EntityManagerFactory.prototype */ {
  /**
   * @lends jspa.EntityManagerFactory
   */
  extend: {
    /**
     * @param {Error} e
     */
    onError: function (e) {
      console.error(e);
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
    this.metamodel = new Metamodel();
    this.persistenceUnitUtil = new PersistenceUnitUtil(this.metamodel);

    this.pendingQueues = [];

    var msg = new message.GetAllSchemas(this.metamodel);
    this.connector.send(this, msg).then(function (msg) {
      return this.ready(msg.models);
    }).done(function () {
      for (var i = 0, queue; queue = this.pendingQueues[i]; ++i) {
        queue.start();
      }

      this.pendingQueues = null;
    }).fail(function (e) {
      EntityManagerFactory.onError(e);
    });
  },

  ready: function (models) {
    if (this.newModel) {
      var toStore = this.newModel.filter(function (el, i) {
        return !(el["class"] in models);
      });
      this.newModel = null;

      if (toStore.length > 0) {
        var msg = new message.PostAllSchemas(this.metamodel, toStore);
        return this.connector.send(this, msg).then(function (msg) {
          this.ready(msg.models);
        });
      }
    }

    for (var identifier in models) {
      var type = models[identifier];
      this.metamodel.addType(type);
    }
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
  },

  define: function (model) {
    this.newModel = model;
  }
});