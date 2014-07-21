var Query = require('./Query').Query;

/**
 * @class jspa.TypedQuery
 * @extends jspa.Query
 */
exports.TypedQuery = TypedQuery = Query.inherit(/** @lends jspa.TypedQuery.prototype */{
  /**
   * @param {jspa.EntityManager} entityManager
   * @param {String|Object} qlString
   * @param {Function} resultClass
   */
  initialize: function (entityManager, qlString, resultClass) {
    this.superCall(entityManager, qlString);
    this.resultClass = resultClass;
  }
});