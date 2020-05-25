'use strict';

import { Entity } from "../binding";
import { deprecated } from "../util/deprecated";
import { Node } from "./Node";

/**
 * An Operator saves the state of a combined query
 */
export class Operator<T extends Entity> extends Node<T> {
  /**
   * The operator used to join the child queries
   */
  public readonly operator: string;

  /**
   * The child Node of this query, it is always one
   */
  public readonly childes: Node<T>[];

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   * @param {string} operator The operator used to join the childes
   * @param {Array<query.Node<T>>} childes The childes to join
   */
  constructor(entityManager, resultClass, operator, childes) {
    super(entityManager, resultClass);
    this.operator = operator;
    this.childes = childes;
  }

  toJSON() {
    const json = {};
    json[this.operator] = this.childes;
    return json;
  }
}

deprecated(Operator.prototype, '_operator', 'operator');
deprecated(Operator.prototype, '_childs', 'childes');

module.exports = Operator;
