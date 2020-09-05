import { enumerable } from '../util/enumerable';
import { Class, Json } from '../util';
import { Enhancer } from './Enhancer';
import { Metadata } from '../intersection';
import type { ManagedMetadata } from '../intersection/Metadata';

export interface Managed {
  /**
   * The managed properties of this object
   */
  [property: string]: any;

  /**
   * Contains the metadata of this managed object
   */
  _metadata: ManagedMetadata;
}
export class Managed {
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
  static extend(childClass: Class<any> | Function): Class<any> | Function {
    // eslint-disable-next-line no-param-reassign
    childClass.prototype = Object.create(this.prototype, {
      constructor: {
        value: childClass,
        configurable: true,
        writable: true,
      },
    });
    // eslint-disable-next-line no-param-reassign
    (childClass as any).extend = Managed.extend;
    return childClass;
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
    // TODO: casting to Metadata is not really correct here since embeddable types have an lightweight meta object
    // However the lightweight Metadata is compatible with the Metadata object which is expected by the managed types
    return this._metadata.type.toJsonValue(this._metadata as Metadata, this, { persisting: false });
  }
}
