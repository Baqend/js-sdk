var Metadata = require('../util').Metadata;
var Enhanced = require('./Enhanced').Enhanced;
var error = require('../error');
var ClassFactory;

/**
 * @class jspa.binding.ClassFactory
 */
exports.ClassFactory = ClassFactory = Object.inherit(/** @lends {jspa.binding.ClassFactory.prototype} */ {
  /**
   * @param {jspa.metamodel.ManagedType} model
   * @returns {Function} typeConstructor
   */
  createProxyClass: function(model) {
    if (model.isEntity) {
      return model.superType.typeConstructor.inherit({});
    } else if (model.isEmbeddable) {
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
    return new managedType.typeConstructor();
  },

  /**
   * @param {jspa.metamodel.ManagedType} type
   * @param {Function} typeConstructor
   * @param {boolean} enhanceFunctions
   */
  enhance: function(type, typeConstructor, enhanceFunctions) {
    this.setIdentifier(typeConstructor, type.identifier);

    Enhanced.enhancePrototype(typeConstructor, type, enhanceFunctions);
  }

});


