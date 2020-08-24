'use strict';

import { Filter } from "./Filter";
import { Condition } from "./Condition";
import { Operator } from "./Operator";
import {
  CompleteCallback,
  FailCallback,
  NextEventCallback,
  NextResultCallback,
  Query,
  EventStreamOptions,
  ResultStreamOptions, ResultOptions, ResultListCallback, SingleResultCallback, CountCallback, varargs
} from "./Query";
import { Entity } from "../binding";
import { Node } from "./Node";
import { RealtimeEvent } from "./RealtimeEvent";
import { Observable, Subscription } from "rxjs";

/**
 * The Query Builder allows creating filtered and combined queries
 */
export interface Builder<T extends Entity> extends Query<T>, Condition<T> {} // mixin the condition implementation
export class Builder<T extends Entity> extends Query<T> {

  /**
   * Joins the conditions by an logical AND
   * @param args The query nodes to join
   * @return Returns a new query which joins the given queries by a logical AND
   */
  and(...args: Array<Query<T> | Query<T>[]>): Operator<T> {
    return this.addOperator('$and', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical OR
   * @param args The query nodes to join
   * @return Returns a new query which joins the given queries by a logical OR
   */
  or(...args: Array<Query<T> | Query<T>[]>): Operator<T> {
    return this.addOperator('$or', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical NOR
   * @param args The query nodes to join
   * @return Returns a new query which joins the given queries by a logical NOR
   */
  nor(...args: Array<Query<T> | Query<T>[]>): Operator<T> {
    return this.addOperator('$nor', varargs(0, arguments));
  }

  /**
   * @inheritDoc
   */
  eventStream(options?: EventStreamOptions): Observable<RealtimeEvent<T>>;
  eventStream(options?: EventStreamOptions | NextEventCallback<T>, onNext?: NextEventCallback<T> | FailCallback, onError?: FailCallback | CompleteCallback, onComplete?: CompleteCallback): Subscription;
  eventStream(options?: EventStreamOptions | NextEventCallback<T>, onNext?: NextEventCallback<T> | FailCallback, onError?: FailCallback | CompleteCallback, onComplete?: CompleteCallback): Subscription | Observable<RealtimeEvent<T>> {
    return this.where({}).eventStream(options, onNext, onError, onComplete);
  }

  /**
   * @inheritDoc
   */
  resultStream(options?: ResultStreamOptions): Observable<T[]>;
  resultStream(options?: ResultStreamOptions | NextResultCallback<T>, onNext?: NextResultCallback<T> | FailCallback, onError?: FailCallback | CompleteCallback, onComplete?: CompleteCallback): Subscription;
  resultStream(options?: ResultStreamOptions | NextResultCallback<T>, onNext?: NextResultCallback<T> | FailCallback, onError?: FailCallback | CompleteCallback, onComplete?: CompleteCallback): Subscription | Observable<T[]> {
    return this.where({}).resultStream(options, onNext, onError, onComplete);
  }

  /**
   * @inheritDoc
   */
  resultList(options?: ResultOptions | ResultListCallback<T>, doneCallback?: ResultListCallback<T> | FailCallback, failCallback?: FailCallback) {
    return this.where({}).resultList(options, doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  singleResult(options?: ResultOptions | SingleResultCallback<T>, doneCallback?: SingleResultCallback<T> | FailCallback, failCallback?: FailCallback) {
    return this.where({}).singleResult(options, doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  count(doneCallback?: CountCallback, failCallback?: FailCallback) {
    return this.where({}).count(doneCallback, failCallback);
  }

  addOperator(operator: string, args: Node<T>[]) {
    if (args.length < 2) {
      throw new Error('Only two or more queries can be joined with an ' + operator + ' operator.');
    }

    args.forEach((arg, index) => {
      if (!(arg instanceof Node)) {
        throw new Error('Argument at index ' + index + ' is not a query.');
      }
    });

    return new Operator(this.entityManager, this.resultClass, operator, args);
  }

  addOrder(fieldOrSort: string | {[field: string]: 1 | -1}, order?: 1 | -1) {
    return new Filter(this.entityManager, this.resultClass).addOrder(fieldOrSort, order);
  }

  addFilter(field: string | null, filter: string | null, value: any): Filter<T> {
    return new Filter(this.entityManager, this.resultClass).addFilter(field, filter, value);
  }

  addOffset(offset: number) {
    return new Filter(this.entityManager, this.resultClass).addOffset(offset);
  }

  addLimit(limit: number) {
    return new Filter(this.entityManager, this.resultClass).addLimit(limit);
  }
}

Object.assign(Builder.prototype, Condition);
