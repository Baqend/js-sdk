import { Managed } from './Managed';
import { EntityPartialUpdateBuilder } from '../partialupdate';
import { enumerable } from '../util/enumerable';
import { PersistentError } from '../error';
import { Filter } from '../query';
import { Json, JsonMap } from '../util';
import { Metadata, ValidationResult } from '../intersection';
import type { EntityManager } from '../EntityManager';
import { Enhancer } from './Enhancer';

export interface Entity {
  /**
   * Contains the metadata of this managed object
   */
  _metadata: Metadata;
}
export class Entity extends Managed {
  /**
   * Date of the creation of the object
   * @name createdAt
   * @readonly
   * @memberOf Entity.prototype
   * @type Date
   */
  createdAt?: Date | null;

  /**
   * Last update date of the object
   * @name updatedAt
   * @readonly
   * @memberOf Entity.prototype
   * @type Date
   */
  updatedAt?: Date | null;

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

  set id(value: string | null) {
    if (this._metadata.id) {
      throw new Error(`The id can't be set twice: ${value}`);
    }

    const val = `${value}`;
    if (val.indexOf(`/db/${this._metadata.bucket}/`) === 0) {
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
    this._metadata.throwUnloadedPropertyAccess('acl');
    return this._metadata.acl;
  }

  /**
   * Attach this object to the given db
   * @param db The db which will be used for future crud operations
   * @return
   */
  @enumerable(false)
  attach(db: EntityManager): void {
    db.attach(this);
  }

  /**
   * Waits on the previously requested operation on this object completes
   * operations on this object is completed.
   * @return A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready(): Promise<this>;

  /**
   * Waits on the previously requested operation on this object completes
   * @param doneCallback The callback which will be invoked when the previously
   * operations on this object is completed.
   * @return A promise which completes successfully, when the previously requested
   * operation completes
   */
  ready<R>(doneCallback: (entity: this) => R): Promise<R>;

  @enumerable(false)
  ready<R>(doneCallback?: (entity: this) => R): Promise<this | R> {
    return this._metadata.ready().then(() => this).then(doneCallback);
  }

  /**
   * Saves the object. Inserts the object if it doesn't exists and updates the object if the object exist.
   * @param [options] The save options
   * @param [options.force=false] Force the save operation, the version will not be validated.
   * @param [options.depth=0] The object depth which will be saved. Depth 0 save this object only,
   * <code>true</code> saves the objects by reachability.
   * @param [options.refresh=false] Refresh the local object state from remote.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A Promise that will be fulfilled when the asynchronous operation completes.
   */
  @enumerable(false)
  save(options?: { force?: boolean, depth?: number | boolean, refresh?: boolean}, doneCallback?: any,
    failCallback?: any): Promise<this> {
    if (typeof options === 'function') {
      return this.save({}, options, doneCallback);
    }

    return this._metadata.db.save(this, options).then(doneCallback, failCallback);
  }

  /**
   * Inserts a new object. Inserts the object if it doesn't exists and raise an error if the object already exist.
   * @param [options] The insertion options
   * @param [options.depth=0] The object depth which will be inserted. Depth 0 insert this object only,
   * <code>true</code> inserts objects by reachability.
   * @param [options.refresh=false] Refresh the local object state from remote.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  insert(options?: { depth?: number | boolean, refresh?: boolean }, doneCallback?: any,
    failCallback?: any): Promise<this> {
    if (typeof options === 'function') {
      return this.insert({}, options, doneCallback);
    }

    return this._metadata.db.insert(this, options).then(doneCallback, failCallback);
  }

  /**
   * Updates an existing object
   *
   * Updates the object if it exists and raise an error if the object doesn't exist.
   *
   * @param [options] The update options
   * @param [options.force=false] Force the update operation,
   * the version will not be validated, only existence will be checked.
   * @param [options.depth=0] The object depth which will be updated. Depth 0 updates this object only,
   * <code>true</code> updates objects by reachability.
   * @param [options.refresh=false] Refresh the local object state from remote.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  update(options?: { force?: boolean, depth?: number | boolean, refresh?: boolean }, doneCallback?: any,
    failCallback?: any): Promise<this> {
    if (typeof options === 'function') {
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
   * @param [options] The load options
   * @param [options.depth=0] The object depth which will be loaded. Depth set to <code>true</code>
   * loads objects by reachability.
   * @param [options.refresh=false] Refresh the local object state from remote.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  load(options?: { depth?: number | boolean, refresh?: boolean }, doneCallback?: any,
    failCallback?: any): Promise<this> {
    if (typeof options === 'function') {
      return this.load({}, options, doneCallback);
    }

    const opt = { local: true, ...options };

    if (this.id === null) {
      throw new PersistentError("This object can't be loaded, it does have an id.");
    }

    return this._metadata.db.load(this.id, undefined, opt).then(doneCallback, failCallback);
  }

  /**
   * Deletes an existing object
   *
   * @param [options] The remove options
   * @param [options.force=false] Force the remove operation, the version will not be validated.
   * @param [options.depth=0] The object depth which will be removed. Depth 0 removes this object only,
   * <code>true</code> removes objects by reachability.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  delete(options?: { force?: boolean, depth?: number | boolean }, doneCallback?: any,
    failCallback?: any): Promise<this> {
    if (typeof options === 'function') {
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
   * @param cb Will be called in each pass
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A Promise that will be fulfilled when the asynchronous operation completes.
   * @method
   */
  @enumerable(false)
  optimisticSave(cb: (entity: this, abort: () => void) => any, doneCallback?: any, failCallback?: any): Promise<this> {
    return this._metadata.db.optimisticSave(this, cb).then(doneCallback, failCallback);
  }

  @enumerable(false)
  attr() {
    throw new Error('Attr is not yet implemented.');
  }

  /**
   * Validates the entity by using the validation code of the entity type
   *
   * @return Contains the result of the Validation
   * @method
   */
  @enumerable(false)
  validate(): ValidationResult {
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
   * @param [options] Some options to pass
   * @param [options.classes] An array of class names to filter for, null for no filter
   * @return A promise resolving with an array of all referencing objects
   * @method
   */
  @enumerable(false)
  getReferencing(options?: { classes: string[] }): Promise<Entity[]> {
    const { db } = this._metadata;
    const references = this._metadata.type.getReferencing(db, options);

    // Query all possibly referencing objects
    const allResults = Array.from(references).map(([ref, attrs]) => {
      // Create query for given entity
      const qb = db.createQueryBuilder<Entity>(ref.typeConstructor);

      // Add term for each attribute
      const terms: Filter<Entity>[] = [];
      attrs.forEach((attr) => {
        terms.push(qb.equal(attr, this));
      });

      // If more than one term, put everything in a disjunction
      const query = terms.length === 1 ? terms[0] : qb.or(terms);

      return query.resultList();
    });

    return Promise.all(allResults).then((results) => (
      // Filter out all objects which did not match
      results.filter((result) => !!result.length)
    )).then((results) => (
      // Flat the array of results
      Array.prototype.concat.apply([] as Entity[], results)
    ));
  }

  /**
   * Returns this object identifier or the baqend type of this object
   * @return the object id or type whatever is available
   */
  @enumerable(false)
  toString(): string {
    const type = Enhancer.getBaqendType(this.constructor);
    return this.id || type!.ref;
  }

  /**
   * Converts the object to an JSON-Object
   * @param [options=false] to json options by default excludes the metadata
   * @param [options.excludeMetadata=false] Excludes the metadata form the serialized json
   * @param [options.depth=0] Includes up to depth referenced objects into the serialized json
   * @return JSON-Object
   * @method
   */
  @enumerable(false)
  toJSON(options?: boolean | { excludeMetadata?: boolean, depth?: boolean | number }): Json {
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

    const state = this._metadata;
    return state.type.toJsonValue(state, this, opt);
  }
}
