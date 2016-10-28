"use strict";

var Stream = require('./Stream');
var Node = require('../../lib/query/Node');

/**
 * @inheritDoc
 */
Node.prototype.stream = function(fetchQuery, matchType, target) {
  var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
  if (!type) {
    throw new Error('Only typed queries can be executed.');
  }

  if (fetchQuery === undefined)
    fetchQuery = true;

  if (target === undefined)
    target = this;

  if (matchType === undefined)
    matchType = 'all';

  var sort = this._serializeSort();

  return new Stream(this.entityManager, type.name, this._serializeQuery(), fetchQuery, sort, this.maxResults, target).observable(matchType);
};
