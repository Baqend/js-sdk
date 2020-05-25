'use strict';

import { Entity } from "../binding";
import { EntityManager } from "../EntityManager";
import { Class } from "../util";
import { PersistentError } from "../error";
import { MatchType, Operation, RealtimeEvent } from "./RealtimeEvent";

/**
 * An abstract Query which allows retrieving results
 */
export abstract class Query<T extends Entity> {
  public static readonly MAX_URI_SIZE = 2000;

  /**
   * @param entityManager - The owning EntityManager of this query
   * @param resultClass - The result class of this query
   */
  constructor(
    public readonly entityManager: EntityManager,
    public readonly resultClass: Class<T>
  ) {}

  /**
   * Add an ascending sort for the specified field to this query
   * @param {string} field The field to sort
   * @return {this} The resulting Query
   */
  ascending(field) {
    return this.addOrder(field, 1);
  }

  /**
   * Add an decending sort for the specified field to this query
   * @param {string} field The field to sort
   * @return {this} The resulting Query
   */
  descending(field) {
    return this.addOrder(field, -1);
  }

  /**
   * Sets the sort of the query and discard all existing paramaters
   * @param {Object<string,number>} sort The new sort of the query which is an object whose keys are fields and the
   * values are either +1 for ascending order or -1 for descending order
   * @return {this} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   */
  sort(sort) {
    if (!(sort instanceof Object) || Object.getPrototypeOf(sort) !== Object.prototype) {
      throw new Error('sort must be an object.');
    }

    return this.addOrder(sort);
  }

  /**
   * Sets the offset of the query, i.e. how many elements should be skipped
   * @param {number} offset The offset of this query
   * @return {this} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.skip/
   */
  offset(offset) {
    if (offset < 0) {
      throw new Error('The offset can\'t be nagative.');
    }

    return this.addOffset(offset);
  }

  /**
   * Sets the limit of this query, i.e hox many objects should be returnd
   * @param {number} limit The limit of this query
   * @return {this} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.limit/
   */
  limit(limit) {
    if (limit < 0) {
      throw new Error('The limit can\'t be nagative.');
    }

    return this.addLimit(limit);
  }

  /**
   * Execute the query and return the query results as a List
   *
   * Note: All local unsaved changes on matching objects, will be discarded.
   *
   * @param [options] The query options
   * @param [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * objects, <code>true</code> loads the objects by reachability.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return {Promise<Array<T>>} A promise that will be resolved with the query result as a list
   */
  abstract resultList(options?: ResultOptions, doneCallback?: ResultListCallback<T>, failCallback?: FailCallback);

  /**
   * Execute the query and return the query results as a List
   *
   * Note: All local unsaved changes on matching objects, will be discarded.
   *
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return {Promise<Array<T>>} A promise that will be resolved with the query result as a list
   */
  abstract resultList(doneCallback?: ResultListCallback<T>, failCallback?: FailCallback);

  /**
   * Execute the query that returns a single result
   *
   * Note: All local unsaved changes on the matched object, will be discarded.
   *
   * @param {Object} [options] The query options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * object, <code>true</code> loads the objects by reachability.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return {Promise<?T>} A promise that will be resolved with the query result as a single result
   */
  abstract singleResult(options?: ResultOptions, doneCallback?: SingleResultCallback<T>, failCallback?: FailCallback);

  /**
   * Execute the query that returns a single result
   *
   * Note: All local unsaved changes on the matched object, will be discarded.
   *
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return {Promise<?T>} A promise that will be resolved with the query result as a single result
   */
  abstract singleResult(doneCallback?: SingleResultCallback<T>, failCallback?: FailCallback);

  /**
   * Returns an observable that receives change events for a real-time query
   *
   * Multiple subscriptions can be created on top of this observable:
   *
   * <pre><code>
   * var query = DB.Todo.find();
   * var options = { ... };
   * var stream = query.eventStream(options);
   * var sub = stream.subscribe(onNext, onError, onComplete);
   * var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);
   * </code></pre>
   *
   * @param {Object} [options] options to narrow down the events you will receive
   * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the
   * entities matching the query at subscription time)
   * @param {(string|Array<string>)} [options.matchTypes=['all']] the match types you are interested in; accepts the
   * default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
   * @param {(string|Array<string>)} [options.operations=['any']] the operations you are interested in; accepts the
   * default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
   * @return {Observable<RealtimeEvent<T>>} an observable
   */
  abstract eventStream(options?: EventStreamOptions);

  /**
   * Returns a subscription that handles change events for a real-time query.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream
   * object first and then subscribe to the stream (see the other signature {@link #eventStream(options)}).
   * @param {Object} [options] options to narrow down the events you will receive
   * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the
   * entities matching the query at subscription time)
   * @param {(string|Array<string>)} [options.matchTypes=['all']] the match types you are interested in; accepts the
   * default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
   * @param {(string|Array<string>)} [options.operations=['any']] the operations you are interested in; accepts the
   * default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
   * @param onNext Called when an event is received
   * @param onError Called when there is a server-side error
   * @param onComplete Called when the network connection is closed (e.g. because of
   * lost Wi-Fi connection)
   * @return {Subscription} a real-time query subscription
   */
  abstract eventStream(options?: EventStreamOptions, onNext?: NextEventCallback<T>, onError?: FailCallback, onComplete?: CompleteCallback);

