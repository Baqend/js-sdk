import { Factory } from './Factory';
import type { EntityManager } from '../EntityManager';
import type { ManagedType } from '../metamodel';
import type { Managed } from './Managed';
import type { Json } from '../util';
import { Metadata } from '../intersection';

export class ManagedFactory<T extends Managed> extends Factory<T> {
  /**
   * Creates a new ManagedFactory for the given type
   * @param managedType The metadata of type T
   * @param db The entity manager instance
   */
  public static create<T extends Managed>(managedType: ManagedType<T>, db: EntityManager): ManagedFactory<T> {
    const factory: ManagedFactory<T> = this.createFactory<ManagedFactory<T>, T>(managedType.typeConstructor);

    factory.methods = factory.prototype;
    factory.managedType = managedType;
    factory.db = db;

    return factory;
  }

  /**
   * Methods that are added to object instances
   * This property is an alias for this factory type prototype
   * @name methods
   */
  public methods: { [methodName: string]: any } = null as any;

  /**
   * The managed type of this factory
   */
  public managedType: ManagedType<T> = null as any;

  /**
   * The owning EntityManager where this factory belongs to
   */
  public db: EntityManager = null as any;

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param json
   * @return A new created instance of T
   */
  fromJSON(json: Json): T {
    const instance = this.newInstance();
    return this.managedType.fromJsonValue(Metadata.create(this.managedType, this.db), json, instance, {
      persisting: false,
    })!;
  }

  /**
   * Adds methods to instances of this factories type
   * @param methods The methods to add
   * @return
   */
  addMethods(methods: { [name: string]: Function }): void {
    Object.assign(this.methods, methods);
  }

  /**
   * Add a method to instances of this factories type
   * @param name The method name to add
   * @param fn The Method to add
   * @return
   */
  addMethod(name: string, fn: Function): void {
    this.methods[name] = fn;
  }
}
