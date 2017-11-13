'use strict';

const Node = require('./Node');

/**
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
     * @type string
     */
    this.operator = operator;

    /**
     * The child Node of this query, it is always one
     * @type Array<query.Node>
     */
    this.childs = childs;
  }

  toJSON() {
    const json = {};
    json[this.operator] = this.childs;
    return json;
  }
}

module.exports = Operator;
