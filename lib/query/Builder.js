"use strict";

var Filter = require('./Filter');
var Condition = require('./Condition');
var Operator = require('./Operator');
var Query = require('./Query');
var varargs = Query.varargs;

/**
 * @alias query.Builder<T>
 * @extends query.Query<T>
 * @extends query.Condition<T>
 */
class Builder extends Query {

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   */
  constructor(entityManager, resultClass) {
    super(entityManager, resultClass);
  }

  /**
   * Joins the conditions by an logical AND
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical AND
   */
  and(args) {
    return this._addOperator('$and', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical OR
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical OR
   */
  or(args) {
    return this._addOperator('$or', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical NOR
   * @param {...(query.Query<T>|Array<query.Query<T>>)} args The query nodes to join
   * @return {query.Query<T>} Returns a new query which joins the given queries by a logical NOR
   */
  nor(args) {
    return this._addOperator('$nor', varargs(0, arguments));
  }

  /**
   * @inheritDoc
   */
  stream(options) {
    return this.where({}).stream(options, this);
  }

  /**
   * @inheritDoc
   */
  streamResult(options) {
    return this.where({}).streamResult(options);
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

  _addOperator(operator, args) {
    if (args.length < 2) {
      throw new Error('Only two or more queries can be joined with an ' + operator + ' operator.');
    }

    args.forEach(function(arg, index) {
      if (!(arg instanceof Query)) {
        throw new Error('Argument at index ' + index + ' is not a query.');
      }
    });

    return new Operator(this.entityManager, this.resultClass, operator, args);
  }

  _addOrder(fieldOrSort, order) {
    return new Filter(this.entityManager, this.resultClass)._addOrder(fieldOrSort, order);
  }

  _addFilter(field, filter, value) {
    return new Filter(this.entityManager, this.resultClass)._addFilter(field, filter, value);
  }

  _addOffset(offset) {
    return new Filter(this.entityManager, this.resultClass)._addOffset(offset);
  }

  _addLimit(limit) {
    return new Filter(this.entityManager, this.resultClass)._addLimit(limit);
  }
}

Object.assign(Builder.prototype, Condition);

module.exports = Builder;
