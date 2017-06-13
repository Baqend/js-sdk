"use strict";

const ALLOWED_OPERATIONS = [
  '$add',
  '$and',
  '$currentDate',
  '$dec',
  '$inc',
  '$max',
  '$min',
  '$mul',
  '$or',
  '$pop',
  '$push',
  '$put',
  '$remove',
  '$rename',
  '$replace',
  '$set',
  '$shift',
  '$unshift',
  '$xor',
];

const { Operation } = require('./Operation');

/**
 * @alias partialupdate.PartialUpdateBuilder<T>
 */
class PartialUpdateBuilder {
  /**
   * @param {json} operations
   */
  constructor(operations) {
    /** @type {Operation[]} */
    this._operations = [];
    if (operations) {
      this._addOperations(operations);
    }
  }

  /**
   * Sets a field to a given value
   *
   * @param {string} field The field to set
   * @param {string|number|Set|Map|Array} value The value to set to
   * @return {this}
   */
  set(field, value) {
    if (value instanceof Set) {
      value = Array.from(value);
    } else if (value instanceof Map) {
      const newValue = {};
      for (const [k, v] of value) {
        newValue[k] = v;
      }
      value = newValue;
    }

    return this._addOperation(field, '$set', value);
  }

  /**
   * Increments a field by a given value
   *
   * @param {string} field The field to increment
   * @param {number=} by The number to increment by, defaults to 1
   * @return {this}
   */
  increment(field, by) {
    return this._addOperation(field, '$inc', typeof by === 'number' ? by : 1);
  }

  /**
   * Decrements a field by a given value
   *
   * @param {string} field The field to decrement
   * @param {number=} by The number to decrement by, defaults to 1
   * @return {this}
   */
  decrement(field, by) {
    return this.increment(field, typeof by === 'number' ? -by : -1);
  }

  /**
   * Multiplies a field by a given number
   *
   * @param {string} field The field to multiply
   * @param {number} multiplicator The number to multiply by
   * @return {this}
   */
  multiply(field, multiplicator) {
    if (typeof multiplicator !== 'number') {
      throw new Error('Multiplicator must be a number.');
    }

    return this._addOperation(field, '$mul', multiplicator);
  }

  /**
   * Divides a field by a given number
   *
   * @param {string} field The field to divide
   * @param {number} divisor The number to divide by
   * @return {this}
   */
  divide(field, divisor) {
    if (typeof divisor !== 'number') {
      throw new Error('Divisor must be a number.');
    }

    return this._addOperation(field, '$mul', 1 / divisor);
  }

  /**
   * Sets the highest possible value of a field
   *
   * @param {string} field The field to compare with
   * @param {number} value The highest possible value
   * @return {this}
   */
  min(field, value) {
    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }

