"use strict";
var Node = require('./Node');
var Condition = require('./Condition');

/**
 * @alias query.Filter<T>
 * @extends query.Node<T>
 * @extends query.Condition<T>
 */
class Filter extends Node {

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   */
  constructor(entityManager, resultClass) {
    super(entityManager, resultClass);

    /**
     * The actual filters of this node
     * @type Object
     */
    this._filter = {};
  }

  _addFilter(field, filter, value) {
    if (field !== null) {
      if (!(Object(field) instanceof String))
        throw new Error('Field must be a string.');

      if (filter) {
        var fieldFilter = this._filter[field];
        if (!(fieldFilter instanceof Object) || Object.getPrototypeOf(fieldFilter) != Object.prototype) {
          this._filter[field] = fieldFilter = {};
        }

        fieldFilter[filter] = value;
      } else {
        this._filter[field] = value;
      }
    } else {
      Object.assign(this._filter, value);
    }

    return this;
  }

  toJSON() {
    return this._filter;
  }
}

Object.assign(Filter.prototype, Condition);
module.exports = Filter;