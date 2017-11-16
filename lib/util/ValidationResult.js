'use strict';

/**
 * @alias util.ValidationResult
 */
class ValidationResult {
  /**
   * Indicates if all fields are valid
   * @return {boolean} <code>true</code> if all fields are valid
   */
  get isValid() {
    return Object.keys(this.fields).every(key => this.fields[key].isValid);
  }

  constructor() {
    this.fields = {};
  }

  toJSON() {
    const json = {};
    this.fields.forEach((key) => {
      json[key] = this.fields[key].toJSON();
    });
    return json;
  }
}

module.exports = ValidationResult;
