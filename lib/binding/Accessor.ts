'use strict';

import { Managed } from "./Managed";
import { Attribute } from "../metamodel";

export class Accessor {
  /**
   * @param object
   * @param attribute
   * @return
   */
  getValue<T>(object: Managed, attribute: Attribute<T>): T | null {
    return object[attribute.name];
  }

  /**
   * @param object
   * @param attribute
   * @param value
   */
  setValue<T>(object: Managed, attribute: Attribute<T>, value: T): void {
    object[attribute.name] = value;
  }
}
