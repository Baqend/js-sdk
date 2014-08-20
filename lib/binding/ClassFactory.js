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
      console.log('Initialize proxy class for entity ' + model.identifier + '.');
      return model.superType.typeConstructor.inherit({});
    } else if (model.isEmbeddable) {
      console.log('Initialize proxy class for embeddable ' + model.identifier + '.');
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
   * @param {jspa.metamodel.Type} type
   * @param {Function} typeConstructor
   */
  enhance: function(type, typeConstructor) {
    this.setIdentifier(typeConstructor, type.identifier);

    Object.cloneOwnProperties(typeConstructor.prototype, Enhanced.prototype);
    typeConstructor.prototype.constructor = typeConstructor;

    if (typeConstructor.prototype.toString === Object.prototype.toString) {
      typeConstructor.prototype.toString = function() {
        var identifier = this._metadata.getIdentifier();
        return identifier? identifier.substring(4): type.identifier;
      }
    }

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


