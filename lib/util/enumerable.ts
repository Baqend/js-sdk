/**
 * This decorator modifies the enumerable flag of an class member
 * @param value - the enumerable value of the property descriptor
 */
export function enumerable(value: boolean) {
  return function decorate(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // eslint-disable-next-line no-param-reassign
    descriptor.enumerable = value;
  };
}
