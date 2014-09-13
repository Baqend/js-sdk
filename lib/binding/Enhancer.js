var Metadata = require('../util').Metadata;
var Enhanced = require('./Enhanced').Enhanced;
var error = require('../error');
var Enhancer;

/**
 * @class jspa.binding.Enhancer
 */
exports.Enhancer = Enhancer = Object.inherit(/** @lends {jspa.binding.Enhancer.prototype} */ {
  /**
   * @param {jspa.metamodel.ManagedType} managedType
   * @returns {Function} typeConstructor
   */
  createProxyClass: function(managedType) {
    if (managedType.isEntity) {
      return managedType.superType.typeConstructor.inherit({});
    } else if (managedType.isEmbeddable) {
      return Object.inherit({});
    } else {
      throw new TypeError('No proxy class can be initialized.');
    }
  },

  /**
   * @param {Function} typeConstructor
   * @returns {String}
   */
  getIdentifier: function(typeConstructor) {
    return typeConstructor.__jspaId__;
  },

  /**
   * @param {Function} typeConstructor
   * @param {String} identifier
   */
  setIdentifier: function(typeConstructor, identifier) {
    typeConstructor.__jspaId__ = identifier;
  },

  /**
   * Creates a new inszance of the managed type
   * @param {jspa.metamodel.ManagedType} managedType The managed type
   */
  create: function(managedType) {
    return Object.create(managedType.typeConstructor.prototype);
  },

  /**
   * @param {jspa.metamodel.ManagedType} type
   * @param {Function} typeConstructor
   */
  enhance: function(type, typeConstructor) {
    this.setIdentifier(typeConstructor, type.identifier);
    this.enhancePrototype(typeConstructor, type);
  },

  /**
   * Enhance the prototype of the type
   * @param typeConstructor
   * @param type
   */
  enhancePrototype: function(typeConstructor, type) {
    if (type.isEntity) {
      // copy all Enhanced properties
      Object.cloneOwnProperties(typeConstructor.prototype, Enhanced.prototype);
    } else {
      // copy the _metadata property only
      Object.defineProperty(typeConstructor.prototype, '_metadata',
          Object.getOwnPropertyDescriptor(Enhanced.prototype, '_metadata'));
    }

    // preserve the constructor property
    typeConstructor.prototype.constructor = typeConstructor;
    typeConstructor.linearizedTypes = [Object, Enhanced, typeConstructor];

    if (typeConstructor.prototype.toString === Object.prototype.toString) {
      typeConstructor.prototype.toString = function() {
        return this._metadata.ref || type.identifier;
      }
    }

    // enhance all persistent properties
    for (var i = 0, attr; attr = type.declaredAttributes[i]; ++i) {
      this.enhanceProperty(type, attr, typeConstructor);
    }
  },

  /**
   * @param {jspa.metamodel.ManagedType} type
   * @param {jspa.metamodel.Attribute} attribute
   * @param {Function} typeConstructor
   */
  enhanceProperty: function(type, attribute, typeConstructor) {
    var name = '$' + attribute.name;
    Object.defineProperty(typeConstructor.prototype, attribute.name, {
      get: function() {
        Metadata.readAccess(this);
        return this._metadata[name];
      },
      set: function(value) {
        Metadata.writeAccess(this);
        this._metadata[name] = value;
      },
      configurable: true,
      enumerable: true
    });
  }

});


