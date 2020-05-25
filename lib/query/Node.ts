'use strict';

import { Entity } from "../binding";

import { deprecated } from "../util/deprecated";
import { Metadata } from "../util";
import { CountCallback, FailCallback, Query, ResultListCallback, ResultOptions, SingleResultCallback } from "./Query";
import * as message from "../message";
import { FilterObject } from "./Filter";

/**
 * A Query Node saves the state of the query being built
 */
export class Node<T extends Entity> extends Query<T> {
  /**
   * The offset how many results should be skipped
   */
  public firstResult: number = 0;

  /**
   * The limit how many objects should be returned
   * @type number
   * @readonly
   */
  public maxResults: number = -1;

  /**
   * The properties which should be used sort the result
   */
  public order: { [field: string]: 1 | -1 } = {};

  /**
   * @inheritDoc
   */
  eventStream(...args: any[]) {
    throw new Error('Streaming features not available! Please use Streaming SDK!');
  }

  /**
   * @inheritDoc
   */
  resultStream(...args: any[]) {
    throw new Error('Streaming features not available! Please use Streaming SDK!');
  }

  /**
   * @inheritDoc
   */
  resultList(options?: ResultOptions | ResultListCallback<T>, doneCallback?: ResultListCallback<T> | FailCallback, failCallback?: FailCallback) {
    if (options instanceof Function) {
      return this.resultList({} as ResultOptions, options as ResultListCallback<T>, doneCallback as FailCallback);
    }

    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this.serializeQuery();
    const sort = this.serializeSort();

    const uriSize = this.entityManager.connection?.host.length + query.length + sort.length;
    let msg;

    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, this.firstResult, this.maxResults, sort)
        .entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, this.maxResults, sort);
    }

    return this.entityManager.send(msg)
      .then(response => this.createResultList(response.entity, options))
      .then(doneCallback as ResultListCallback<T>, failCallback);
  }

  /**
   * @inheritDoc
   */
  singleResult(options?: ResultOptions | SingleResultCallback<T>, doneCallback?: SingleResultCallback<T> | FailCallback, failCallback?: FailCallback) {
    if (options instanceof Function) {
      return this.singleResult({} as ResultOptions, options as SingleResultCallback<T>, doneCallback as FailCallback);
    }

    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this.serializeQuery();
    const sort = this.serializeSort();

    const uriSize = this.entityManager.connection?.host.length + query.length;
    let msg;
    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, query, this.firstResult, 1, sort)
        .entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, 1, sort);
    }

    return this.entityManager.send(msg)
      .then(response => this.createResultList(response.entity, options))
      .then(list => (list.length ? list[0] : null))
      .then(doneCallback as SingleResultCallback<T>, failCallback);
  }

  /**
   * @inheritDoc
   */
  count(doneCallback?: CountCallback, failCallback?: FailCallback) {
    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this.serializeQuery();

    const uriSize = this.entityManager.connection?.host.length + query.length;
    let msg;
    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocCountQueryPOST(type.name)
        .entity(query, 'text');
    } else {
      msg = new message.AdhocCountQuery(type.name, query);
    }

    return this.entityManager.send(msg)
      .then(response => response.entity.count)
      .then(doneCallback, failCallback);
  }

  serializeQuery() {
    return JSON.stringify(this, function argSerializer(this: FilterObject, k, v) {
      // this referees here to the object which owns the key k
      const typedValue = this[k];
      if (typedValue instanceof Date) {
        return { $date: v };
      } else if (typedValue instanceof Entity) {
        return typedValue.id;
      }
      return v;
    });
  }

  serializeSort() {
    return JSON.stringify(this.order);
  }

  createResultList(result, options): Promise<T[]> {
    if (result.length) {
      return Promise.all<T>(result.map((el) => {
        if (el.id) {
          const entity: T = this.entityManager.getReference(this.resultClass, el.id);
          const metadata = Metadata.get(entity);
          metadata.setJson(el, { persisting: true });
          return this.entityManager.resolveDepth(entity, options);
        }

        return this.entityManager.load(Object.keys(el)[0]);
      }))
        .then(objects => objects.filter((val: T) => !!val));
    }

    return Promise.resolve([]);
  }

  addOrder(fieldOrSort, order?) {
    if (order) {
      this.order[fieldOrSort] = order;
    } else {
      this.order = fieldOrSort;
    }
    return this;
  }

  addOffset(offset) {
    this.firstResult = offset;
    return this;
  }

  addLimit(limit) {
    this.maxResults = limit;
    return this;
  }
}

deprecated(Node.prototype, '_sort', 'order');
deprecated(Node.prototype, '_serializeQuery', 'serializeQuery');
deprecated(Node.prototype, '_serializeSort', 'serializeSort');
deprecated(Node.prototype, '_createResultList', 'createResultList');
deprecated(Node.prototype, '_addOrder', 'addOrder');
deprecated(Node.prototype, '_addOffset', 'addOffset');
deprecated(Node.prototype, '_addLimit', 'addLimit');
