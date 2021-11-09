/* eslint-disable no-console */
const alreadyWarned: { [signature: string]: boolean } = {};
export function deprecated(alternativeSignature: string) {
  return function decorateProperty(
    target: Object | string,
    name: string,
    descriptor: PropertyDescriptor = {
      writable: true,
      enumerable: false,
      configurable: true,
    },
  ): PropertyDescriptor {
    const type = typeof target === 'string' ? target : target.constructor.name;
    const deprecatedSignature = `${type}.${name}`;
    const logWarning = () => {
      if (!alreadyWarned[deprecatedSignature]) {
        alreadyWarned[deprecatedSignature] = true;
        console.warn(`Usage of ${deprecatedSignature} is deprecated, use ${alternativeSignature} instead.`);
      }
    };

    const deprecatedDescriptor: PropertyDescriptor = {
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
    };

    if (descriptor.get || descriptor.set) {
      if (descriptor.get) {
        deprecatedDescriptor.get = function get() {
          logWarning();
          return descriptor.get!.call(this);
        };
      }

      if (descriptor.set) {
        deprecatedDescriptor.set = function set(value) {
          logWarning();
          return descriptor.set!.call(this, value);
        };
      }
    } else {
      let propertyValue = descriptor.value;

      deprecatedDescriptor.get = function get() {
        logWarning();
        return propertyValue;
      };

      if (descriptor.writable) {
        deprecatedDescriptor.set = function set(value) {
          logWarning();
          propertyValue = value;
        };
      }
    }

    return deprecatedDescriptor;
  };
}
