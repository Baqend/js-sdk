"use strict";

var Metadata = require('../util/Metadata');

/**
 * @class baqend.binding.Enhancer
 */
class Enhancer {

  /**
   * @param {Class<?>} superClass
   * @returns {Function} typeConstructor
   */
  createProxy(superClass) {
    return class ManagedProxy extends superClass {};
  }

  /**
   * @param {Function} typeConstructor
   * @returns {String}
   */
  getIdentifier(typeConstructor) {
    return typeConstructor.__baqendId__;
  }

  /**
   * @param {Function} typeConstructor
   * @param {String} identifier
   */
  setIdentifier(typeConstructor, identifier) {
    typeConstructor.__baqendId__ = identifier;
  }

  /**
   * Creates a new instance of the managed type
   * @param {baqend.metamodel.ManagedType} managedType The managed type
   */
  create(managedType) {
    return Object.create(managedType.typeConstructor.prototype);
  }

  /**
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} typeConstructor
   */
  enhance(type, typeConstructor) {
    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor, type);
  }

  /**
   * Enhance the prototype of the type
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.ManagedType} type
   */
  enhancePrototype(typeConstructor, type) {
    /*if (typeConstructor.prototype.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      Object.defineProperty(typeConstructor.prototype, 'toString', {
        value: function toString() {
          return this._metadata.ref || type.ref;
        },
        enumerable: false
      });
    }*/

    // enhance all persistent object properties
    if (type.superType && type.superType.name == 'Object') {
      for (let attr of type.superType.declaredAttributes) {
        if (!attr.isMetadata)
          this.enhanceProperty(typeConstructor, attr);
      }
    }

    // enhance all persistent properties
    for (let attr of type.declaredAttributes) {
      this.enhanceProperty(typeConstructor, attr);
    }
  }

  /**
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.Attribute} attribute
   */
  enhanceProperty(typeConstructor, attribute) {
    var name = '$' + attribute.name;
    Object.defineProperty(typeConstructor.prototype, attribute.name, {
      get() {
        Metadata.readAccess(this);
        return this._metadata[name];
      },
      set(value) {
        Metadata.writeAccess(this);
        this._metadata[name] = value;
      },
      configurable: true,
      enumerable: true
    });
  }
}

module.exports = Enhancer;


