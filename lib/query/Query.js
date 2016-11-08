"use strict";

/**
 * @alias query.Query<T>
 */
class Query {
  constructor(entityManager, resultClass) {
    /**
     * The owning EntityManager of this query
     * @type EntityManager
     */
    this.entityManager = entityManager;

    /**
     * The result class of this query
     * @type Class<T>
     */
    this.resultClass = resultClass;
  }

  /**
   * Add an ascending sort for the specified field to this query
   * @param {string} field The field to sort
   * @return {query.Query<T>} The resulting Query
   */
  ascending(field) {
    return this._addOrder(field, 1);
  }

  /**
   * Add an decending sort for the specified field to this query
   * @param {string} field The field to sort
   * @return {query.Query<T>} The resulting Query
   */
  descending(field) {
    return this._addOrder(field, -1);
  }

  /**
   * Sets the sort of the query and discard all existing paramaters
   * @param {Object} sort The new sort of the query
   * @return {query.Query<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   */
  sort(sort) {
    if (!(sort instanceof Object) || Object.getPrototypeOf(sort) != Object.prototype)
      throw new Error('sort must be an object.');

    return this._addOrder(sort);
  }

  /**
   * Sets the offset of the query, i.e. how many elements should be skipped
   * @param {number} offset The offset of this query
   * @return {query.Query<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.skip/
   */
  offset(offset) {
    if (offset < 0)
      throw new Error("The offset can't be nagative.");

    return this._addOffset(offset);
  }

  /**
   * Sets the limit of this query, i.e hox many objects should be returnd
   * @param {number} limit The limit of this query
   * @return {query.Query<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.limit/
   */
  limit(limit) {
    if (limit < 0)
      throw new Error("The limit can't be nagative.");

    return this._addLimit(limit);
  }

  /**
   * Execute the query and return the query results as a List.
   * Note: All local unsaved changes on matching objects, will be discarded.
   * @param {Object} [options] The query options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * objects, <code>true</code> loads the objects by reachability.
   * @param {query.Query~resultListCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<Array<T>>} A promise that will be resolved with the query result as a list
   */
  resultList(options, doneCallback, failCallback) {}

  /**
   * Execute the query and return the query results as a List.
   * Note: All local unsaved changes on matching objects, will be discarded.
   * @param {query.Query~resultListCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<Array<T>>} A promise that will be resolved with the query result as a list
   * @name resultList
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Execute the query that returns a single result.
   * Note: All local unsaved changes on the matched object, will be discarded.
   * @param {Object} [options] The query options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * object, <code>true</code> loads the objects by reachability.
   * @param {query.Query~singleResultCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A promise that will be resolved with the query result as a single result
   */
  singleResult(options, doneCallback, failCallback) {}

  /**
   * Execute the query that returns a single result.
   * Note: All local unsaved changes on the matched object, will be discarded.
   * @param {query.Query~singleResultCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A promise that will be resolved with the query result as a single result
   * @name singleResult
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * The Streaming SDK is required for this method
   */
  stream() {}

  /**
   * Execute the query that returns the matching objects count.
   * @param {query.Query~countCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<number>} The total number of matched objects
   */
  count(doneCallback, failCallback) {}
}

Query.MAX_URI_SIZE = 2000;

Query.varargs = function varargs(offset, args) {
  return Array.prototype.concat.apply([], Array.prototype.slice.call(args, offset));
};

module.exports = Query;

/**
 * The resultList callback is called, when the asynchronous query operation completes successfully
 * @callback query.Query~resultListCallback
 * @param {Array<T>} result The query result list, an empty list if no match was found
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The singleResult callback is called, when the asynchronous query operation completes successfully
 * @callback query.Query~singleResultCallback
 * @param {T} entity The matching object or null id no matching object was found
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The count callback is called, when the asynchronous query operation completes successfully
 * @callback query.Query~countCallback
 * @param {number} count the matching object count
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous query operation is rejected by an error
 * @callback query.Query~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise, result or undefined
 */