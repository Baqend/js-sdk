'use strict';

import { ManagedFactory } from "./ManagedFactory";
import { Entity } from "./Entity";
import { Class, Json, JsonMap } from "../util";
import { Managed } from "./Managed";
import { ManagedType } from "../metamodel/ManagedType";
import { EntityManager } from "../EntityManager";
import { EntityType } from "../metamodel/EntityType";
import { Factory } from "./Factory";

export class EntityFactory<T extends Entity> extends ManagedFactory<T> {

  /**
   * Loads the instance for the given id, or null if the id does not exists.
   * @param {string} id The id to query
   * @param {Object} [options] The load options
   * @param {number|boolean} [options.depth=0] The object depth which will be loaded. Depth 0 loads only this object,
   * <code>true</code> loads the objects by reachability.
   * @param {boolean} [options.refresh=false] Indicates whether the object should be revalidated (cache bypass).
   * @param {boolean} [options.local=false] Indicates whether the local copy (from the entity manager)
   * of an object should be returned if it exists. This value might be stale.
   * @param {EntityFactory~doneCallback=} doneCallback Called when the operation succeed.
   * @param {EntityFactory~failCallback=} failCallback Called when the operation failed.
   * @return {Promise<T>} A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load(id, options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.load(id, {}, options, doneCallback);
    }

    return this.db.load(this.managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  }

  /**
   * Gets an unloaded reference for the given id.
   * @param {string} id The id of an object to get a reference for.
   * @return {T} An unloaded reference to the object with the given id.
   */
  ref(id) {
    return this.db.getReference(this.managedType.ref, id);
  }

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param json
   * @return instance
   */
  fromJSON(json: Json): T {
    const obj = this.ref((json as JsonMap).id);
    return this.managedType.fromJsonValue(null, json, obj);
  }

  /**
   * Creates a new query for this class
   * @return {Builder<T>} The query builder
   */
  find() {
    return this.db.createQueryBuilder(this.managedType.typeConstructor);
  }

  /**
   * Creates a new partial update for this class
   * @param {string} id The id to partial update
   * @param [partialUpdate] An initial partial update to execute
   * @return {EntityPartialUpdateBuilder<T>}
   */
  partialUpdate(id, partialUpdate?: Json) {
    return this.ref(id).partialUpdate(partialUpdate);
  }
}


/**
 * The entity callback is called, when the asynchronous operation completes successfully
 * @callback EntityFactory~doneCallback
 * @param {T} entity The entity
 * @return {Promise<*>|*} A Promise or result
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback EntityFactory~failCallback
 * @param {PersistentError} error The error which reject the operation
 * @return {Promise<*>|*} A Promise or result
 */
