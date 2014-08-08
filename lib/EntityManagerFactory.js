var message = require('./message');
var Deferred = require('./promise').Deferred;
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
   * @param {Object} [schema]
   */
  initialize: function (host, port, schema) {
    if(!Number.isInstance(port)) {
      schema = port;
    }

    this.connector = Connector.create(host, port);
    this.metamodel = new Metamodel(this.connector);
    this.persistenceUnitUtil = new PersistenceUnitUtil(this.metamodel);

    if(schema) {
      this.metamodel.fromJSON(schema);
      this.metamodel.save().fail(EntityManagerFactory.onError);
    }
  },


  /**
   * Create a new application-managed EntityManager. This method returns a Promise which will be resolved
   * when the new EntityManger instance is invoked.
   *
   * @returns {jspa.Promise} entity manager instance
   */
  createEntityManager: function (doneCallback, failCallback) {
    return this.metamodel.ready().then(function() {
      return new EntityManager(this);
    }.bind(this)).then(doneCallback, failCallback);
  }
});