'use strict';

const Node = require('./Node');
const Condition = require('./Condition');
const deprecated = require('../util/deprecated');

/**
 * A Filter saves the state for a filtered query
 * @alias query.Filter<T>
 * @extends query.Node<T>
 * @implements query.Condition<T>
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
     * @type Object<string,*>
     * @readonly
     */
    this.filter = {};
  }

  /**
   * @inheritDoc
   */
  addFilter(field, filter, value) {
    if (field !== null) {
      if (!(Object(field) instanceof String)) {
        throw new Error('Field must be a string.');
      }

      if (filter) {
        let fieldFilter = this.filter[field];
        if (!(fieldFilter instanceof Object) || Object.getPrototypeOf(fieldFilter) !== Object.prototype) {
          fieldFilter = {};
          this.filter[field] = fieldFilter;
        }

        fieldFilter[filter] = value;
      } else {
        this.filter[field] = value;
      }
    } else {
      Object.assign(this.filter, value);
    }

    return this;
  }

  toJSON() {
    return this.filter;
  }
}

Object.assign(Filter.prototype, Condition);

deprecated(Filter.prototype, '_filter', 'filter');
deprecated(Filter.prototype, '_addFilter', 'addFilter');

module.exports = Filter;
