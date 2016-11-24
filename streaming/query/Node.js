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
  var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
  if (!type) {
    throw new Error('Only typed queries can be executed.');
  }

  if (!target) {
    target = this;
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

  return Stream.createStream(this.entityManager, query, options, target);
};

module.exports = Node;