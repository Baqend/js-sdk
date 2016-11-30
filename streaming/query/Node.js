"use strict";

var Stream = require('./Stream');
var Node = require('../../lib/query/Node');

/**
 * @ignore
 *
 * @param {Object} options
 * @param {query.Node<T>} target
 * @returns {Observable<T>} an RxJS observable
 */
Node.prototype.stream = function(options, target) {
  if (!target) {
    target = this;
  }

  return Stream.createStream(this.entityManager, this._createStreamingQuery(), options, target);
};

Node.prototype.streamResult = function(options) {
  return Stream.createStreamResult(this.entityManager, this._createStreamingQuery(), options);
};

Node.prototype._createStreamingQuery = function() {
  var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
  if (!type) {
    throw new Error('Only typed queries can be executed.');
  }

  const query = {
    bucket: type.name,
    query: this._serializeQuery()
  };

  var sort = this._serializeSort();
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