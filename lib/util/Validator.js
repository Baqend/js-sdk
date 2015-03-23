var valLib = require('validator');

/**
 * @class baqend.util.Validator
 */
var Validator = Object.inherit(/** @lends baqend.util.Validator.prototype */ {

  extend: {
    initialize: function() {
      Object.keys(valLib).forEach(function(name) {
        if (typeof valLib[name] == 'function' && name !== 'toString' &&
            name !== 'toDate' && name !== 'extend' && name !== 'init') {

          this.prototype[name] = function(error) {
            //noinspection JSPotentiallyInvalidUsageOfThis
            return this._callMethod(name, error || name, Array.prototype.slice.call(arguments, error? 1: 0));
          }

        }
      }.bind(this));
    }
  },

  /**
   * Name of the attribute
   * @type String
   */
  key: null,

  /**
   * Result of the validation
   * @type Array
   */
  errors: null,

  /**
   * Entity to get the value of the attribute
   * @type {baqend.binding.Entity}
   * @private
   */
  _entity: null,

  /**
   * Gets the value of the attribute
   * @return {*} Value
   */
  get value() {
    return this._entity[this.key];
  },

  /**
   * Checks if the attribute is valid
   * @return {Boolean}
   */
  get isValid() {
    return this.errors.length == 0;
  },

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param {String=} error The error message which will be used if the value is invalid
   * @param {Function} fn will be used to validate the value
   * @returns {baqend.util.Validator}
   */
  is: function(error, fn) {
    if(Function.isInstance(error)) {
      fn = error;
      error = 'is';
    }
    if(fn(this.value, valLib) === false) {
      this.errors.push(error);
    }
    return this;
  },

  constructor: function Validator(key, entity) {
    this.key = key;
    this._entity = entity;
    this.errors = [];
  },

  _callMethod: function(method, error, args) {
    args = args || [];
    args.unshift(this.value);
    if(valLib[method].apply(this, args) === false) {
      this.errors.push(error);
    }
    return this;
  },

  toString: function() {
    return this.value;
  },

  toJSON: function() {
    return {
      isValid: this.isValid,
      errors: this.errors
    }
  }
});

module.exports = Validator;