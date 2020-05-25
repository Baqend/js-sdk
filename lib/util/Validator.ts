'use strict';

import valLib from 'validator';
import { deprecated } from './deprecated';
import { Entity } from "../binding";

export class Validator {
  /**
   * Compiles the given validation code for the managedType
   * @param {ManagedType} managedType The managedType of the code
   * @param {string} validationCode The validation code
   * @return {void}
   */
  static compile(managedType, validationCode) {
    const keys: string[] = [];
    const iter = managedType.attributes();
    for (let el = iter.next(); !el.done; el = iter.next()) {
      const attr = el.value;
      keys.push(attr.name);
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, validationCode);
    return function onValidate(argObj) {
      const args = keys.map(name => argObj[name]);

      return fn.apply({}, args);
    };
  }

  /**
   * Entity to get the value of the attribute
   */
  private errors: Entity[] = [];

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
   * @return {*} Value
   */
  get value() {
    return this.entity[this.key];
  }

  /**
   * Checks if the attribute is valid
   * @return {boolean}
   */
  get isValid() {
    return this.errors.length === 0;
  }

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @name is
   * @memberOf Validator.prototype
   * @function
   * @param {Function} fn will be used to validate the value
   * @return {Validator}
   */

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param {string} error The error message which will be used if the value is invalid
   * @param {Function} fn will be used to validate the value
   * @return {Validator}
   */
  is(error, fn) {
    if (error instanceof Function) {
      return this.is('is', error);
    }

    if (fn(this.value, valLib) === false) {
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

deprecated(Validator.prototype, '_callMethod', 'callMethod');
deprecated(Validator.prototype, '_entity', 'entity');
