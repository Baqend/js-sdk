var Query = require('./Query');

/**
 * @class baqend.TypedQuery
 * @extends baqend.Query
 */
var TypedQuery = module.exports = Query.inherit(/** @lends baqend.TypedQuery.prototype */{
  /**
   * @param {baqend.EntityManager} entityManager
   * @param {String|Object} qlString
   * @param {Function} resultClass
   */
  initialize: function (entityManager, qlString, resultClass) {
    this.entityManager = entityManager;
    this.resultClass = resultClass;
  }
});