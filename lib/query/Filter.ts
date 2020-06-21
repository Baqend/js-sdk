'use strict';

import { Node } from "./Node";
import { Condition } from "./Condition";
import { Json } from "../util";
import { Entity } from "../binding";

export type FilterObject = {[key: string]: Json | Entity | Date};

/**
 * A Filter saves the state for a filtered query
 */
export interface Filter<T extends Entity> extends Node<T>, Condition<T> {} // mixin the condition implementation
export class Filter<T extends Entity> extends Node<T> {
  /**
   * The actual filters of this node
   */
  public readonly filter: FilterObject = {};

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
