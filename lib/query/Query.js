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
   * Returns an observable that receives change events for a real-time query. Multiple subscriptions can be created on top of this observable:
   *
   <pre><code>
   var query = DB.Todo.find();
   var options = { ... };
   var stream = query.eventStream(options);
   var sub = stream.subscribe(onNext, onError, onComplete);
   var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);
   </code></pre>
   *
   * @param {Object} [options] options to narrow down the events you will receive
   * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the entities matching the query at subscription time)
   * @param {(string|Array<string>)} [options.matchTypes=['all']] the match types you are interested in; accepts the default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
   * @param {(string|Array<string>)} [options.operations=['any']] the operations you are interested in; accepts the default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
   * @return {Observable<RealtimeEvent<T>>} an observable
   */
  eventStream(options) {}

  /**
   * Returns a subscription that handles change events for a real-time query.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #eventStream(options)}).

   * @param {Object} [options] options to narrow down the events you will receive
   * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the entities matching the query at subscription time)
   * @param {(string|Array<string>)} [options.matchTypes=['all']] the match types you are interested in; accepts the default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
   * @param {(string|Array<string>)} [options.operations=['any']] the operations you are interested in; accepts the default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
   * @param {query.Query~nextEventCallback=} onNext Called when an event is received
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @param {query.Query~completeCallback=} onComplete Called when the network connection is closed (e.g. because of lost Wi-Fi connection)
   * @return {Subscription} a real-time query subscription
   * @name eventStream
   * @memberOf query.Query<T>.prototype
   * @method
   */


  /**
   * Returns a subscription that handles change events for a real-time query.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #eventStream(options)}).

   * @param {query.Query~nextEventCallback=} onNext Called when an event is received
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @param {query.Query~completeCallback=} onComplete Called when the network connection is closed (e.g. because of lost Wi-Fi connection)
   * @return {Subscription} a real-time query subscription
   * @name eventStream
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Returns an observable that receives the complete real-time query result. The full result is received initially (i.e. on subscription) and on every change.
   *Will
   var query = DB.Todo.find();
   var stream = query.resultStream();
   var sub = stream.subscribe(onNext, onError, onComplete);
   var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);
   </code></pre>
   *
   * @param {Object} [options] additional options
   * @param {number} [options.reconnects=-1] the number of times that a real-time query subscription should be renewed after connection loss, before it is downgraded to a regular query that does not maintain itself; negative numbers represent infinite reconnection attempts
   * @return {Observable<Array<T>>} an observable on which multiple subscriptions can be created on
   */
  resultStream(options) {}

  /**
   * Returns a subscription that handles the complete real-time query result. The full result is received initially (i.e. on subscription) and on every change.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #resultStream(options)}).
   *
   * @param {Object} [options] additional options
   * @param {number} [options.reconnects=-1] the number of times that a real-time query subscription should be renewed after connection loss, before it is downgraded to a regular query that does not maintain itself; negative numbers represent infinite reconnection attempts
   * @param {query.Query~nextResultCallback=} onNext Called when the query result changes in any way
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @param {query.Query~completeCallback=} onComplete Called when the network connection is closed (e.g. because of network timeout or lost Wi-Fi connection) and the specified number of reconnects have been exhausted; will never be called when infinite reconnects are configured (default)
   * @return {Subscription} a real-time query subscription handling complete query results.
   * @name resultStream
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Returns a subscription that handles the complete real-time query result. The full result is received initially (i.e. on subscription) and on every change.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream object first and then subscribe to the stream (see the other signature {@link #resultStream(options)}).
   *
   * As the real-time query will reconnect infinitely often, there is no onComplete callback. (In other words, the observable will never complete.)
   *
   * @param {query.Query~nextResultCallback=} onNext Called when the query result changes in any way
   * @param {query.Query~failCallback=} onError Called when there is a server-side error
   * @return {Subscription} a real-time query subscription handling complete query results.
   * @name resultStream
   * @memberOf query.Query<T>.prototype
   * @method
   */

  /**
   * Execute the query that returns the matching objects count.
   * @param {query.Query~countCallback=} doneCallback Called when the operation succeed.
   * @param {query.Query~failCallback=} failCallback Called when there is a server-side error
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

/**
 * This callback is called whenever the result of the real-time query changes. The received event contains information on how the query result changed.
 * @callback query.Query~nextEventCallback
 * @param {RealtimeEvent<T>} event The real-time query event
 */

/**
 * This callback is called whenever the result of the real-time query changes. The full result set is received.
 * @callback query.Query~nextResultCallback
 * @param {Array<T>} result The updated real-time query result
 */

/**
 * This callback is called when the network connection is closed (e.g. because of network timeout or lost Wi-Fi connection)
 * @callback query.Query~completeCallback
 */
