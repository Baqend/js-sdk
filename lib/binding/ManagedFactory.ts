'use strict';

import { Factory } from "./Factory";
import { Class, deprecated } from "../util";
import { EntityManager } from "../EntityManager";
import { ManagedType } from "../metamodel";
import { Managed } from "./Managed";
import { Json } from "../util";

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
  public methods: {[methodName: string]: any} = null as any;

  /**
   * The managed type of this factory
   */
  public managedType: ManagedType<T> = null as any;

  /**
   * The owning EntityManager where this factory belongs to
   */
  public db: EntityManager = null as any;

  /**
   * Creates a new instance of the factory type
   *
   * @param args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return A new created instance of T
   */
  newInstance(args?: any[] | IArguments) {
    const instance = super.newInstance(args);
    instance._metadata.db = this.db;
    return instance;
  }

  /**
   * Creates a new instance and sets the Managed Object to the given json
   * @param json
   * @return A new created instance of T
   */
  fromJSON(json: Json) {
    const instance = this.newInstance();
    const metadata = instance._metadata;
    return this.managedType.fromJsonValue(metadata, json, instance, {});
  }

  /**
   * Adds methods to instances of this factories type
   * @param methods The methods to add
   * @return
   */
  addMethods(methods: {[name: string]: Function}): void {
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
