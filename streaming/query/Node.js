"use strict";

var Stream = require('./Stream');
var Node = require('../../lib/query/Node');

/**
 * @inheritDoc
 */
Node.prototype.stream = function(options, target) {
  var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
  if (!type) {
    throw new Error('Only typed queries can be executed.');
  }

  if (!target) {
    target = this;
  }

  return new Stream(this.entityManager, type.name, this._serializeQuery(), options, this._serializeSort(), this.maxResults, this.firstResult, target).observable();
};
