var Metadata = require('../util').Metadata;
var Entity = require('./Entity').Entity;
var Managed = require('./Managed').Managed;
var User = require('./User').User;
var Role = require('./Role').Role;
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
    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor, type);
  },

  /**
   * Enhance the prototype of the type
   * @param typeConstructor
   * @param type
   */
  enhancePrototype: function(typeConstructor, type) {
    // mixin managed object type
    this.mixinType(typeConstructor, Managed);

    if (type.isEntity) {
      // mixin entity object type
      this.mixinType(typeConstructor, Entity);

      if (type.isNative) {
        switch (type.name) {
          case '_native.Role':
            this.mixinType(typeConstructor, Role);
            break;
          case '_native.User':
            this.mixinType(typeConstructor, User);
            break;
        }
      }
    }

    if (typeConstructor.prototype.toString === Object.prototype.toString) {
      // implements a better convenience toString method
      typeConstructor.prototype.toString = function() {
        return this._metadata.ref || type.ref;
      };
    }

    // enhance all persistent properties
    for (var i = 0, attr; attr = type.declaredAttributes[i]; ++i) {
      this.enhanceProperty(type, attr, typeConstructor);
    }
  },

  /**
   * Mixes a trait into the given typeConstructor at runtime
   * @param {Function} typeConstructor The typeConstructor which will be extend by the trait
   * @param {Function} traitToMixin The trait to mix in
   */
  mixinType: function(typeConstructor, traitToMixin) {
    var types = typeConstructor.linearizedTypes;
    // fix linearizedTypes if it is not set properly
    if (!types || types.indexOf(typeConstructor) == -1)
      types = typeConstructor.linearizedTypes = [Object, typeConstructor];

    var prototypeChain = typeConstructor.prototypeChain;
    if (!prototypeChain)
      prototypeChain = typeConstructor.prototypeChain = [typeConstructor.prototype];

    // mix in type only if it isn't mixed in already
    if (types.indexOf(traitToMixin) == -1) {
      // mixin type
      Object.cloneOwnProperties(typeConstructor.prototype, traitToMixin.prototype);
      // let isInstance work properly
      types.push(traitToMixin);
      // let superCalls work properly
      prototypeChain.push(traitToMixin.prototype);
      // preserve origin constructor reference
      typeConstructor.prototype.constructor = typeConstructor;
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


