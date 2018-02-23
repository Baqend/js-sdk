'use strict';

const Filter = require('./Filter');
const Condition = require('./Condition');
const Operator = require('./Operator');
const Query = require('./Query');
const deprecated = require('../util/deprecated');

const varargs = Query.varargs;

/**
 * @alias query.Builder<T>
 * @extends query.Query<T>
 * @extends query.Condition<T>
 */
class Builder extends Query {

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   * @constructor
   */

  /**
   * Joins the conditions by an logical AND
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical AND
   */
  and(/* ...args */) {
    return this.addOperator('$and', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical OR
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical OR
   */
  or(/* ...args */) {
    return this.addOperator('$or', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical NOR
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical NOR
   */
  nor(/* ...args */) {
    return this.addOperator('$nor', varargs(0, arguments));
  }

  /**
   * @inheritDoc
   */
  eventStream(options, onNext, onError, onComplete) {
    return this.where({}).eventStream(options, onNext, onError, onComplete);
  }

  /**
   * @inheritDoc
   */
  resultStream(options, onNext, onError, onComplete) {
    return this.where({}).resultStream(options, onNext, onError, onComplete);
  }

  /**
   * @inheritDoc
   */
  resultList(options, doneCallback, failCallback) {
    return this.where({}).resultList(options, doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  singleResult(options, doneCallback, failCallback) {
    return this.where({}).singleResult(options, doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  count(doneCallback, failCallback) {
    return this.where({}).count(doneCallback, failCallback);
  }

  addOperator(operator, args) {
    if (args.length < 2) {
      throw new Error('Only two or more queries can be joined with an ' + operator + ' operator.');
    }

    args.forEach((arg, index) => {
      if (!(arg instanceof Query)) {
        throw new Error('Argument at index ' + index + ' is not a query.');
      }
    });

    return new Operator(this.entityManager, this.resultClass, operator, args);
  }

  addOrder(fieldOrSort, order) {
    return new Filter(this.entityManager, this.resultClass).addOrder(fieldOrSort, order);
  }

  addFilter(field, filter, value) {
    return new Filter(this.entityManager, this.resultClass).addFilter(field, filter, value);
  }

  addOffset(offset) {
    return new Filter(this.entityManager, this.resultClass).addOffset(offset);
  }

  addLimit(limit) {
    return new Filter(this.entityManager, this.resultClass).addLimit(limit);
  }
}

Object.assign(Builder.prototype, Condition);

deprecated(Builder.prototype, '_addOrder', 'addOrder');
deprecated(Builder.prototype, '_addFilter', 'addFilter');
deprecated(Builder.prototype, '_addOffset', 'addOffset');
deprecated(Builder.prototype, '_addLimit', 'addLimit');

module.exports = Builder;
