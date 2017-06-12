"use strict";

const ALLOWED_OPERATIONS = [
  '$add',
  '$bit',
  '$currentDate',
  '$dec',
  '$inc',
  '$max',
  '$min',
  '$mul',
  '$pop',
  '$push',
  '$put',
  '$remove',
  '$rename',
  '$replace',
  '$set',
  '$shift',
  '$unshift',
];

/**
 * @alias partialupdate.PartialUpdateBuilder<T>
 */
class PartialUpdateBuilder {
  constructor() {
    /** @type {json} */
    this._operations = {};
  }

  /**
   * Sets a field to a given value
   *
   * @param {string} field The field to set
   * @param {*} value The value to set to
   * @return {this}
   */
  set(field, value) {
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
   * Sets the lowest and highest possible value of a field
   *
   * @param {string} field The field to compare with
   * @param {number} atLeast The lowest possible value
   * @param {number} atMost The highest possible value
   * @return {this}
   */
  between(field, atLeast, atMost) {
    if (typeof atLeast !== 'number' || typeof atMost !== 'number') {
      throw new Error('Values must be a number');
    }

    return this._addOperation(field, '$max', atLeast)._addOperation(field, '$min', atMost);
  }

  /**
   * Removes an item from an array
   *
   * @param {string} field The field to perform the operation on
   * @param {*} item The item to add
   * @return {this}
   */
  remove(field, item) {
    return this._addOperation(field, '$remove', item);
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
    return this._addOperation(field, '$pop', null);
  }

  /**
   * Shifts the first item out of a list
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */
  shift(field) {
    return this._addOperation(field, '$shift', null);
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
    return this._addOperation(field, '$replace', { $at: index, $to: item });
  }

  /**
   * Sets a datetime field to the current moment
   *
   * @param {string} field The field to perform the operation on
   * @return {this}
   */
  toNow(field) {
    return this._addOperation(field, '$currentDate', 'timestamp');
  }

  /**
   * Performs a bitwise AND on a field
   *
   * @param {string} field The field to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */
  and(field, bitmask) {
    return this._addOperation(field, '$bit', { and: bitmask });
  }

  /**
   * Performs a bitwise OR on a field
   *
   * @param {string} field The field to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */
  or(field, bitmask) {
    return this._addOperation(field, '$bit', { or: bitmask });
  }

  /**
   * Performs a bitwise XOR on a field
   *
   * @param {string} field The field to perform the operation on
   * @param {number} bitmask The bitmask taking part in the operation
   * @return {this}
   */
  xor(field, bitmask) {
    return this._addOperation(field, '$bit', { xor: bitmask });
  }

  /**
   * Renames a field
   *
   * @param {string} oldField The old field name
   * @param {string} newField The new field name
   * @return {this}
   */
  rename(oldField, newField) {
    return this._addOperation(oldField, '$rename', newField);
  }

  /**
   * Returns a JSON representation of this partial update
   *
   * @return {json}
   */
  toJSON() {
    return this._operations;
  }

  /**
   * Adds an operation on the partial update
   *
   * @param {string} field The field to modify
   * @param {string} operation The operation to add
   * @param {*} value Operation value
   * @return {this}
   * @private
   */
  _addOperation(field, operation, value) {
    if (typeof field !== 'string') {
      throw new Error('Field must be a string');
    }

    if (ALLOWED_OPERATIONS.indexOf(operation) === -1) {
      throw new Error('Operation invalid: ' + operation);
    }

    if (!this._operations[operation]) {
      this._operations[operation] = {};
    }

    if (this._operations[operation][field]) {
      throw new Error(`Field ${field} already has a ${operation} operation set`);
    }

    this._operations[operation][field] = value;

    return this;
  }
}

module.exports = PartialUpdateBuilder;
