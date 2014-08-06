var State = require('../util').State;
var ClassFactory;

/**
 * @class jspa.binding.ClassFactory
 */
exports.ClassFactory = ClassFactory = Object.inherit(
/**
 * @lends {jspa.binding.ClassFactory.prototype}
 */
{

  extend: {
    /**
     * @param {Function} obj
     */
    ensureDb: function(obj) {
      var context = typeof window != "undefined" ? window : global;
      obj.db = obj.db || context.db;
      if (!obj.db) {
        throw new jspa.error.PersistentError("No database context is set.");
      }
    }
  },

  /**
   * @param {jspa.metamodel.ManagedType} model
   * @returns {Function} typeConstructor
   */
  createProxyClass: function (model) {
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
  getIdentifier: function (typeConstructor) {
    return typeConstructor.__jspaId__;
  },

  /**
   * @param {Function} typeConstructor
   * @param {String} identifier
   */
  setIdentifier: function (typeConstructor, identifier) {
    typeConstructor.__jspaId__ = identifier;
  },

  /**
   * @param {jspa.metamodel.Type} type
   * @param {Function} typeConstructor
   */
  enhance: function(type, typeConstructor) {
    this.setIdentifier(typeConstructor, type.identifier);

    Object.defineProperties(typeConstructor.prototype, {
      _objectInfo: {
        value: {
          'class': type.identifier
        },
        writable: true,
        enumerable: false
      },

      save: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          return this.db.save(this, false, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      saveAndRefresh: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          return this.db.save(this, true, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      insert: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          return this.db.insert(this, false, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      insertAndRefresh: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          return this.db.insert(this, true, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      update: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          return this.db.update(this, false, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      updateAndRefresh: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          return this.db.update(this, true, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      refresh: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          this.db.refresh(this, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      remove: {
        value: function(depth, doneCallback, failCallback) {
          ClassFactory.ensureDb(this);
          this.db.remove(this, depth ? depth : 0, doneCallback, failCallback);
        },
        enumerable: false
      },

      attr: {
        value: function() {
          ClassFactory.ensureDb(this);
          throw new Error("Attr is not yet implemented.");
        },
        enumerable: false
      }
    });

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
    var name = '_' + attribute.name;
    Object.defineProperty(typeConstructor.prototype, attribute.name, {
      get: function () {
        State.readAccess(this);
        return this[name];
      },
      set: function (value) {
        State.writeAccess(this);
        this[name] = value;
      },
      configurable: true,
      enumerable: true
    });
  }

});


