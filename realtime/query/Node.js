'use strict';

const Stream = require('./Stream');
const Node = require('../../lib/query/Node');
const deprecated = require('../../lib/util/deprecated');

/**
 * @ignore
 *
 * @param {Object} options
 * @returns {Observable<T>} an RxJS observable
 */
Node.prototype.eventStream = (options, onNext, onError, onComplete) => {
  if (options instanceof Function) {
    return this.eventStream({}, options, onNext, onError);
  }

  const observable = Stream.createEventStream(this.entityManager, this.createRealTimeQuery(), options);

  if (onNext instanceof Function) {
    return observable.subscribe(onNext, onError, onComplete);
  }

  return observable;
};

Node.prototype.resultStream = (options, onNext, onError, onComplete) => {
  if (options instanceof Function) {
    return this.resultStream({}, options, onNext, onError);
  }

  const observable = Stream.createResultStream(this.entityManager, this.createRealTimeQuery(), options);

  if (onNext instanceof Function) {
    return observable.subscribe(onNext, onError, onComplete);
  }

  return observable;
};

Node.prototype.createRealTimeQuery = () => {
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
};

deprecated(Node.prototype, '_createRealTimeQuery', 'createRealTimeQuery');

module.exports = Node;
