import validator from 'validator';
import { Entity } from '../binding';
import { ManagedType } from '../metamodel';

const FallBachValLib = {};
let valLib: Partial<typeof validator> = FallBachValLib;
try {
  // we load this module as an optional external dependency
  // eslint-disable-next-line global-require
  valLib = require('validator');
} catch (e) {
  // ignore loading optional module error
}

type Validators = Omit<
    typeof validator, // Extract<typeof validator, Function>,
'version' | 'blacklist' | 'escape' | 'unescape' | 'ltrim' | 'normalizeEmail' | 'rtrim' | 'stripLow' | 'toBoolean' | 'toDate' | 'toFloat' | 'toInt' | 'trim' | 'whitelist' | 'toString'
>;

// import all validators from the validation library
export interface Validator extends Pick<Validators, keyof Validators>{}
export class Validator {
  /**
   * Compiles the given validation code for the managedType
   * @param managedType The managedType of the code
   * @param validationCode The validation code
   * @return the parsed validation function
   */
  static compile(managedType: ManagedType<any>, validationCode: string): Function {
    const keys: string[] = [];
    const iter = managedType.attributes();
    for (let el = iter.next(); !el.done; el = iter.next()) {
      const attr = el.value;
      keys.push(attr.name);
    }

    // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
    const fn = new Function(...keys, validationCode);
    return function onValidate(argObj: {[arg: string]: Validator}) {
      if (valLib === FallBachValLib) {
        throw new Error('Validation code will not be executed. Make sure that the validator package is correctly provided as an external dependency.');
      }

      const args = keys.map((name) => argObj[name]);
      return fn.apply({}, args);
    };
  }

  /**
   * The cached errors of the validation
   */
  private errors: string[] = [];

  /**
   * Entity to get the value of the attribute
   */
  private entity: Entity;

  /**
   * Name of the attribute
   */
  key: string;

  /**
   * Gets the value of the attribute
   * @return Value
   */
  get value(): any {
    return this.entity[this.key];
  }

  /**
   * Checks if the attribute is valid
   * @return
   */
  get isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param fn will be used to validate the value
   * @return
   */
  is(fn: Function): Validator;

  /**
   * Executes the given validation function to validate the value.
   *
   * The value will be passed as the first parameter to the validation function and
   * the library {@link https://github.com/chriso/validator.js} as the second one.
   * If the function returns true the value is valid, otherwise it's invalid.
   *
   * @param error The error message which will be used if the value is invalid
   * @param fn will be used to validate the value
   * @return
   */
  is(error: string, fn: Function): Validator;

  is(error: string | Function, fn?: Function): Validator {
    if (error instanceof Function) {
      return this.is('is', error);
    }

    if (fn!(this.value, valLib) === false) {
      this.errors.push(error);
    }

    return this;
  }

  constructor(key: string, entity: Entity) {
    this.key = key;
    this.entity = entity;
  }

  callMethod(method: keyof typeof validator, errorMessage: string | null, argumentList: any[]) {
    const args = argumentList || [];
    try {
      args.unshift(this.toStringValue());
      if ((valLib[method] as Function).apply(this, args) === false) {
        this.errors.push(errorMessage || method);
      }
    } catch (e) {
      this.errors.push(errorMessage || e.message);
    }
    return this;
  }

  toStringValue() {
    const { value } = this;
    if (typeof value === 'string' || value instanceof Date) {
      return value;
    }

    return JSON.stringify(value);
  }

  toJSON() {
    return {
      isValid: this.isValid,
      errors: this.errors,
    };
  }
}

const OTHER_VALIDATORS: string[] = ['contains', 'equals', 'matches'];
(Object.keys(valLib) as (keyof Validators)[]).forEach((name: (keyof Validators)) => {
  if (name.startsWith('is') || OTHER_VALIDATORS.includes(name)) {
    // use function here to keep the correct this context
    (Validator.prototype[name] as any) = function validate(this: Validator, ...args: any[]) {
      const error = typeof args[0] === 'string' ? args.shift() : null;
      return this.callMethod(name, error, args);
    };
  }
});