  /**
   * Returns a subscription that handles change events for a real-time query.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream
   * object first and then subscribe to the stream (see the other signature {@link #eventStream(options)}).
   *
   * @param onNext Called when an event is received
   * @param onError Called when there is a server-side error
   * @param onComplete Called when the network connection is closed (e.g. because of
   * lost Wi-Fi connection)
   * @return {Subscription} a real-time query subscription
   */
  abstract eventStream(onNext?: NextEventCallback<T>, onError?: FailCallback, onComplete?: CompleteCallback);

  /**
   * Returns an observable that receives the complete real-time query result
   *
   * The full result is received initially (i.e. on subscription) and on every change.
   *
   * <pre><code>
   * var query = DB.Todo.find();
   * var stream = query.resultStream();
   * var sub = stream.subscribe(onNext, onError, onComplete);
   * var otherSub = stream.subscribe(otherOnNext, otherOnError, otherOnComplete);
   * </code></pre>
   *
   * @param {Object} [options] additional options
   * @param {number} [options.reconnects=-1] the number of times that a real-time query subscription should be renewed
   * after connection loss, before it is downgraded to a regular query that does not maintain itself; negative numbers
   * represent infinite reconnection attempts
   * @return {Observable<Array<T>>} an observable on which multiple subscriptions can be created on
   */
  abstract resultStream(options?: ResultStreamOptions);

  /**
   * Returns a subscription that handles the complete real-time query result
   *
   * The full result is received initially (i.e. on subscription) and on every change.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream
   * object first and then subscribe to the stream (see the other signature {@link #resultStream(options)}).
   *
   * @param {Object} [options] additional options
   * @param {number} [options.reconnects=-1] the number of times that a real-time query subscription should be renewed
   * after connection loss, before it is downgraded to a regular query that does not maintain itself; negative numbers
   * represent infinite reconnection attempts
   * @param onNext Called when the query result changes in any way
   * @param onError Called when there is a server-side error
   * @param onComplete Called when the network connection is closed (e.g. because of
   * network timeout or lost Wi-Fi connection) and the specified number of reconnects have been exhausted; will never be
   * called when infinite reconnects are configured (default)
   * @return {Subscription} a real-time query subscription handling complete query results.
   */
  abstract resultStream(options?: ResultStreamOptions, onNext?: NextResultCallback<T>, onError?: FailCallback, onComplete?: CompleteCallback);

  /**
   * Returns a subscription that handles the complete real-time query result
   *
   * The full result is received initially (i.e. on subscription) and on every change.
   *
   * The underlying stream object is hidden. To create multiple subscriptions on the same stream, create the stream
   * object first and then subscribe to the stream (see the other signature {@link #resultStream(options)}).
   *
   * As the real-time query will reconnect infinitely often, there is no onComplete callback. (In other words, the
   * observable will never complete.)
   *
   * @param onNext Called when the query result changes in any way
   * @param onError Called when there is a server-side error
   * @return {Subscription} a real-time query subscription handling complete query results.
   */
  abstract resultStream(onNext?: NextResultCallback<T>, onError?: FailCallback);

  /**
   * Execute the query that returns the matching objects count.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when there is a server-side error
   * @return The total number of matched objects
   */
  abstract count(doneCallback?: CountCallback, failCallback?: FailCallback): Promise<number>;

  abstract addOrder(field: string, order: 1 | -1);
  abstract addOrder(order: {[field: string]: 1 | -1});
  abstract addOffset(offset);
  abstract addLimit(limit);
}

export function varargs(offset, args) {
  return Array.prototype.concat.apply([], Array.prototype.slice.call(args, offset));
}

export type ResultOptions = {depth: number | boolean};
export type EventStreamOptions = { initial: boolean, matchTypes: ('all' | MatchType)[], operations: ('any' | Operation)[] };
export type ResultStreamOptions = { reconnects: number };

/**
 * The resultList callback is called, when the asynchronous query operation completes successfully
 * @param result The query result list, an empty list if no match was found
 * @return A Promise, result or undefined
 */
export type ResultListCallback<T> = (result: T[]) => Promise<any> | any;

/**
 * The singleResult callback is called, when the asynchronous query operation completes successfully
 * @param entity The matching object or null id no matching object was found
 * @return A Promise, result or undefined
 */
export type SingleResultCallback<T> = (entity: T | null) => Promise<any> | any;

/**
 * The count callback is called, when the asynchronous query operation completes successfully
 * @param count the matching object count
 * @return A Promise, result or undefined
 */
export type CountCallback = (count: number) => Promise<any> | any;

/**
 * The fail callback is called, when the asynchronous query operation is rejected by an error
 * @param error The error which reject the operation
 * @return A Promise, result or undefined
 */
export type FailCallback = (error: PersistentError) => Promise<any> | any;

/**
 * This callback is called whenever the result of the real-time query changes. The received event contains information
 * on how the query result changed.
 * @param event The real-time query event
 */
export type NextEventCallback<T extends Entity> = (event: RealtimeEvent<T>) => Promise<any> | any;

/**
 * This callback is called whenever the result of the real-time query changes. The full result set is received.
 * @param result The updated real-time query result
 */
export type NextResultCallback<T> = (result: T[]) => any;

/**
 * This callback is called when the network connection is closed (e.g. because of network timeout or lost Wi-Fi
 * connection)
 */
export type CompleteCallback = () => any;
