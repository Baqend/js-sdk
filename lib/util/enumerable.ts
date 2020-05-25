/**
 * This decorator modifies the enumerable flag of an class member
 * @param value - the enumerable value of the property descriptor
 */
export function enumerable(value: boolean) {
    return function(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        descriptor.enumerable = value;
    };
}