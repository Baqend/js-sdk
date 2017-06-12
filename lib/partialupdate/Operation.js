exports.Operation = class Operation {

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
