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
   * Creates a subclass of this class
   * @param {Class<*>} childClass
   * @return {Class<*>} The extended child class
   */
  static extend(childClass) {
    childClass.prototype = Object.create(this.prototype, {
      constructor: {
        value: childClass,
        configurable: true,
        writable: true,
      },
    });
    childClass.extend = Managed.extend;
    return childClass;
  }

  /**
   * The default constructor, copy all given properties to this object
   * @param {Object<string,*>=} properties - The optional properties to copy
   */
  constructor(properties) {
    Managed.init(this, properties);
  }

  /**
   * Converts the managed object to an JSON-Object.
   * @return {json} JSON-Object
   * @method
   */
  @enumerable(false)
  toJSON(): Json {
    return this._metadata.type.toJsonValue(this._metadata, this, {});
  }
}
