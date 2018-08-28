"use strict";

const Managed = require('./Managed');
const EntityPartialUpdateBuilder = require('../partialupdate/EntityPartialUpdateBuilder');

/**
 * @alias binding.Entity
 * @extends binding.Managed
 */
class Entity extends Managed {
  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   */
  constructor(properties) {
    super(properties);
  }
}

Object.defineProperties(Entity.prototype, /** @lends binding.Entity.prototype */ {
  /**
   * The unique id of this object
   *
   * Sets the unique id of this object, if the id is not formatted as an valid id,
   * it will be used as the key component of the id has the same affect as setting the key
   *
   * @type string
   */
  id: {
    get() {
      return this._metadata.id;
    },

    set(value) {
      if (this._metadata.id)
        throw new Error('The id can\'t be set twice: ' + value);

      value += '';
      if (value.indexOf('/db/' + this._metadata.bucket + '/') == 0) {
        this._metadata.id = value;
      } else {
        this.key = value;
      }
    },
    enumerable: true
  },


  /**
   * The unique key part of the id
   * When the key of the unique id is set an error will be thrown if an id is already set.
   * @type string
   */
  key: {
    get() {
      return this._metadata.key;
    },

    set(value) {
      this._metadata.key = value;
    }
  },

  /**
   * The version of this object
   * @type number
   */
  version: {
    get() {
      return this._metadata.version;
    },
    enumerable: true
  },

  /**
   * The object read/write permissions
   * @type Acl
   */
  acl: {
    get() {
      return this._metadata.acl;
    },
    enumerable: true
  },

  /**
   * Date of the creation of the object
   * @name createdAt
   * @memberOf binding.Entity.prototype
   * @type Date
   */

  /**
   * Last update date of the object
   * @name updatedAt
   * @memberOf binding.Entity.prototype
   * @type Date
   */

  /**
   * Waits on the previously requested operation on this object completes
   * @param {binding.Entity~doneCallback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Promise<this>} A promise which completes successfully, when the previously requested
   * operation completes
   * @method
   */
  ready: {
    value: function ready(doneCallback) {
      return this._metadata.ready(doneCallback);
    }
  },

  /**
   * Attach this object to the given db
   * @param {EntityManager} db The db which will be used for future crud operations
   * @return {void}
   * @method
   */
  attach: {
    value: function attach(db) {
      db.attach(this);
    }
  },

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Object} [options] The save options
   * @param {boolean} [options.force=false] Force the save operation, the version will not be validated.
   * @param {number|boolean} [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  save: {
    value: function save(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.save(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Object} [options] The insertion options
   * @param {number|boolean} [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  insert: {
    value: function insert(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Updates an existing object.
   * Updates the object if it exists and raise an error if the object doesn't exist.
   * @param {Object} [options] The update options
   * @param {boolean} [options.force=false] Force the update operation, the version will not be validated, only existence will be checked.
   * @param {number|boolean} [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  update: {
    value: function update(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.update(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Resolves the referenced object in the specified depth. Only unresolved objects will be loaded unless the refresh option is specified.
   * Removed objects will be marked as removed.
   * @param {Object} [options] The load options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth set to <code>true</code>
   * loads objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  load: {
    value: function load(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }
      options = options || {};
      options.local = true;

      return this._metadata.db.load(this.id, null, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Delete an existing object.
   * @param {Object} [options] The remove options
   * @param {boolean} [options.force=false] Force the remove operation, the version will not be validated.
   * @param {number|boolean} [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  'delete': {
    value: function(options, doneCallback, failCallback) {
      if (options instanceof Function) {
        failCallback = doneCallback;
        doneCallback = options;
        options = {};
      }

      return this._metadata.db.delete(this, options).then(doneCallback, failCallback);
    }
  },

  /**
   * Saves the object and repeats the operation if the object is out of date.
   * In each pass the callback will be called. Ths first parameter of the callback is the entity and the second one
   * is a function to abort the process.
   *
   * @param {Function} cb Will be called in each pass
   * @param {binding.Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {binding.Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  optimisticSave: {
    value: function optimisticSave(cb, doneCallback, failCallback) {
      return this._metadata.db.optimisticSave(this, cb).then(doneCallback, failCallback);
    }
  },

  attr: {
    value: function attr() {
      throw new Error("Attr is not yet implemented.");
    }
  },

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @return {util.ValidationResult} Contains the result of the Validation
   * @method
   */
  validate: {
    value: function validate() {
      return this._metadata.db.validate(this);
    }
  },

  /**
   * Starts a partial update on this entity
   *
   * @param {json=} operations
   * @return {partialupdate.EntityPartialUpdateBuilder<this>}
   * @method
   */
  partialUpdate: {
    value: function partialUpdate(operations) {
      return new EntityPartialUpdateBuilder(this, operations);
    }
  },

  /**
   * Get all objects which refer to this object
   *
   * @param {Object} [options] Some options to pass
   * @param {Array.<string>} [options.classes] An array of class names to filter for, null for no filter
   * @return {Promise.<binding.Entity>} A promise resolving with an array of all referencing objects
   * @method
   */
  getReferencing: {
    value: function getReferencing(options) {
      const db = this._metadata.db;
      const references = this._metadata.type.getReferencing(db, options);

      // Query all possibly referencing objects
      const allResults = Array.from(references).map((refAttr) => {
        // Create query for given entity
        const ref = refAttr[0];
        const qb = db.createQueryBuilder(ref.typeConstructor);

        // Add term for each attribute
        const attrs = refAttr[1];
        const terms = [];
        attrs.forEach((attr) => {
          terms.push(qb.equal(attr, this));
        });

        // If more than one term, put everything in a disjunction
        const query = terms.length == 1 ? terms[0] : qb.or(terms);

        return query.resultList();
      });

      return Promise.all(allResults).then((results) => {
        // Filter out all objects which did not match
        return results.filter(result => !!result.length);
      }).then((results) => {
        // Flat the array of results
        return [].concat.apply([], results);
      });
    }
  },

  /**
   * Converts the object to an JSON-Object
   * @param {Object|boolean} [options=false] to json options by default excludes the metadata
   * @param {boolean} [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param {number|boolean} [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @return {json} JSON-Object
   * @method
   */
  toJSON: {
    value: function toJSON(options) {
      //JSON.stringify calls toJSON with the parent key as the first argument.
      //Therefore ignore all unknown option types.
      if (typeof options === 'boolean') {
        options = {
          excludeMetadata: options
        }
      }

      if (typeof options !== 'object') {
        options = {};
      }

      return this._metadata.getJson(options);
    }
  }
});

module.exports = Entity;

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback binding.Entity~doneCallback
 * @param {this} entity This entity
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.Entity~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise, result or undefined
 */
