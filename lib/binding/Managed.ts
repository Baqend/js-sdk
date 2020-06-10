'use strict';

import { enumerable } from "../util/enumerable";
import { Json, JsonMap, Metadata } from "../util";
import { Enhancer } from "./Enhancer";

export class Managed {
  /**
   * Contains the metadata of this managed object
   */
  public _metadata: Metadata = null as any; // will always be lazy initialized

  /**
   * Initialize the given instance
   * @param instance The managed instance to initialize
   * @param properties The optional properties to set on the instance
   */
  static init(instance: Managed, properties?: {[property: string]: any}): void {
    const type = Enhancer.getBaqendType(instance.constructor);
    if (type) {
      Object.defineProperty(instance, '_metadata', {
        value: Metadata.create(type, instance),
        configurable: true,
      });
    }

    if (properties) {
      Object.assign(instance, properties);
    }
  }

  /**
   * The default constructor, copy all given properties to this object
   * @param properties - The optional properties to copy
   */
  constructor(properties?: {[property: string]: any}) {
    Managed.init(this, properties);
  }

  /**
   * Converts the managed object to an JSON-Object.
   * @return JSON-Object
   * @method
   */
  @enumerable(false)
  toJSON(): Json {
    return this._metadata.type.toJsonValue(this._metadata, this, {});
  }
}
