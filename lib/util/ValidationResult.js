"use strict";

/**
 * @alias util.ValidationResult
 */
class ValidationResult {

  get isValid() {
    for (var key in this.fields) {
      if(!this.fields[key].isValid) {
        return false;
      }
    }
    return true;
  }

  constructor() {
    this.fields = {};
  }

  toJSON() {
    var json = {};
    for(var key in this.fields) {
      json[key] = this.fields[key].toJSON();
    }
    return json;
  }
}

module.exports = ValidationResult;