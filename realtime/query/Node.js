'use strict';

const Stream = require('./Stream');
const Node = require('../../lib/query/Node');
const deprecated = require('../../lib/util/deprecated');

Object.assign(Node.prototype, {
  /**
   * @ignore
   *
   * @param {Object} options
   * @returns {Observable<T>} an RxJS observable
   */
  eventStream(options, onNext, onError, onComplete) {
    if (options instanceof Function) {
      return this.eventStream({}, options, onNext, onError);
    }

    const observable = Stream.createEventStream(this.entityManager, this.createRealTimeQuery(), options);

    if (onNext instanceof Function) {
      return observable.subscribe(onNext, onError, onComplete);
    }

    return observable;
  },

  resultStream(options, onNext, onError, onComplete) {
    if (options instanceof Function) {
      return this.resultStream({}, options, onNext, onError);
    }

    const observable = Stream.createResultStream(this.entityManager, this.createRealTimeQuery(), options);

    if (onNext instanceof Function) {
      return observable.subscribe(onNext, onError, onComplete);
    }

    return observable;
  },

  createRealTimeQuery() {
    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = {
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
});

deprecated(Node.prototype, '_createRealTimeQuery', 'createRealTimeQuery');

module.exports = Node;
