import { UpdateOperation } from './UpdateOperation';
import { Json, JsonMap } from '../util';
import { Entity } from '../binding';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface PartialUpdateBuilder<T extends Entity> {
  /**
   * Increments a field by a given value
   *
   * @param field The field to increment
   * @param by The number to increment by, defaults to 1
   * @return
   */
  increment(field: string, by?: number): this;

  /**
   * Decrements a field by a given value
   *
   * @param field The field to decrement
   * @param by The number to decrement by, defaults to 1
   * @return
   */
  decrement(field: string, by?: number): this;

  /**
   * Multiplies a field by a given number
   *
   * @param field The field to multiply
   * @param multiplicator The number to multiply by
   * @return
   */
  multiply(field: string, multiplicator: number): this;

  /**
   * Divides a field by a given number
   *
   * @param field The field to divide
   * @param divisor The number to divide by
   * @return
   */
  divide(field: string, divisor: number): this;

  /**
   * Sets the highest possible value of a field
   *
   * @param field The field to compare with
   * @param value The highest possible value
   * @return
   */
  atMost(field: string, value: number): this;

  /**
   * Sets the smallest possible value of a field
   *
   * @param field The field to compare with
   * @param value The smalles possible value
   * @return
   */
  atLeast(field: string, value: number): this;

  /**
   * Sets a datetime field to the current moment
   *
   * @method
   * @param field The field to perform the operation on
   * @return
   */
  toNow(field: string): this;
}

export class PartialUpdateBuilder<T extends Entity> {
  public operations: UpdateOperation[] = [];

  /**
   * @param operations
   */
  constructor(operations: JsonMap) {
    if (operations) {
      this.addOperations(operations);
    }
  }

  /**
   * Sets a field to a given value
   *
   * @param field The field to set
   * @param value The value to set to
   * @return
   */
  set(field: string, value: any) : this {
    let val = value;
    if (val instanceof Set) {
      val = Array.from(val);
    } else if (val instanceof Map) {
      const newValue: { [key: string]: any } = {};
      val.forEach((v: any, k: string) => {
        newValue[k] = v;
      });
      val = newValue;
    }

    return this.addOperation(field, '$set', val);
  }

  /**
   * Increments a field by a given value
   *
   * @param field The field to increment
   * @param by The number to increment by, defaults to 1
   * @return
   */
  inc(field: string, by?: number) : this {
    return this.addOperation(field, '$inc', typeof by === 'number' ? by : 1);
  }

  /**
   * Decrements a field by a given value
   *
   * @param field The field to decrement
   * @param by The number to decrement by, defaults to 1
   * @return
   */
  dec(field: string, by?: number) : this {
    return this.inc(field, typeof by === 'number' ? -by : -1);
  }

  /**
   * Multiplies a field by a given number
   *
   * @param field The field to multiply
   * @param multiplicator The number to multiply by
   * @return
   */
  mul(field: string, multiplicator: number) : this {
    if (typeof multiplicator !== 'number') {
      throw new Error('Multiplicator must be a number.');
    }

    return this.addOperation(field, '$mul', multiplicator);
  }

  /**
   * Divides a field by a given number
   *
   * @param field The field to divide
   * @param divisor The number to divide by
   * @return
   */
  div(field: string, divisor: number) : this {
    if (typeof divisor !== 'number') {
      throw new Error('Divisor must be a number.');
    }

    return this.addOperation(field, '$mul', 1 / divisor);
  }

  /**
   * Sets the highest possible value of a field
   *
   * @param field The field to compare with
   * @param value The highest possible value
   * @return
   */
  min(field: string, value: number) : this {
    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }

