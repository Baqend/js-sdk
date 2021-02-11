import { Class } from '../util/Class';

/**
 * This factory creates instances of type T, by invoking the {@link #new()} method
 * or by instantiating this factory directly
 */
export interface InstanceFactory<T> {
  /**
   * Creates a new instance of the factory type
   * @param args Constructor arguments used for instantiation
   * @return A new created instance of *
   * @instance
   */
  new(...args: any[]): T
}

// @ts-ignore
export class Factory<T> implements InstanceFactory<T> {
  private static extend<T, P extends Factory<any>>(target: T, proto: P): T & P {
    if (proto !== Factory.prototype) {
      this.extend(target, Object.getPrototypeOf(proto));
    }

    const properties = Object.getOwnPropertyNames(proto);
    for (let j = 0, len = properties.length; j < len; j += 1) {
      const prop = properties[j];
      Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(proto, prop)!);
    }

    return target as T & P;
  }

  /**
   * Creates a new Factory for the given type
   * @param type - the type constructor of T
   * @return A new object factory to created instances of T
   */
  protected static createFactory<F extends Factory<T>, T>(this: Class<F>, type: Class<T>): F {
    // We want te explicitly name the created factory and give the constructor a properly argument name
    const factory = Factory.extend((function FactoryConstructor(...args: any[]) {
      return factory.newInstance(args);
    }) as any as F, this.prototype);

    // lets instanceof work properly
    factory.prototype = type.prototype;
    factory.type = type;

    return factory;
  }

  public type: Class<T> = null as any;

  public prototype: T = null as any;

  /**
   * Creates a new instance of the factory type
   * @param args Constructor arguments used for instantiation
   * @return A new created instance of *
   * @instance
   */
  new(...args: any[]): T {
    return this.newInstance!(args);
  }

  /**
   * Creates a new instance of the factory type
   * @param args Constructor arguments used for instantiation
   * @return A new created instance of *
   * @instance
   */
  newInstance(args?: any[] | IArguments): T {
    if (!args || args.length === 0) {
      // eslint-disable-next-line new-cap
      return new this.type!();
    }

    // es6 constructors can't be called, therefore bind all arguments and invoke the constructor
    // then with the bounded parameters
    // The first argument is shift out by invocation with `new`.
    const a: [any] = [null];
    Array.prototype.push.apply(a, args as any[]);
    const boundConstructor = (Function.prototype.bind.apply(this.type!, a));
    // eslint-disable-next-line new-cap
    return new boundConstructor();
  }
}
