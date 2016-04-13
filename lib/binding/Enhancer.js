"use strict";

var Metadata = require('../util/Metadata');
var Lockable = require('../util/Lockable');

/**
 * @alias baqend.binding.Enhancer
 */
class Enhancer {

  /**
   * @param {Class<?>} superClass
   * @returns {Function} typeConstructor
   */
  createProxy(superClass) {
    return class Proxy extends superClass {};
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
    Object.defineProperty(typeConstructor, '__baqendId__', {
      value: identifier
    });
  }

  /**
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} typeConstructor
   */
  enhance(type, typeConstructor) {
    if (typeConstructor.__baqendType__ == type)
      return;

    if (typeConstructor.hasOwnProperty('__baqendType__'))
      throw new Error('Type is already used by a different manager');

    Object.defineProperty(typeConstructor, '__baqendType__', {
      value: type
    });

    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor.prototype, type);
  }

  /**
   * Enhance the prototype of the type
   * @param {Object} proto
   * @param {baqend.metamodel.ManagedType} type
   */
  enhancePrototype(proto, type) {
    if (proto.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      Object.defineProperty(proto, 'toString', {
        value: function toString() {
          return this._metadata.id || this._metadata.bucket;
        },
        enumerable: false
      });
    }

    // enhance all persistent object properties
    if (type.superType && type.superType.name == 'Object') {
      for (let attr of type.superType.declaredAttributes) {
        if (!attr.isMetadata)
          this.enhanceProperty(proto, attr);
      }
    }

    // enhance all persistent properties
    for (let attr of type.declaredAttributes) {
      this.enhanceProperty(proto, attr);
    }
  }

  /**
   * @param {Object} proto
   * @param {baqend.metamodel.Attribute} attribute
   */
  enhanceProperty(proto, attribute) {
    var name = '$' + attribute.name;
    Object.defineProperty(proto, attribute.name, {
      get() {
        var metadata = this._metadata;
        metadata.readAccess();
        return metadata[name];
      },
      set(value) {
        var metadata = this._metadata;
        metadata.writeAccess();
        metadata[name] = value;
      },
      configurable: true,
      enumerable: true
    });
  }

  enhanceMap(mapConstructor) {

  }
}

module.exports = Enhancer;


