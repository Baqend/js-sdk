var error = require('../error');
var Metadata = require('../util/Metadata').Metadata;
var Q = require('q');

var Enhanced;

/**
 * @mixin jspa.binding.Enhanced
 */
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

  /**
   * @type jspa.util.Metadata
   * @private
   */
  get _metadata() {
    Object.defineProperty(this, '_metadata', {
      value: new Metadata(this),
      configurable: true
    });

    return this._metadata;
  },

  /**
   * @type Q
   * @private
   */
  _readyPromise: Q(null),

  /**
   * Attach this object to the given db
   * @param {jspa.EntityManager} db
   */
  attach: function(db) {
    db.addReference(this);
  },

  /**
   * @param callback
   * @return {Q}
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

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Boolean=false} force Force the save operation, the version will not be validated.
   * @param {Number|Boolean=0} depth The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  save: function(force, depth, doneCallback, failCallback) {
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
  },

  /**
   * Saves the object and refresh the local object state.
   * Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Boolean=false} force Force the save operation, the version will not be validated.
   * @param {Number|Boolean=0} depth The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  saveAndRefresh: function(force, depth, doneCallback, failCallback) {
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
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Number|Boolean=0} depth The object depth which will be inserted. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insert: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.insert(this, false, depth, doneCallback, failCallback);
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

  attr: function() {
    throw new Error("Attr is not yet implemented.");
  }
});

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback jspa.binding.Enhanced~doneCallback
 * @param {jspa.binding.Enhanced} entity This entity
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback jspa.binding.Enhanced~failCallback
 * @param {jspa.error.PersistentError} error The error which reject the operation
 */

