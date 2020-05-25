'use strict';

export class ValidationResult {
  fields = {}

  /**
   * Indicates if all fields are valid
   * @return {boolean} <code>true</code> if all fields are valid
   */
  get isValid() {
    return Object.keys(this.fields).every(key => this.fields[key].isValid);
  }

  toJSON() {
    const json = {};
    Object.keys(this.fields).forEach((key) => {
      json[key] = this.fields[key].toJSON();
    });
    return json;
  }
}
