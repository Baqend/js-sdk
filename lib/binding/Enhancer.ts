'use strict';

import { Class } from "../util";

const BAQEND_ID = Symbol('BaqendId');
const BAQEND_TYPE = Symbol('BaqendType');

export class Enhancer {
  /**
   * @param {Class<*>} superClass
   * @return {Class<*>} typeConstructor
   */
  createProxy<T extends S, S>(superClass: Class<S>): Class<T> {
    return class Proxy extends (superClass as any) {} as Class<T>;
  }

  /**
   * @param {Class<*>} typeConstructor
   * @returns {ManagedType} type the managed type metadata for this class
   */
  static getBaqendType(typeConstructor) {
    return typeConstructor[BAQEND_TYPE];
  }

  /**
   * @param {Class<*>} typeConstructor
   * @return {string}
   */
  static getIdentifier(typeConstructor) {
    return typeConstructor[BAQEND_ID];
  }

  /**
   * @param {Class<*>} typeConstructor
   * @param {string} identifier
   * @return {void}
   */
  static setIdentifier(typeConstructor, identifier) {
    typeConstructor[BAQEND_ID] = identifier;
  }

  /**
   * @param {ManagedType} type
   * @param {Class<*>} typeConstructor
   * @return {void}
   */
  enhance(type, typeConstructor) {
    if (typeConstructor[BAQEND_TYPE] === type) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(typeConstructor, BAQEND_TYPE)) {
      throw new Error('Type is already used by a different manager');
    }

    typeConstructor[BAQEND_TYPE] = type;

    Enhancer.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor.prototype, type);
  }

  /**
   * Enhance the prototype of the type
   * @param {Object} proto
   * @param {ManagedType} type
   * @return {void}
   */
  enhancePrototype(proto, type) {
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
   * @param {Object} proto
   * @param {Attribute} attribute
   * @return {void}
   */
  enhanceProperty(proto, attribute) {
    const name = '$' + attribute.name;
    Object.defineProperty(proto, attribute.name, {
      get() {
        const metadata = this._metadata;
        metadata.readAccess();
        return metadata[name];
      },
      set(value) {
        const metadata = this._metadata;
        metadata.writeAccess();
        metadata[name] = value;
      },
      configurable: true,
      enumerable: true,
    });
  }
}

module.exports = Enhancer;
