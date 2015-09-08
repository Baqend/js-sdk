"use strict";

var Metadata = require('../util/Metadata');
var Lockable = require('../util/Lockable');
var Entity = require('./Entity');
var Managed = require('./Managed');
var User = require('./User');
var Role = require('./Role');

/**
 * @class baqend.binding.Enhancer
 */
class Enhancer {

  /**
   * @param {baqend.metamodel.ManagedType} managedType
   * @returns {Function} typeConstructor
   */
  createProxyClass(managedType) {
    if (managedType.isEntity) {
      var Class = managedType.superType.typeConstructor;
      return class EntityProxy extends Class {
        constructor(properties) {
          super();
          if (properties)
            Object.assign(this, properties);
        }
      }
    } else if (managedType.isEmbeddable) {
      return class EmbeddableProxy {
        constructor(properties) {
          if (properties)
            Object.assign(this, properties);
        }
      }
    } else {
      throw new TypeError('No proxy class can be initialized.');
    }
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
    // mixin managed object type
    this.mixinType(typeConstructor, Managed);

    if (type.isEntity) {
      // mixin entity object type
      this.mixinType(typeConstructor, Entity);

      switch (type.name) {
        case 'Role':
          this.mixinType(typeConstructor, Role);
          break;
        case 'User':
          this.mixinType(typeConstructor, User);
          break;
      }
    }

    if (typeConstructor.prototype.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      Object.defineProperty(typeConstructor.prototype, 'toString', {
        value: function toString() {
          return this._metadata.ref || type.ref;
        },
        enumerable: false
      });
    }

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

    // ensure that the constructor property isn't visible
    Object.defineProperty(typeConstructor.prototype, 'constructor', {
      value: typeConstructor,
      enumerable: false
    });
  }

  /**
   * Mixes a trait into the given typeConstructor at runtime
   * @param {Function} typeConstructor The typeConstructor which will be extend by the trait
   * @param {Function} traitToMixin The trait to mix in
   */
  mixinType(typeConstructor, traitToMixin) {
    /*var types = typeConstructor.linearizedTypes;
    // fix linearizedTypes if it is not set properly
    if (!types || types.indexOf(typeConstructor) == -1)
      types = typeConstructor.linearizedTypes = [Object, typeConstructor];

    var prototypeChain = typeConstructor.prototypeChain;
    if (!prototypeChain)
      prototypeChain = typeConstructor.prototypeChain = [typeConstructor.prototype];

    // mix in type only if it isn't mixed in already
    if (types.indexOf(traitToMixin) == -1) {
      // mixin type */
      var names = Object.getOwnPropertyNames(traitToMixin.prototype);
      for (let name of names) {
        if (name != '__proto__' && name != 'constructor') {
          var descr = Object.getOwnPropertyDescriptor(traitToMixin.prototype, name);
          descr.enumerable = name == 'id' || name == 'version';
          Object.defineProperty(typeConstructor.prototype, name, descr);
        }
      }
      /*
      // let isInstance work properly
      types.push(traitToMixin);
      // let superCalls work properly
      prototypeChain.push(traitToMixin.prototype);
    }*/
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