    return this._addOperation(field, '$min', value);
  }

  /**
   * Sets the highest possible value of a field
   *
   * @param {string} field The field to compare with
   * @param {number} value The highest possible value
   * @return {this}
   */
  atMost(field, value) {
    return this.min(field, value);
  }

  /**
   * Sets the smallest possible value of a field
   *
   * @param {string} field The field to compare with
   * @param {number} value The smalles possible value
   * @return {this}
   */
  max(field, value) {
    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }

    return this._addOperation(field, '$max', value);
  }

  /**
   * Sets the smallest possible value of a field
   *
   * @param {string} field The field to compare with
   * @param {number} value The smalles possible value
   * @return {this}
   */
  atLeast(field, value) {
    return this.max(field, value);
  }

  /**
   * Removes an item from an array or map
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */
  remove(field, item) {
    return this._addOperation(field, '$remove', item);
  }

  /**
   * Puts an item from an array or map
   *
   * @param {string} field The field to perform the operation on
   * @param {string|object} key The map key to put the value to or an object of arguments
   * @param {*} [value] The value to put if a key was used
   * @return {this}
   */
  put(field, key, value) {
    const obj = {};
    if (typeof key === 'string' || typeof key === 'number') {
      obj[key] = value;
    } else if (typeof key === 'object') {
      Object.assign(obj, key);
    }

    return this._addOperation(field, '$put', obj);
  }

  /**
   * Pushes an item into a list
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */
  push(field, item) {
    return this._addOperation(field, '$push', item);
  }

  /**
   * Unshifts an item into a list
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */
  unshift(field, item) {
    return this._addOperation(field, '$unshift', item);
  }

  /**
   * Pops the last item out of a list
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */
  pop(field) {
    return this._addOperation(field, '$pop');
  }

  /**
   * Shifts the first item out of a list
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */
  shift(field) {
    return this._addOperation(field, '$shift');
  }

  /**
   * Adds an item to a set
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */
  add(field, item) {
    return this._addOperation(field, '$add', item);
  }

  /**
   * Replaces an item at a given index
   *
   * @param {string} field The field to perform the operation on
   * @param {number} index The index where the item will be replaced
   * @param {*} item The item to replace with
   * @return {this}
   */
  replace(field, index, item) {
    return this._addOperation(field, '$replace', { at: index, to: item });
  }

  /**
   * Sets a datetime field to the current moment
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */
  toNow(field) {
    return this._addOperation(field, '$currentDate');
  }

  /**
   * Performs a bitwise AND on a path
   *
   * @param {string} path The path to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */
  and(path, bitmask) {
    if (this._hasBitwiseOperation(path)) {
      throw new Error(`Path ${path} already has a bitwise operation set`);
    }
    return this._addOperation(path, '$and', bitmask);
  }

  /**
   * Performs a bitwise OR on a path
   *
   * @param {string} path The path to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */
  or(path, bitmask) {
    if (this._hasBitwiseOperation(path)) {
      throw new Error(`Path ${path} already has a bitwise operation set`);
    }
    return this._addOperation(path, '$or', bitmask);
  }

  /**
   * Performs a bitwise XOR on a path
   *
   * @param {string} path The path to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */
  xor(path, bitmask) {
    if (this._hasBitwiseOperation(path)) {
      throw new Error(`Path ${path} already has a bitwise operation set`);
    }
    return this._addOperation(path, '$xor', bitmask);
  }

  /**
   * Renames a field
   *
   * @param {string} oldPath The old field name
   * @param {string} newPath The new field name
   * @return {this}
   */
  rename(oldPath, newPath) {
    return this._addOperation(oldPath, '$rename', newPath);
  }

  /**
   * Returns a JSON representation of this partial update
   *
   * @return {json}
   */
  toJSON() {
    return this._operations.reduce((json, operation) => {
      const obj = {};
      obj[operation.path] = operation.value;

      json[operation.name] = Object.assign({}, json[operation.name], obj);

      return json;
    }, {});
  }

  /**
   * Executes the partial update
   *
   * @abstract
   */
  execute() {
    throw new Error('Cannot call "execute" on abstract PartialUpdateBuilder');
  }

  /**
   * Adds an operation on the partial update
   *
   * @param {string} path The path to modify
   * @param {string} operation The key of the operation to add
   * @param {*} [value] Operation value
   * @return {this}
   * @private
   */
  _addOperation(path, operation, value) {
    if (typeof path !== 'string') {
      throw new Error('Path must be a string');
    }

    if (ALLOWED_OPERATIONS.indexOf(operation) === -1) {
      throw new Error('Operation invalid: ' + operation);
    }

    if (this._hasOperation(operation, path)) {
      throw new Error(`Path ${path} already has a ${operation} operation set`);
    }

    // Add the new operation
    this._operations.push(new Operation(operation, path, value || null));

    return this;
  }

  /**
   * Adds initial operations
   *
   * @param {json} json
   * @private
   */
  _addOperations(json) {
    for (const [key, pathValueDictionary] of Object.entries(json)) {
      for (const [path, value] of Object.entries(pathValueDictionary)) {
        this._operations.push(new Operation(key, path, value));
      }
    }
  }

  /**
   * Checks whether an operation on the field exists already
   *
   * @param {string} key The operation's key
   * @param {string} path The path where the operation is executed on
   * @return {boolean} true, if the operation does exist
   * @private
   */
  _hasOperation(key, path) {
    for (const operation of this._operations) {
      if (operation.name == key && operation.path == path) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks whether a bitwise operation on the field exists already
   *
   * @param {string} path The path where the operation is executed on
   * @return {boolean} true, if the operation does exist
   * @private
   */
  _hasBitwiseOperation(path) {
    const bitwise = ['$and', '$or', '$xor'];
    for (const operation of this._operations) {
      if (bitwise.indexOf(operation.name) >= 0 && operation.path == path) {
        return true;
      }
    }

    return false;
  }
}

module.exports = PartialUpdateBuilder;
