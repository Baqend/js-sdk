var message = require('./message');
var promise = require('q');

/**
 * @class baqend.Query
 */
exports.Query = Query = Object.inherit(/** @lends baqend.Query.prototype */ {
  /**
   * @type Number
   */
  firstResult: 0,

  /**
   * @type Number
   */
  maxResults: Number.MAX_VALUE,

  /**
   * @type {Function}
   */
  resultClass: null,

  /**
   * @memberOf baqend.Query
   * @param {baqend.EntityManager} entityManager
   * @param {String|Object} qlString
   */
  initialize: function (entityManager, qlString) {
    this.connector = entityManager.connector;
    this.entityManager = entityManager;
    this.qlString = qlString;
  },

  /**
   * Execute a SELECT query and return the query results as a List.
   */
  getResultList: function (doneCallback, failCallback) {
    return this.yield().then(function () {
      var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
      var msg;

      if (!this.qlString) {
        msg = new message.GetAllOids(type, this.firstResult, this.maxResults);
      } else {
        if (!type) {
          throw new PositionError('Only typed queries can be executed.');
        }

        var query = this.qlString;
        if (!String.isInstance(query))
          query = JSON.stringify(query);

        msg = new message.GetBucketQuery(type, query, this.firstResult, this.maxResults);
      }

      return this.send(msg).then(function () {
        return this.createResultList(msg.oids);
      });
    }.bind(this)).then(doneCallback, failCallback);
  },

  /**
   * Execute a SELECT query that returns a single result.
   */
  getSingleResult: function (doneCallback, failCallback) {
    var promise;
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!this.qlString) {
      var msg = new message.GetAllOids(type, this.firstResult, 1);

      promise = this.send(msg).then(function (msg) {
        return this.createResultList(msg.oids);
      }).then(function (result) {
        return result.length ? result[0] : null;
      });
    }

    promise.then(doneCallback, failCallback);
  },

  createResultList: function (oids) {
    var list = new Array(oids.length);

    if (oids.length) {
      var pending = [];
      oids.forEach(function (el, index) {
        var promise = this.entityManager.find(el.oid || el).then(function (o) {
          list[index] = o;
        });

        pending.push(promise);
      }, this);

      return Q.all(pending).then(function () {
        return list;
      });
    } else {
      return list;
    }
  }
});