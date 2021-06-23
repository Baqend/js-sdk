import { enumerable } from '../util/enumerable';
import { Class, Json } from '../util';
import { Enhancer } from './Enhancer';
import { Metadata } from '../intersection';
import type { ManagedState } from '../intersection/Metadata';
import type { EntityType } from '../metamodel';

export interface Managed {
  /**
   * The managed properties of this object
   */
  [property: string]: any;

  /**
   * Contains the metadata of this managed object
   */
  _metadata: ManagedState;
}
export class Managed {
  /**
   * Initialize the given instance
   * @param instance The managed instance to initialize
   * @param properties The optional properties to set on the instance
   */
  static init(instance: Managed, properties?: { [property: string]: any }): void {
    const type = Enhancer.getBaqendType(instance.constructor)!;
    if (type.isEntity) {
      Object.defineProperty(instance, '_metadata', {
        value: Metadata.create(type as EntityType<any>),
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
  constructor(properties?: { [property: string]: any }) {
    Managed.init(this, properties);
  }

  /**
   * Returns this object identifier or the baqend type of this object
   * @return the object id or type whatever is available
   */
  @enumerable(false)
  toString(): string {
    const type = Enhancer.getBaqendType(this.constructor);
    return type!.ref;
  }

  /**
   * Converts the managed object to an JSON-Object.
   * @return JSON-Object
   * @method
   */
  @enumerable(false)
  toJSON(): Json {
    const type = Enhancer.getBaqendType(this.constructor)!;
    return type.toJsonValue(Metadata.create(type), this, { persisting: false });
  }
}
