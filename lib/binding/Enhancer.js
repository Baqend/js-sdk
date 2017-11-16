'use strict';

const BAQEND_ID = Symbol('BaqendId');
const BAQEND_TYPE = Symbol('BaqendType');

/**
 * @alias binding.Enhancer
 */
class Enhancer {
  /**
   * @param {Class<*>} superClass
   * @returns {Class<*>} typeConstructor
   */
  createProxy(superClass) {
    return class Proxy extends superClass {};
  }

  /**
   * @param {Class<*>} typeConstructor
   * @returns {metamodel.ManagedType} type the managed type metadata for this class
   */
  static getBaqendType(typeConstructor) {
    return typeConstructor[BAQEND_TYPE];
  }

  /**
   * @param {Class<*>} typeConstructor
   * @returns {string}
   */
  static getIdentifier(typeConstructor) {
    return typeConstructor[BAQEND_ID];
  }

  /**
   * @param {Class<*>} typeConstructor
   * @param {string} identifier
   */
  static setIdentifier(typeConstructor, identifier) {
    typeConstructor[BAQEND_ID] = identifier;
  }

  /**
   * @param {metamodel.ManagedType} type
   * @param {Class<*>} typeConstructor
   */
  enhance(type, typeConstructor) {
    if (typeConstructor[BAQEND_TYPE] === type) {
      return;
    }

    if (typeConstructor[BAQEND_TYPE]) {
      throw new Error('Type is already used by a different manager');
    }

    typeConstructor[BAQEND_TYPE] = type;

    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor.prototype, type);
  }

  /**
   * Enhance the prototype of the type
   * @param {Object} proto
   * @param {metamodel.ManagedType} type
   */
  enhancePrototype(proto, type) {
    if (proto.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      Object.defineProperty(proto, 'toString', {
        value: function toString() {
          return this.metadata.id || this.metadata.bucket;
        },
        enumerable: false,
      });
    }

    // enhance all persistent object properties
    if (type.superType && type.superType.name === 'Object') {
      for (const attr of type.superType.declaredAttributes) {
        if (!attr.isMetadata) {
          this.enhanceProperty(proto, attr);
        }
      }
    }

    // enhance all persistent properties
    for (const attr of type.declaredAttributes) {
      this.enhanceProperty(proto, attr);
    }
  }

  /**
   * @param {Object} proto
   * @param {metamodel.Attribute} attribute
   */
  enhanceProperty(proto, attribute) {
    const name = '$' + attribute.name;
    this.defineProperty(proto, attribute.name, {
      get() {
        const metadata = this.metadata;
        metadata.readAccess();
        return metadata[name];
      },
      set(value) {
        const metadata = this.metadata;
        metadata.writeAccess();
        metadata[name] = value;
      },
      configurable: true,
      enumerable: true,
    });
  }
}

module.exports = Enhancer;
