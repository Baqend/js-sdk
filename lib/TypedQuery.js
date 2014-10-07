var Query = require('./Query').Query;

/**
 * @class baqend.TypedQuery
 * @extends baqend.Query
 */
exports.TypedQuery = TypedQuery = Query.inherit(/** @lends baqend.TypedQuery.prototype */{
  /**
   * @param {baqend.EntityManager} entityManager
   * @param {String|Object} qlString
   * @param {Function} resultClass
   */
  initialize: function (entityManager, qlString, resultClass) {
    this.superCall(entityManager, qlString);
    this.resultClass = resultClass;
  }
});