'use strict';

const valLib = require('validator');
const deprecated = require('./deprecated');

/**
 * @alias util.Validator
 */
class Validator {
  /**
   * Compiles the given validation code for the managedType
   * @param {metamodel.ManagedType} managedType The managedType of the code
   * @param {string} validationCode The validation code
   */
  static compile(managedType, validationCode) {
    const keys = [];
    const iter = managedType.attributes();
    for (let el = iter.next(); !el.done; el = iter.next()) {
      const attr = el.value;
      keys.push(attr.name);
    }

    const fn = new Function(keys, validationCode); // eslint-disable-line no-new-func
    return function onValidate(argObj) {
      const args = keys.map(name => argObj[name]);

      return fn.apply({}, args);
    };
  }

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
   * @memberOf util.Validator.prototype
   * @function
   * @param {Function} fn will be used to validate the value
   * @returns {util.Validator}
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
   * @returns {util.Validator}
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
    /**
     * Name of the attribute
     * @type string
     */
    this.key = key;

    /**
     * Entity to get the value of the attribute
     * @type {binding.Entity}
     * @private
     */
    this.entity = entity;

    /**
     * Entity to get the value of the attribute
     * @type {binding.Entity}
     * @private
     */
    this.errors = [];
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
    Validator.prototype[name] = error => (
      this.callMethod(name, error || name, Array.prototype.slice.call(arguments, error ? 1 : 0))
    );
  }
});

deprecated(Validator.prototype, '_callMethod', 'callMethod');
deprecated(Validator.prototype, '_entity', 'entity');

module.exports = Validator;
