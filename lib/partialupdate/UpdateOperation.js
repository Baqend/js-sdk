'use strict';

/**
 * @alias partialupdate.UpdateOperation
 */
class UpdateOperation {
  /**
   * @param {string} operationName
   * @param {string} path
   * @param {*} [value]
   */
  constructor(operationName, path, value) {
    this.name = operationName;
    this.path = path;
    this.value = value;
  }
}

module.exports = UpdateOperation;
