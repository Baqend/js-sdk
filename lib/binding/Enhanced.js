var error = require('../error');
var Metadata = require('../util/Metadata').Metadata;
var Q = require('q');

var Enhanced;

/**
 * @mixin jspa.binding.Enhanced
 */
exports.Enhanced = Enhanced = Trait.inherit(/** @lends jspa.binding.Enhanced.prototype */ {

  extend: {
    createFactory: function(typeConstructor, db, enhanceFunctions) {

      var factory = function() {
        var typeInstance = Object.create(typeConstructor.prototype);
        if(enhanceFunctions)
          typeInstance.attach(db);
        typeConstructor.apply(typeInstance, arguments);
        return typeInstance;
      };

      var classFunctions = {
        get: function(id, depth, doneCallback, failCallback) {
          if(Function.isInstance(depth)) {
            failCallback = doneCallback;
            doneCallback = depth;
            depth = 0;
          }

          return db.find(typeConstructor, id, false, depth, doneCallback, failCallback);
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
      };

      return enhanceFunctions ? Object.extend(factory, classFunctions) : factory;
    },

    enhancePrototype: function(typeConstructor, type, enhanceFunctions) {
      if(enhanceFunctions)
        Object.cloneOwnProperties(typeConstructor.prototype, Enhanced.prototype);

      typeConstructor.prototype.constructor = typeConstructor;
      typeConstructor.linearizedTypes = [Object, Enhanced, typeConstructor];

      this.enhanceMetadata(typeConstructor);

      if (typeConstructor.prototype.toString === Object.prototype.toString) {
        typeConstructor.prototype.toString = function() {
          return this._metadata.ref || type.identifier;
        }
      }

      for (var i = 0, attr; attr = type.declaredAttributes[i]; ++i) {
        this.enhanceProperty(type, attr, typeConstructor);
      }
    },

    enhanceMetadata: function(typeConstructor) {
      Object.defineProperty(typeConstructor.prototype,'_metadata', {
        get: function() {
          Object.defineProperty(this, '_metadata', {
            value: new Metadata(this),
            configurable: true
          });
          return this._metadata;
        }
      });
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
   * @type Q
   * @private
   */
  _readyPromise: Q(null),

  /**
   * Attach this object to the given db
   * @param {jspa.EntityManager} db The db which will be used for future crud operations
   */
  attach: function(db) {
    db.addReference(this);
  },

  /**
   * Waits on the previously requested operation and calls the doneCallback if the operation is fulfilled
   * @param {jspa.binding.Enhanced~doneCallback} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready: function(doneCallback) {
    var self = this;
    return this._readyPromise.finally(function() {
      return self;
    }).then(doneCallback);
  },

  /**
   * @param {jspa.binding.Enhanced~callback} callback
   * @return {Q.Promise<jspa.binding.Enhanced>}
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
   * @param {Boolean} [force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
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
   * @param {Boolean} [force=false] Force the save operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be saved. Depth 0 save this object only,
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
   * @param {Number|Boolean} [depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
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

  /**
   * Inserts a new object and refresh the local object state.
   * Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Number|Boolean} [depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  insertAndRefresh: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.insert(this, true, depth, doneCallback, failCallback);
  },

  /**
   * Updates an existing.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Boolean} [force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  update: function(force, depth, doneCallback, failCallback) {
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
  },

  /**
   * Updates an existing object and refresh the local object state.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Boolean} [force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {Number|Boolean} [depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  updateAndRefresh: function(force, depth, doneCallback, failCallback) {
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
  },

  /**
   * Refresh the local object state, with the server state.
   * Removed objects will be marked as removed.
   * @param {Number|Boolean} [depth=0] The object depth which will be refreshed. Depth 0 refreshes this object only,
   * <code>true</code> refreshes objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  refresh: function(depth, doneCallback, failCallback) {
    if (Function.isInstance(depth)) {
      failCallback = doneCallback;
      doneCallback = depth;
      depth = 0;
    }

    return this._metadata.db.find(this.constructor, this._metadata.id, true, depth, doneCallback, failCallback);
  },

  /**
   * Remove an existing object.
   * @param {Boolean} [force=false] Force the remove operation, the version will not be validated.
   * @param {Number|Boolean} [depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {jspa.binding.Enhanced~doneCallback=} doneCallback Called when the operation succeed.
   * @param {jspa.binding.Enhanced~failCallback=} failCallback Called when the operation failed.
   * @return {Q.Promise<jspa.binding.Enhanced>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  remove: function(force, depth, doneCallback, failCallback) {
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
  },

  attr: function() {
    throw new Error("Attr is not yet implemented.");
  }
});

/**
 * The operation callback is used by the {@link jspa.binding.Enhanced#withLock} method,
 * to perform an exclusive operation on the entity.
 * @callback jspa.binding.Enhanced~callback
 * @return {Q.Promise<*>} A Promise, which reflects the result of the operation
 */

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback jspa.binding.Enhanced~doneCallback
 * @param {jspa.binding.Enhanced} entity This entity
 * @return {Q.Promise<*>|*|undefined} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback jspa.binding.Enhanced~failCallback
 * @param {jspa.error.PersistentError} error The error which reject the operation
 * @return {Q.Promise<*>|*|undefined} A Promise, result or undefined
 */

