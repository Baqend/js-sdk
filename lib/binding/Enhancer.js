'use strict';

const BAQEND_ID = Symbol('BaqendId');
const BAQEND_TYPE = Symbol('BaqendType');

/**
 * @alias binding.Enhancer
 */
class Enhancer {
  /**
   * @param {Class<*>} superClass
   * @return {Class<*>} typeConstructor
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
   * @param {metamodel.ManagedType} type
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
   * @param {metamodel.ManagedType} type
   * @return {void}
   */
  enhancePrototype(proto, type) {
    if (type.isEmbeddable) {
      return; // we do not need to enhance the prototype of embeddable
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
   * @param {metamodel.Attribute} attribute
   * @return {void}
   */
  enhanceProperty(proto, attribute) {
    const name = attribute.name;
    Object.defineProperty(proto, attribute.name, {
      get() {
        this._metadata.throwUnloadedPropertyAccess(name);
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

module.exports = Enhancer;
