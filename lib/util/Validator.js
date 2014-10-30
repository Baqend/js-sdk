var Validator;
var ValidationResult;
var valLib = require('validator');

/**
 * @class baqend.util.Validator
 */
exports.Validator = Validator = Object.inherit(/** @lends baqend.util.Validator.prototype */ {

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

  is: function(error, fn) {
    if(Function.isInstance(error)) {
      fn = error;
      error = 'is';
    }
    if(fn(this.value) === false) {
      this.errors.push(error);
    }
    return this;
  },

  initialize: function(key, entity) {
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

/**
 * @class baqend.util.ValidationResult
 */
exports.ValidationResult = ValidationResult = Object.inherit(/** @lends baqend.util.ValidationResult.prototype */ {

  fields: null,

  get isValid() {
    for (var key in this.fields) {
      if(!this.fields[key].isValid) {
        return false;
      }
    }
    return true;
  },

  initialize: function() {
    this.fields = {};
  },

  toJSON: function() {
    var json = {};
    for(var key in this.fields) {
      json[key] = this.fields[key].toJSON();
    }
    return json;
  }
});