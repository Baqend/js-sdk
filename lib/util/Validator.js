"use strict";

var valLib = require('validator');
var ValidationResult = require('./ValidationResult');

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
    var keys = [];
    for (let attr of managedType.attributes()) {
      keys.push(attr.name);
    }

    var fn = new Function(keys, validationCode);
    return function onValidate(argObj) {
      var args = keys.map(function(name) {
        return argObj[name];
      });

      return fn.apply({}, args);
    }
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
    return this.errors.length == 0;
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
    if(error instanceof Function) {
      fn = error;
      error = 'is';
    }
    if(fn(this.value, valLib) === false) {
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

  _callMethod(method, error, args) {
    args = args || [];
    args.unshift(this.value);
    if(valLib[method].apply(this, args) === false) {
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
      errors: this.errors
    }
  }
}

Object.keys(valLib).forEach(function(name) {
  if (typeof valLib[name] == 'function' && name !== 'toString' &&
      name !== 'toDate' && name !== 'extend' && name !== 'init') {

    /**
     * @ignore
     */
    Validator.prototype[name] = function(error) {
      //noinspection JSPotentiallyInvalidUsageOfThis
      return this._callMethod(name, error || name, Array.prototype.slice.call(arguments, error? 1: 0));
    }
  }
});

module.exports = Validator;