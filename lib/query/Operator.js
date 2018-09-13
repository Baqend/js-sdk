'use strict';

const Node = require('./Node');
const deprecated = require('../util/deprecated');

/**
 * An Operator saves the state of a combined query
 * @alias query.Operator<T>
 * @extends query.Node<T>
 */
class Operator extends Node {
  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   * @param {string} operator The operator used to join the childs
   * @param {Array<query.Node<T>>} childs The childs to join
   */
  constructor(entityManager, resultClass, operator, childs) {
    super(entityManager, resultClass);

    /**
     * The operator used to join the child queries
     * @type {string}
     * @readonly
     */
    this.operator = operator;

    /**
     * The child Node of this query, it is always one
     * @type {Array<query.Node<T>>}
     * @readonly
     */
    this.childs = childs;
  }

  toJSON() {
    const json = {};
    json[this.operator] = this.childs;
    return json;
  }
}

deprecated(Operator.prototype, '_operator', 'operator');
deprecated(Operator.prototype, '_childs', 'childs');

module.exports = Operator;
