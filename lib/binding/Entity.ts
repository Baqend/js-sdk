'use strict';

import { Managed } from "./Managed";
import { EntityPartialUpdateBuilder } from "../partialupdate";
import { enumerable } from "../util/enumerable";
import { PersistentError } from "../error";
import { Filter } from "../query";
import { Json, JsonMap } from "../util";

export class Entity extends Managed {
  /**
   * The default constructor, copy all given properties to this object
   * @param {Object=} properties - The optional properties to copy
   * @constructor
   */

  /**
   * The unique id of this object
   *
   * Sets the unique id of this object, if the id is not formatted as an valid id,
   * it will be used as the key component of the id has the same affect as setting the key
   *
   * @type string
   */
  @enumerable(true)
  get id(): string | null {
    return this._metadata.id;
  }

  set id(value) {
    if (this._metadata.id) {
      throw new Error('The id can\'t be set twice: ' + value);
    }

    const val = value + '';
    if (val.indexOf('/db/' + this._metadata.bucket + '/') === 0) {
      this._metadata.id = value;
    } else {
      this.key = value;
    }
  }

  /**
   * The unique key part of the id
   * When the key of the unique id is set an error will be thrown if an id is already set.
   * @type string
   */
  @enumerable(false)
  get key() {
    return this._metadata.key;
  }

  set key(value) {
    this._metadata.key = value;
  }

  /**
   * The version of this object
   * @type number
   * @readonly
   */
  @enumerable(true)
  get version() {
    return this._metadata.version;
  }

  /**
   * The object read/write permissions
   * @type Acl
   * @readonly
   */
  @enumerable(true)
  get acl() {
    return this._metadata.acl;
  }

  /**
   * Date of the creation of the object
   * @name createdAt
   * @readonly
   * @memberOf Entity.prototype
   * @type Date
   */
  createdAt: Date | null = null;

  /**
   * Last update date of the object
   * @name updatedAt
   * @readonly
   * @memberOf Entity.prototype
   * @type Date
   */
  updatedAt: Date | null = null

  /**
   * Attach this object to the given db
   * @param {EntityManager} db The db which will be used for future crud operations
   * @return {void}
   * @method
   */
  @enumerable(false)
  attach(db) {
    db.attach(this);
  }

  /**
   * Waits on the previously requested operation on this object completes
   * @param {Entity~doneCallback=} doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return {Promise<this>} A promise which completes successfully, when the previously requested
   * operation completes
   * @method
   */
  @enumerable(false)
  ready(doneCallback) {
    return this._metadata.ready(doneCallback);
  }

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param {Object} [options] The save options
   * @param {boolean} [options.force=false] Force the save operation, the version will not be validated.
   * @param {number|boolean} [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  save(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.save({}, options, doneCallback);
    }

    return this._metadata.db.save(this, options).then(doneCallback, failCallback);
  }

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param {Object} [options] The insertion options
   * @param {number|boolean} [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  insert(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.insert({}, options, doneCallback);
    }

    return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
  }

  /**
   * Updates an existing object
   *
   * Updates the object if it exists and raise an error if the object doesn't exist.
   *
   * @param {Object} [options] The update options
   * @param {boolean} [options.force=false] Force the update operation,
   * the version will not be validated, only existence will be checked.
   * @param {number|boolean} [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  update(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.update({}, options, doneCallback);
    }

    return this._metadata.db.update(this, options).then(doneCallback, failCallback);
  }

  /**
   * Resolves the referenced object in the specified depth
   *
   * Only unresolved objects will be loaded unless the refresh option is specified.
   *
   * Removed objects will be marked as removed.
   * @param {Object} [options] The load options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth set to <code>true</code>
   * loads objects by reachability.
   * @param {boolean} [options.refresh=false] Refresh the local object state from remote.
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  load(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.load({}, options, doneCallback);
    }

    const opt = options || {};
    opt.local = true;

    if (this.id === null) {
      throw new PersistentError("This object can't be loaded, it does have an id.");
    }

    return this._metadata.db.load(this.id, undefined, opt).then(doneCallback, failCallback);
  }

  /**
   * Deletes an existing object
   *
   * @param {Object} [options] The remove options
   * @param {boolean} [options.force=false] Force the remove operation, the version will not be validated.
   * @param {number|boolean} [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  delete(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.delete({}, options, doneCallback);
    }

    return this._metadata.db.delete(this, options).then(doneCallback, failCallback);
  }

  /**
   * Saves the object and repeats the operation if the object is out of date
   *
   * In each pass the callback will be called. Ths first parameter of the callback is the entity and the second one
   * is a function to abort the process.
   *
   * @param {Function} cb Will be called in each pass
   * @param {Entity~doneCallback=} doneCallback Called when the operation succeed.
   * @param {Entity~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<this>} A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  optimisticSave(cb, doneCallback, failCallback) {
    return this._metadata.db.optimisticSave(this, cb).then(doneCallback, failCallback);
  }

  @enumerable(false)
  attr() {
    throw new Error('Attr is not yet implemented.');
  }

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @return {ValidationResult} Contains the result of the Validation
   * @method
   */
  @enumerable(false)
  validate() {
    return this._metadata.db.validate(this);
  }

  /**
   * Starts a partial update on this entity
   *
   * @param operations initial operations which should be executed
   * @return
   */
  @enumerable(false)
  partialUpdate(operations?: Json): EntityPartialUpdateBuilder<this> {
    return new EntityPartialUpdateBuilder(this, operations as JsonMap);
  }

  /**
   * Get all objects which refer to this object
   *
   * @param {Object} [options] Some options to pass
   * @param {Array.<string>} [options.classes] An array of class names to filter for, null for no filter
   * @return {Promise.<Entity>} A promise resolving with an array of all referencing objects
   * @method
   */
  @enumerable(false)
  getReferencing(options) {
    const db = this._metadata.db;
    const references = this._metadata.type.getReferencing(db, options);

    // Query all possibly referencing objects
    const allResults = Array.from(references).map(([ ref, attrs]) => {
      // Create query for given entity
      const qb = db.createQueryBuilder(ref.typeConstructor);

      // Add term for each attribute
      const terms: Filter<any>[] = [];
      attrs.forEach((attr) => {
        terms.push(qb.equal(attr, this));
      });

      // If more than one term, put everything in a disjunction
      const query = terms.length === 1 ? terms[0] : qb.or(terms);

      return query.resultList();
    });

    return Promise.all(allResults).then(results => (
      // Filter out all objects which did not match
      results.filter(result => !!result.length)
    )).then(results => (
      // Flat the array of results
      [].concat.apply([], results)
    ));
  }

  /**
   * Converts the object to an JSON-Object
   * @param {Object|boolean} [options=false] to json options by default excludes the metadata
   * @param {boolean} [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param {number|boolean} [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @return JSON-Object
   * @method
   */
  @enumerable(false)
  toJSON(options?): Json {
    // JSON.stringify calls toJSON with the parent key as the first argument.
    // Therefore ignore all unknown option types.
    let opt = options;
    if (typeof opt === 'boolean') {
      opt = {
        excludeMetadata: opt,
      };
    }

    if (typeof opt !== 'object') {
      opt = {};
    }

    return this._metadata.getJson(opt);
  }
}

/**
 * The done callback is called, when the asynchronous operation completes successfully
 * @callback Entity~doneCallback
 * @param {this} entity This entity
 * @return {Promise<*>|*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback Entity~failCallback
 * @param {PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise, result or undefined
 */
