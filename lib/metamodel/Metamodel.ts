import { ManagedType } from './ManagedType';
import { EntityType } from './EntityType';
import { Enhancer, Managed } from '../binding';
import { ModelBuilder } from './ModelBuilder';
import { DbIndex } from './DbIndex';
import {
  Class, Json, JsonArray, JsonMap, Lockable,
} from '../util';
import { StatusCode } from '../connector';
import * as message from '../message';
import type { EntityManagerFactory } from '../EntityManagerFactory';
import type { EmbeddableType } from './EmbeddableType';
import type { BasicType } from './BasicType';
import type { Type } from './Type';

export class Metamodel extends Lockable {
  /**
   * Defines if the Metamodel has been finalized
   */
  public isInitialized: boolean = false;

  public entityManagerFactory: EntityManagerFactory;

  public entities: {[name: string]: EntityType<any>} = {};

  public embeddables: {[name: string]: EmbeddableType<any>} = {};

  public baseTypes: {[name: string]: BasicType<any>} = {};

  public enhancer: Enhancer = new Enhancer();

  /**
   * Constructs a new metamodel instance which represents the complete schema of one baqend app
   * @param entityManagerFactory
   */
  constructor(entityManagerFactory: EntityManagerFactory) {
    super();
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Prepare the Metamodel for custom schema creation
   * @param jsonMetamodel initialize the metamodel with the serialized json schema
   * @return
   */
  init(jsonMetamodel?: JsonMap) {
    if (this.isInitialized) {
      throw new Error('Metamodel is already initialized.');
    }

    this.fromJSON(jsonMetamodel || []);
    this.isInitialized = true;
  }

  /**
   * @param arg
   * @return
   */
  getRef(arg: Class<Managed> | Function | string): string | null {
    let ref;
    if (typeof arg === 'string') {
      ref = arg;

      if (ref.indexOf('/db/') !== 0) {
        ref = `/db/${arg}`;
      }
    } else {
      ref = Enhancer.getIdentifier(arg);
    }

    return ref;
  }

  /**
   * Return the metamodel entity type representing the entity.
   *
   * @param typeConstructor - the type of the represented entity
   * @return the metamodel entity type or null if the class is not a managed entity
   */
  entity(typeConstructor: Class<any> | Function | string): EntityType<any> | null {
    const ref = this.getRef(typeConstructor);
    return ref ? this.entities[ref] : null;
  }

  /**
   * Return the metamodel basic type representing the native class.
   * @param typeConstructor - the type of the represented native class
   * @return the metamodel basic type
   */
  baseType(typeConstructor: Class<any> | string): BasicType<any> | null {
    let ref: string | null = null;
    if (typeof typeConstructor === 'string') {
      ref = this.getRef(typeConstructor);
    } else {
      const baseTypesNames = Object.keys(this.baseTypes);
      for (let i = 0, len = baseTypesNames.length; i < len; i += 1) {
        const name = baseTypesNames[i];
        const type = this.baseTypes[name];
        if (!type.noResolving && type.typeConstructor === typeConstructor) {
          ref = name;
          break;
        }
      }
    }

    return ref ? this.baseTypes[ref] : null;
  }

  /**
   * Return the metamodel embeddable type representing the embeddable class.
   * @param typeConstructor - the type of the represented embeddable class
   * @return the metamodel embeddable type or null if the class is not a managed embeddable
   */
  embeddable(typeConstructor: Class<any> | Function | string): EmbeddableType<any> | null {
    const ref = this.getRef(typeConstructor);
    return ref ? this.embeddables[ref] : null;
  }

  /**
   * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
   *
   * @param typeConstructor - the type of the represented managed class
   * @return the metamodel managed type
   */
  managedType(typeConstructor: Class<any> | Function | string): ManagedType<any> | null {
    return this.entity(typeConstructor) || this.embeddable(typeConstructor);
  }

  /**
   * @param type
   * @return the added type
   */
  addType(type: Type<any>): Type<any> {
    let types: {[name: string]: Type<any>} = {};

    if (type.isBasic) {
      types = this.baseTypes;
    } else if (type.isEmbeddable) {
      (type as EmbeddableType<any>).init(this.enhancer);
      types = this.embeddables;
    } else if (type.isEntity) {
      const entityType = type as EntityType<any>;
      entityType.init(this.enhancer);
      types = this.entities;

      if (entityType.superType === null && entityType.ref !== EntityType.Object.ref) {
        entityType.superType = this.entity(EntityType.Object.ref);
      }
    }

    if (types[type.ref]) {
      throw new Error(`The type ${type.ref} is already declared.`);
    }

    types[type.ref] = type;
    return type;
  }

  /**
   * Load all schema data from the server
   * @return
   */
  load(): Promise<Metamodel> {
    if (!this.isInitialized) {
      return this.withLock(() => {
        const msg = new message.GetAllSchemas();

        return this.entityManagerFactory.send(msg).then((response) => {
          this.init(response.entity);
          return this;
        });
      });
    }

    throw new Error('Metamodel is already initialized.');
  }

  /**
   * Store all local schema data on the server, or the provided one
   *
   * Note: The schema must be initialized, by init or load
   *
   * @param managedType The specific type to persist, if omitted the complete schema
   * will be updated
   * @return
   */
  save(managedType?: ManagedType<any>): Promise<Metamodel> {
    return this.sendUpdate(managedType || this.toJSON()).then(() => this);
  }

  /**
   * Update the metamodel with the schema
   *
   * The provided data object will be forwarded to the UpdateAllSchemas resource.
   * The underlying schema of this Metamodel object will be replaced by the result.
   *
   * @param data The JSON which will be send to the UpdateAllSchemas resource.
   * @return
   */
  update(data: JsonMap | JsonArray): Promise<Metamodel> {
    return this.sendUpdate(data).then((response) => {
      this.fromJSON(response.entity);
      return this;
    });
  }

  private sendUpdate(data: ManagedType<any> | JsonMap | JsonArray) {
    return this.withLock(() => {
      let msg;
      if (data instanceof ManagedType) {
        msg = new message.UpdateSchema(data.name, data.toJSON());
      } else {
        msg = new message.UpdateAllSchemas(data);
      }

      return this.entityManagerFactory.send(msg);
    });
  }

  /**
   * Get the current schema types as json
   * @return the json data
   */
  toJSON(): JsonArray {
    if (!this.isInitialized) {
      throw new Error('Metamodel is not initialized.');
    }

    return ([] as JsonArray).concat(
      Object.keys(this.entities).map((ref) => this.entities[ref].toJSON()),
      Object.keys(this.embeddables).map((ref) => this.embeddables[ref].toJSON()),
    );
  }

  /**
   * Replace the current schema by the provided one in json
   * @param json The json schema data
   * @return
   */
  fromJSON(json: Json): void {
    const builder = new ModelBuilder();
    const models = builder.buildModels(json as JsonMap[]);

    this.baseTypes = {};
    this.embeddables = {};
    this.entities = {};

    Object.keys(models).forEach((ref) => this.addType(models[ref]));
  }

  /**
   * Creates an index
   *
   * @param bucket Name of the Bucket
   * @param index Will be applied for the given bucket
   * @return
   */
  createIndex(bucket: string, index: DbIndex): Promise<any> {
    const msg = new message.CreateDropIndex(bucket, { ...index.toJSON(), drop: false });
    return this.entityManagerFactory.send(msg);
  }

  /**
   * Drops an index
   *
   * @param bucket Name of the Bucket
   * @param index Will be dropped for the given bucket
   * @return
   */
  dropIndex(bucket: string, index: DbIndex): Promise<any> {
    const msg = new message.CreateDropIndex(bucket, { ...index.toJSON(), drop: true });
    return this.entityManagerFactory.send(msg);
  }

  /**
   * Drops all indexes
   *
   * @param bucket Indexes will be dropped for the given bucket
   * @return
   */
  dropAllIndexes(bucket: string): Promise<any> {
    const msg = new message.DropAllIndexes(bucket);
    return this.entityManagerFactory.send(msg);
  }

  /**
   * Loads all indexes for the given bucket
   *
   * @param bucket Current indexes will be loaded for the given bucket
   * @return
   */
  getIndexes(bucket: string): Promise<DbIndex[]> {
    const msg = new message.ListIndexes(bucket);
    return this.entityManagerFactory.send(msg)
      .then((response) => response.entity.map((el: JsonMap) => new DbIndex(
        el.keys as {[prop: string]: string}, el.unique as boolean,
      )))
      .catch((e) => {
        if (e.status === StatusCode.BUCKET_NOT_FOUND || e.status === StatusCode.OBJECT_NOT_FOUND) {
          return null;
        }

        throw e;
      });
  }
}
