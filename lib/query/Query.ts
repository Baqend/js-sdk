import { Entity } from '../binding';
import type { EntityManager } from '../EntityManager';
import { Class } from '../util';
import { PersistentError } from '../error';
import type { Node } from './Node';

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
    public readonly resultClass: Class<T>,
  ) {}

  /**
   * Add an ascending sort for the specified field to this query
   * @param field The field to sort
   * @return The resulting Query
   */
  ascending(field: string): Node<T> {
    return this.addOrder(field, 1);
  }

  /**
   * Add an decending sort for the specified field to this query
   * @param field The field to sort
   * @return The resulting Query
   */
  descending(field: string): Node<T> {
    return this.addOrder(field, -1);
  }

  /**
   * Sets the sort of the query and discard all existing paramaters
   * @param sort The new sort of the query which is an object whose keys are fields and the
   * values are either +1 for ascending order or -1 for descending order
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   */
  sort(sort: { [field: string]: 1 | -1 }): Node<T> {
    if (typeof sort !== 'object' || Object.getPrototypeOf(sort) !== Object.prototype) {
      throw new Error('sort must be an object.');
    }

    return this.addOrder(sort);
  }

  /**
   * Sets the offset of the query, i.e. how many elements should be skipped
   * @param offset The offset of this query
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.skip/
   */
  offset(offset: number): Node<T> {
    if (offset < 0) {
      throw new Error('The offset can\'t be nagative.');
    }

    return this.addOffset(offset);
  }

  /**
   * Sets the limit of this query, i.e hox many objects should be returnd
   * @param limit The limit of this query
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.limit/
   */
  limit(limit: number): Node<T> {
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
   * @return A promise that will be resolved with the query result as a list
   */
  abstract resultList(options?: ResultOptions, doneCallback?: ResultListCallback<T>,
    failCallback?: FailCallback): Promise<T[]>;

  /**
   * Execute the query and return the query results as a List
   *
   * Note: All local unsaved changes on matching objects, will be discarded.
   *
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A promise that will be resolved with the query result as a list
   */
  abstract resultList(doneCallback?: ResultListCallback<T>, failCallback?: FailCallback): Promise<T[]>;

  /**
   * Execute the query that returns a single result
   *
   * Note: All local unsaved changes on the matched object, will be discarded.
   *
   * @param [options] The query options
   * @param [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * object, <code>true</code> loads the objects by reachability.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A promise that will be resolved with the query result as a single result
   */
  abstract singleResult(options?: ResultOptions, doneCallback?: SingleResultCallback<T>,
    failCallback?: FailCallback): Promise<T | null>;

  /**
   * Execute the query that returns a single result
   *
   * Note: All local unsaved changes on the matched object, will be discarded.
   *
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A promise that will be resolved with the query result as a single result
   */
  abstract singleResult(doneCallback?: SingleResultCallback<T>, failCallback?: FailCallback): Promise<T | null>;

  /**
   * Execute the query that returns the matching objects count.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when there is a server-side error
   * @return The total number of matched objects
   */
  abstract count(doneCallback?: CountCallback, failCallback?: FailCallback): Promise<number>;

  abstract addOrder(field: string, order: 1 | -1): Node<T>;

  abstract addOrder(order: { [field: string]: 1 | -1 }): Node<T>;

  abstract addOffset(offset: number): Node<T>;

  abstract addLimit(limit: number): Node<T>;
}

export function flatArgs(args: any[]) {
  return Array.prototype.concat.apply([], args);
}

export type ResultOptions = { depth?: number | boolean };

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
 * This callback is called when the network connection is closed (e.g. because of network timeout or lost Wi-Fi
 * connection)
 */
export type CompleteCallback = () => any;
