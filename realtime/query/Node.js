"use strict";

const Stream = require('./Stream');
const Node = require('../../lib/query/Node');

/**
 * @ignore
 *
 * @param {Object} options
 * @returns {Observable<T>} an RxJS observable
 */
Node.prototype.eventStream = function(options, onNext, onError, onComplete) {
  if (options instanceof Function) {
    onComplete = onError;
    onError = onNext;
    onNext = options;
    options = {};
  }

  const observable = Stream.createEventStream(this.entityManager, this._createRealTimeQuery(), options);

  if (onNext instanceof Function) {
    return observable.subscribe(onNext, onError, onComplete);
  } else {
    return observable;
  }
};

Node.prototype.resultStream = function(options, onNext, onError, onComplete) {
  if (options instanceof Function) {
    onComplete = onError;
    onError = onNext;
    onNext = options;
    options = {};
  }

  const observable = Stream.createResultStream(this.entityManager, this._createRealTimeQuery(), options);

  if (onNext instanceof Function) {
    return observable.subscribe(onNext, onError, onComplete);
  } else {
    return observable;
  }
};

Node.prototype._createRealTimeQuery = function() {
  let type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
  if (!type) {
    throw new Error('Only typed queries can be executed.');
  }

  const query = {
    bucket: type.name,
    query: this._serializeQuery()
  };

  const sort = this._serializeSort();
  if (sort && sort != '{}') {
    query.sort = sort;
  }

  if (this.maxResults > 0)
    query.limit = this.maxResults;

  if (this.firstResult > 0)
    query.offset = this.firstResult;

  return query;
};

module.exports = Node;