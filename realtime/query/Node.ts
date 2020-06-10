'use strict';

import { Stream } from "./Stream";
import {
  CompleteCallback,
  EventStreamOptions,
  FailCallback,
  NextEventCallback, NextResultCallback,
  Node, RealtimeEvent,
  ResultStreamOptions
} from "../../lib/query";
import { deprecated } from "../../lib/util/deprecated";
import { Json, JsonMap } from "../../lib/util";
import { Entity } from "../../lib/binding";
import { Observable, Subscription } from "rxjs";

Object.assign(Node.prototype, {

  eventStream<T extends Entity>(this: Node<T>, options?: EventStreamOptions | NextEventCallback<T>, onNext?: NextEventCallback<T> | FailCallback, onError?: FailCallback | CompleteCallback, onComplete?: CompleteCallback): Observable<RealtimeEvent<T>> | Subscription {
    if (options instanceof Function) {
      return this.eventStream({}, options as NextEventCallback<T>, onNext as FailCallback, onError as CompleteCallback);
    }

    const observable = Stream.createEventStream<T>(this.entityManager, this.createRealTimeQuery(), options);

    if (onNext instanceof Function) {
      return observable.subscribe(onNext as NextEventCallback<T>, onError, onComplete);
    }

    return observable;
  },

  resultStream<T extends Entity>(this: Node<T>, options?: ResultStreamOptions | NextResultCallback<T>, onNext?: NextResultCallback<T> | FailCallback, onError?: FailCallback | CompleteCallback, onComplete?: CompleteCallback): Observable<T[]> | Subscription {
    if (options instanceof Function) {
      return this.resultStream({}, options as NextResultCallback<T>, onNext as FailCallback, onError as CompleteCallback);
    }

    const observable = Stream.createResultStream<T>(this.entityManager, this.createRealTimeQuery(), options);

    if (onNext instanceof Function) {
      return observable.subscribe(onNext as NextResultCallback<T>, onError, onComplete);
    }

    return observable;
  },

  createRealTimeQuery(this: Node<any>): JsonMap {
    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query: JsonMap = {
      bucket: type.name,
      query: this.serializeQuery(),
    };

    const sort = this.serializeSort();
    if (sort && sort !== '{}') {
      query.sort = sort;
    }

    if (this.maxResults > 0) {
      query.limit = this.maxResults;
    }

    if (this.firstResult > 0) {
      query.offset = this.firstResult;
    }

    return query;
  },
} as Partial<Node<any>>);

deprecated(Node.prototype, '_createRealTimeQuery', 'createRealTimeQuery');

export { Node };