    return this.addOperation(field, '$min', value);
  }

  /**
   * Sets the smallest possible value of a field
   *
   * @param field The field to compare with
   * @param value The smalles possible value
   * @return
   */
  max(field: string, value: number) : this {
    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }

    return this.addOperation(field, '$max', value);
  }

  /**
   * Removes an item from an array or map
   *
   * @param field The field to perform the operation on
   * @param item The item to add
   * @return
   */
  remove(field: string, item: any) : this {
    return this.addOperation(field, '$remove', item);
  }

  /**
   * Puts an item from an array or map
   *
   * @param field The field to perform the operation on
   * @param key The map key to put the value to or an object of arguments
   * @param [value] The value to put if a key was used
   * @return
   */
  put(field: string, key: string | number | { [key: string]: any }, value?: any) : this {
    const obj: { [key: string]: any } = {};
    if (typeof key === 'string' || typeof key === 'number') {
      obj[key] = value;
    } else if (typeof key === 'object') {
      Object.assign(obj, key);
    }

    return this.addOperation(field, '$put', obj);
  }

  /**
   * Pushes an item into a list
   *
   * @param field The field to perform the operation on
   * @param item The item to add
   * @return
   */
  push(field: string, item: any) : this {
    return this.addOperation(field, '$push', item);
  }

  /**
   * Unshifts an item into a list
   *
   * @param field The field to perform the operation on
   * @param item The item to add
   * @return
   */
  unshift(field: string, item: any) : this {
    return this.addOperation(field, '$unshift', item);
  }

  /**
   * Pops the last item out of a list
   *
   * @param field The field to perform the operation on
   * @return
   */
  pop(field: string) : this {
    return this.addOperation(field, '$pop');
  }

  /**
   * Shifts the first item out of a list
   *
   * @param field The field to perform the operation on
   * @return
   */
  shift(field: string) : this {
    return this.addOperation(field, '$shift');
  }

  /**
   * Adds an item to a set
   *
   * @param field The field to perform the operation on
   * @param item The item to add
   * @return
   */
  add(field: string, item: any) : this {
    return this.addOperation(field, '$add', item);
  }

  /**
   * Replaces an item at a given index
   *
   * @param path The path to perform the operation on
   * @param index The index where the item will be replaced
   * @param item The item to replace with
   * @return
   */
  replace(path: string, index: number, item: any): this {
    if (this.hasOperationOnPath(path)) {
      throw new Error(`You cannot update ${path} multiple times`);
    }

    return this.addOperation(`${path}.${index}`, '$replace', item);
  }

  /**
   * Sets a datetime field to the current moment
   *
   * @param field The field to perform the operation on
   * @return
   */
  currentDate(field: string) : this {
    return this.addOperation(field, '$currentDate');
  }

  /**
   * Performs a bitwise AND on a path
   *
   * @param path The path to perform the operation on
   * @param bitmask The bitmask taking part in the operation
   * @return
   */
  and(path: string, bitmask: number): this {
    return this.addOperation(path, '$and', bitmask);
  }

  /**
   * Performs a bitwise OR on a path
   *
   * @param path The path to perform the operation on
   * @param bitmask The bitmask taking part in the operation
   * @return
   */
  or(path: string, bitmask: number): this {
    return this.addOperation(path, '$or', bitmask);
  }

  /**
   * Performs a bitwise XOR on a path
   *
   * @param path The path to perform the operation on
   * @param bitmask The bitmask taking part in the operation
   * @return
   */
  xor(path: string, bitmask: number): this {
    return this.addOperation(path, '$xor', bitmask);
  }

  /**
   * Renames a field
   *
   * @param oldPath The old field name
   * @param newPath The new field name
   * @return
   */
  rename(oldPath: string, newPath: string) {
    return this.addOperation(oldPath, '$rename', newPath);
  }

  /**
   * Returns a JSON representation of this partial update
   *
   * @return
   */
  toJSON(): Json {
    return this.operations.reduce((json, operation: UpdateOperation) => ({
      ...json,
      [operation.name]: {
        ...json[operation.name],
        [operation.path]: operation.value,
      },
    }), {} as { [path: string]: any });
  }

  /**
   * Executes the partial update
   *
   * @return The promise resolves when the partial update has been executed successfully
   * @abstract
   */
  execute(): Promise<T> {
    throw new Error('Cannot call "execute" on abstract PartialUpdateBuilder');
  }

  /**
   * Adds an update operation on the partial update
   *
   * @param path The path which gets modified by the operation
   * @param operator The operator of the operation to add
   * @param [value] The value used to execute the operation
   * @return
   * @private
   */
  addOperation(path: string, operator: string, value?: any): this {
    if (typeof path !== 'string') {
      throw new Error('Path must be a string');
    }

    if (ALLOWED_OPERATIONS.indexOf(operator) === -1) {
      throw new Error(`Operation invalid: ${operator}`);
    }

    if (this.hasOperationOnPath(path)) {
      throw new Error(`You cannot update ${path} multiple times`);
    }

    // Check for illegal values
    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        throw new Error('NaN is not a supported value');
      }
      if (!Number.isFinite(value)) {
        throw new Error('Infinity is not a supported value');
      }
    }

    // Add the new operation
    const normalizedValue = typeof value === 'undefined' ? null : value;
    const updateOperation = new UpdateOperation(operator, path, normalizedValue);
    this.operations.push(updateOperation);

    return this;
  }

  /**
   * Adds initial operations
   *
   * @param json
   * @private
   */
  addOperations(json: JsonMap) {
    Object.keys(json).forEach((key) => {
      const pathValueDictionary = json[key] as JsonMap;
      Object.keys(pathValueDictionary).forEach((path) => {
        const value = pathValueDictionary[path];
        this.operations.push(new UpdateOperation(key, path, value));
      });
    });
  }

  /**
   * Checks whether an operation on the field exists already
   *
   * @param path The path where the operation is executed on
   * @return True, if the operation does exist
   * @private
   */
  hasOperationOnPath(path: string): boolean {
    return this.operations.some((op) => op.path === path);
  }
}

// aliases
Object.assign(PartialUpdateBuilder.prototype, {
  increment: PartialUpdateBuilder.prototype.inc,
  decrement: PartialUpdateBuilder.prototype.dec,
  multiply: PartialUpdateBuilder.prototype.mul,
  divide: PartialUpdateBuilder.prototype.div,
  atMost: PartialUpdateBuilder.prototype.min,
  atLeast: PartialUpdateBuilder.prototype.max,
  toNow: PartialUpdateBuilder.prototype.currentDate,
});
