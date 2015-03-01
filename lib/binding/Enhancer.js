var Metadata = require('../util/Metadata');
var Lockable = require('../util/Lockable');
var Entity = require('./Entity');
var Managed = require('./Managed');
var User = require('./User');
var Role = require('./Role');

/**
 * @class baqend.binding.Enhancer
 */
var Enhancer = module.exports = Object.inherit(/** @lends baqend.binding.Enhancer.prototype */ {

  /**
   * @param {baqend.metamodel.ManagedType} managedType
   * @returns {Function} typeConstructor
   */
  createProxyClass: function(managedType) {
    if (managedType.isEntity) {
      var Class = managedType.superType.typeConstructor;
      return Class.inherit({});
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
    return typeConstructor.__baqendId__;
  },

  /**
   * @param {Function} typeConstructor
   * @param {String} identifier
   */
  setIdentifier: function(typeConstructor, identifier) {
    typeConstructor.__baqendId__ = identifier;
  },

  /**
   * Creates a new instance of the managed type
   * @param {baqend.metamodel.ManagedType} managedType The managed type
   */
  create: function(managedType) {
    return Object.create(managedType.typeConstructor.prototype);
  },

  /**
   * @param {baqend.metamodel.ManagedType} type
   * @param {Function} typeConstructor
   */
  enhance: function(type, typeConstructor) {
    this.setIdentifier(typeConstructor, type.ref);
    this.enhancePrototype(typeConstructor, type);
  },

  /**
   * Enhance the prototype of the type
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.ManagedType} type
   */
  enhancePrototype: function(typeConstructor, type) {
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

    // enhance all persistent properties
    for (var i = 0, attr; attr = type.declaredAttributes[i]; ++i) {
      this.enhanceProperty(typeConstructor, attr);
    }

    Object.defineProperty(typeConstructor.prototype, 'initialize', {
      value: function(properties) {
        if (properties)
          Object.extend(this, properties);
      },
      enumerable: false
    });

    // ensure that the constructor property isn't visible
    Object.defineProperty(typeConstructor.prototype, 'constructor', {
      value: typeConstructor,
      enumerable: false
    });
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
      var names = Object.getOwnPropertyNames(traitToMixin.prototype);
      for ( var i = 0; i < names.length; ++i) {
        var name = names[i];
        if (name != '__proto__' && name != 'constructor') {
          var descr = Object.getOwnPropertyDescriptor(traitToMixin.prototype, name);
          descr.enumerable = name == 'id' || name == 'version';
          Object.defineProperty(typeConstructor.prototype, name, descr);
        }
      }

      // let isInstance work properly
      types.push(traitToMixin);
      // let superCalls work properly
      prototypeChain.push(traitToMixin.prototype);
    }
  },

  /**
   * @param {Function} typeConstructor
   * @param {baqend.metamodel.Attribute} attribute
   */
  enhanceProperty: function(typeConstructor, attribute) {
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


