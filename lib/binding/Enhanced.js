var error = require('../error');
var Metadata = require('../util/Metadata').Metadata;
var Q = require('q');

var Enhanced;

exports.Enhanced = Enhanced = Trait.inherit(/** @lends jspa.binding.Enhanced.prototype */ {

  extend: {
    createFactory: function(typeConstructor, db) {
      return Object.extend(function() {
        var typeInstance = Object.create(typeConstructor.prototype);
        typeInstance.attach(db);
        typeConstructor.apply(typeInstance, arguments);
        return typeInstance;
      }, {
        get: function(id, doneCallback, failCallback) {
          return db.find(typeConstructor, id, false, doneCallback, failCallback);
        },

        find: function() {
          throw new Error("find is not yet implemented.");
        },

        methods: typeConstructor.prototype,

        addMethods: function(methods) {
          Object.extend(typeConstructor.prototype, methods);
        },

        addMethod: function(name, fn) {
          typeConstructor.prototype[name] = fn;
        },

        partialUpdate: function() {
          throw new Error("partialUpdate is not yet implemented.");
        }
      });
    },

    enhancePrototype: function(typeConstructor, type) {
      Object.cloneOwnProperties(typeConstructor.prototype, Enhanced.prototype);
      typeConstructor.prototype.constructor = typeConstructor;
      typeConstructor.linearizedTypes = [Object, Enhanced, typeConstructor];

      if (typeConstructor.prototype.toString === Object.prototype.toString) {
        typeConstructor.prototype.toString = function() {
          return this._metadata.ref || type.identifier;
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
  },

  get _metadata() {
    Object.defineProperty(this, '_metadata', {
      value: new Metadata(this),
      configurable: true
    });

    return this._metadata;
  },

  _readyPromise: {
    value: Q(null),
    writable: true
  },

  attach: {
    value: function(db) {
      db.addReference(this);
    }
  },

  /**
   * @param callback
   * @return {*}
   */
  withLock: function(callback) {
    if(this._readyPromise.isPending())
      throw new Error('Current operation has not been finished.')

    var promise;
    try {
      promise = callback();
    } catch(e) {
      promise = Q.reject(e);
    }

    return this._readyPromise = promise;
  },

  save: {
    value: function(force, depth, doneCallback, failCallback) {
      if (Function.isInstance(force)) {
        failCallback = depth;
        doneCallback = force;
        depth = 0;
        force = false;
      } else if (Function.isInstance(depth)) {
        failCallback = doneCallback;
        doneCallback = depth;
        depth = 0;
      }

      return this._metadata.db.save(this, false, force, depth, doneCallback, failCallback);
    }
  },

  saveAndRefresh: {
    value: function(force, depth, doneCallback, failCallback) {
      if (Function.isInstance(force)) {
        failCallback = depth;
        doneCallback = force;
        depth = 0;
        force = false;
      } else if (Function.isInstance(depth)) {
        failCallback = doneCallback;
        doneCallback = depth;
        depth = 0;
      }

      return this._metadata.db.save(this, true, force, depth, doneCallback, failCallback);
    }
  },

  insert: {
    value: function(depth, doneCallback, failCallback) {
      if (Function.isInstance(depth)) {
        failCallback = doneCallback;
        doneCallback = depth;
        depth = 0;
      }

      return this._metadata.db.insert(this, false, depth, doneCallback, failCallback);
    }
  },

  insertAndRefresh: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.insert(this, true, depth, doneCallback, failCallback);
    }
  },

  update: {
    value: function(force, depth, doneCallback, failCallback) {
      if (Function.isInstance(force)) {
        failCallback = depth;
        doneCallback = force;
        depth = 0;
        force = false;
      } else if (Function.isInstance(depth)) {
        failCallback = doneCallback;
        doneCallback = depth;
        depth = 0;
      }

      return this._metadata.db.update(this, false, force, depth, doneCallback, failCallback);;
    }
  },

  updateAndRefresh: {
    value: function(force, depth, doneCallback, failCallback) {
      if (Function.isInstance(force)) {
        failCallback = depth;
        doneCallback = force;
        depth = 0;
        force = false;
      } else if (Function.isInstance(depth)) {
        failCallback = doneCallback;
        doneCallback = depth;
        depth = 0;
      }

      return this._metadata.db.update(this, true, force, depth, doneCallback, failCallback);
    }
  },

  refresh: {
    value: function(depth, doneCallback, failCallback) {
      if (Function.isInstance(depth)) {
        failCallback = doneCallback;
        doneCallback = depth;
        depth = 0;
      }

      return this._metadata.db.find(this.constructor, this._metadata.id, true, doneCallback, failCallback);
    }
  },

  remove: {
    value: function(force, depth, doneCallback, failCallback) {
      if (Function.isInstance(force)) {
        failCallback = depth;
        doneCallback = force;
        depth = 0;
        force = false;
      } else if (Function.isInstance(depth)) {
        failCallback = doneCallback;
        doneCallback = depth;
        depth = 0;
      }

      return this._metadata.db.remove(this, force, depth, doneCallback, failCallback);
    }
  },

  attr: {
    value: function() {
      throw new Error("Attr is not yet implemented.");
    }
  }
});
