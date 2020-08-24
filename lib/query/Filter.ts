'use strict';

import { Node } from "./Node";
import { Condition } from "./Condition";
import { Json } from "../util";
import { Entity } from "../binding";

export type FilterObject = {[key: string]: NestedFilter | Json | Entity | Date };
export type NestedFilter = {[filter: string]: Json | Entity | Date};

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
  addFilter(field: string | null, filter: string | null, value: any): Filter<T> {
    if (field !== null) {
      if (typeof field !== "string") {
        throw new Error('Field must be a string.');
      }

      if (filter) {
        const currentFilter = this.filter[field];
        let fieldFilter: NestedFilter;
        if (typeof currentFilter === "object" && Object.getPrototypeOf(currentFilter) === Object.prototype) {
          fieldFilter = currentFilter as NestedFilter;
        } else {
          fieldFilter = this.filter[field] = {};
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

  toJSON(): FilterObject {
    return this.filter;
  }
}

Object.assign(Filter.prototype, Condition);
