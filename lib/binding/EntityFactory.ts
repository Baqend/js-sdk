import { ManagedFactory } from './ManagedFactory';
import type { Entity } from './Entity';
import { Json, JsonMap } from '../util';
import { Builder } from '../query';
import { EntityPartialUpdateBuilder } from '../partialupdate';
import { Metadata } from '../intersection';

export class EntityFactory<T extends Entity> extends ManagedFactory<T> {
  /**
   * Creates a new instance of the factory type
   *
   * @param args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return A new created instance of T
   */
  newInstance(args?: any[] | IArguments) {
    const instance = super.newInstance(args);
    Metadata.get(instance).db = this.db;
    return instance;
  }

  /**
   * Loads the instance for the given id, or null if the id does not exists.
   * @param id The id to query
   * @param [options] The load options
   * @param [options.depth=0] The object depth which will be loaded. Depth 0 loads only this object,
   * <code>true</code> loads the objects by reachability.
   * @param [options.refresh=false] Indicates whether the object should be revalidated (cache bypass).
   * @param [options.local=false] Indicates whether the local copy (from the entity manager)
   * of an object should be returned if it exists. This value might be stale.
   * @param doneCallback Called when the operation succeed.
   * @param failCallback Called when the operation failed.
   * @return A Promise that will be fulfilled when the asynchronous operation completes.
   */
  load(id: string, options?: { depth?: number | boolean, refresh?: boolean, local?: boolean, }, doneCallback?: any,
    failCallback?: any): Promise<T | null> {
    if (typeof options === 'function') {
      return this.load(id, {}, options, doneCallback);
    }

    return this.db.load(this.managedType.typeConstructor, id, options).then(doneCallback, failCallback);
  }

  /**
   * Gets an unloaded reference for the given id.
   * @param id The id of an object to get a reference for.
   * @return An unloaded reference to the object with the given id.
   */
  ref(id: string): T {
    return this.db.getReference(this.managedType.ref, id);
  }

  /**
   * Creates a new instance and sets the DatabaseObject to the given json
   * @param json
   * @return instance
   */
  fromJSON(json: Json): T {
    const obj: T = this.db.getReference(this.managedType.ref, (json as JsonMap).id as string);
    return this.managedType.fromJsonValue(Metadata.get(obj), json, obj, { persisting: false })!;
  }

  /**
   * Creates a new query for this class
   * @return The query builder
   */
  find(): Builder<T> {
    return this.db.createQueryBuilder(this.managedType.typeConstructor);
  }

  /**
   * Creates a new partial update for this class
   * @param id The id to partial update
   * @param [partialUpdate] An initial partial update to execute
   * @return A partial update builder for the given entity id
   */
  partialUpdate(id: string, partialUpdate?: Json): EntityPartialUpdateBuilder<T> {
    return this.ref(id).partialUpdate(partialUpdate);
  }

  /**
   * Executes a raw query for this class if the bucket supports it.
   * @param query The query to be executed
   * @param triggeredBy Who or what triggered this query
   */
  executeQuery(query: string, triggeredBy: string): Promise<any[]> {
    return this.db.executeQuery(this.managedType.typeConstructor, query, triggeredBy);
  }
}
