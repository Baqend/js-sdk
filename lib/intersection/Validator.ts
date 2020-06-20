'use strict';

import { Entity } from "../binding";
import { ManagedType } from "../metamodel";

let valLib;
try {
  // we load this module as an optional external dependency
  valLib = require("validator");
} catch(e) {
  valLib = {};
}

export class Validator {
  /**
   * Compiles the given validation code for the managedType
   * @param managedType The managedType of the code
   * @param validationCode The validation code
   * @return the parsed validation function
   */
  static compile(managedType: ManagedType<any>, validationCode: string): Function {
    const keys: string[] = [];
    const iter = managedType.attributes();
    for (let el = iter.next(); !el.done; el = iter.next()) {
      const attr = el.value;
      keys.push(attr.name);
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, validationCode);
    return function onValidate(argObj: {[arg: string]: any}) {
      const args = keys.map(name => argObj[name]);

      return fn.apply({}, args);
    };
  }

  /**
   * The cached errors of the validation
   */
  private errors: string[] = [];

  /**
   * Entity to get the value of the attribute
   */
  private entity: Entity;

  /**
   * Name of the attribute
   */
  key: string;

  /**
   * Gets the value of the attribute
   * @return Value
   */
  get value(): any {
    return this.entity[this.key];
  }

  /**
   * Checks if the attribute is valid
   * @return
   */
  get isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param fn will be used to validate the value
   * @return
   */
  is(fn: Function): Validator;

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param error The error message which will be used if the value is invalid
   * @param fn will be used to validate the value
   * @return
   */
  is(error: string, fn: Function): Validator;

  is(error: string | Function, fn?: Function): Validator {
    if (error instanceof Function) {
      return this.is('is', error);
    }

    if (fn!(this.value, valLib) === false) {
      this.errors.push(error);
    }

    return this;
  }

  constructor(key, entity) {
    this.key = key;
    this.entity = entity;
  }

  callMethod(method, error, argumentList) {
    const args = argumentList || [];
    args.unshift(this.value);
    if (valLib[method].apply(this, args) === false) {
      this.errors.push(error);
    }
    return this;
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return {
      isValid: this.isValid,
      errors: this.errors,
    };
  }
}

Object.keys(valLib).forEach((name) => {
  if (typeof valLib[name] === 'function' && name !== 'toString' &&
    name !== 'toDate' && name !== 'extend' && name !== 'init') {
    /**
     * @ignore
     */
    Validator.prototype[name] = function validate(error) { // use function here to keep the correct this context
      return this.callMethod(name, error || name, Array.prototype.slice.call(arguments, error ? 1 : 0));
    };
  }
});
