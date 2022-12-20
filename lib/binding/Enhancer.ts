/* eslint-disable no-param-reassign,max-classes-per-file */
import { Class } from '../util/Class';
import { Attribute, ManagedType } from '../metamodel';
import type { Managed } from './Managed';

const BAQEND_ID = Symbol('BaqendId');
const BAQEND_TYPE = Symbol('BaqendType');

export class Enhancer {
  /**
   * @param superClass
   * @return typeConstructor
   */
  createProxy<T extends S, S>(superClass: Class<S>): Class<T> {
    return class Proxy extends (superClass as any) {} as Class<T>;
  }

  /**
   * @param typeConstructor
   * @returns type the managed type metadata for this class
   */
  static getBaqendType(typeConstructor: Class<any> | NewableFunction): ManagedType<any> | null {
    return (typeConstructor as any)[BAQEND_TYPE];
  }

  /**
   * @param typeConstructor
   * @return
   */
  static getIdentifier(typeConstructor: Class<any> | NewableFunction): string | null {
    return (typeConstructor as any)[BAQEND_ID];
  }

  /**
   * @param typeConstructor
   * @param identifier
   */
  static setIdentifier(typeConstructor: Class<any>, identifier: string): void {
    (typeConstructor as any)[BAQEND_ID] = identifier;
  }

  /**
   * @param type
   * @param typeConstructor
   */
  enhance<T extends Managed>(type: ManagedType<T>, typeConstructor: Class<T>): void {
    if ((typeConstructor as any)[BAQEND_TYPE] === type) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(typeConstructor, BAQEND_TYPE)) {
      throw new Error('Type is already used by a different manager');
    }

    (typeConstructor as any)[BAQEND_TYPE] = type;

    Enhancer.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor.prototype, type);
  }

  /**
   * Enhance the prototype of the type
   * @param proto
   * @param type
   */
  enhancePrototype<T extends Managed>(proto: T, type: ManagedType<T>): void {
    if (type.isEmbeddable) {
      return; // we do not need to enhance the prototype of embeddable
    }

    if (proto.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      Object.defineProperty(proto, 'toString', {
        value: function toString() {
          return this._metadata.id || this._metadata.bucket;
        },
        enumerable: false,
      });
    }

    // enhance all persistent object properties
    if (type.superType && type.superType.name === 'Object') {
      type.superType.declaredAttributes.forEach((attr) => {
        if (!attr.isMetadata) {
          this.enhanceProperty(proto, attr);
        }
      });
    }

    // enhance all persistent properties
    type.declaredAttributes.forEach((attr) => {
      this.enhanceProperty(proto, attr);
    });
  }

  /**
   * @param proto
   * @param attribute
   */
  enhanceProperty<T>(proto: T, attribute: Attribute<any>): void {
    const { name } = attribute;
    Object.defineProperty(proto, name, {
      get() {
        this._metadata.throwUnloadedPropertyAccess(name);
        return null;
      },
      set(value) {
        this._metadata.throwUnloadedPropertyAccess(name);
        Object.defineProperty(this, name, {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      },
      configurable: true,
      enumerable: true,
    });
  }
}
