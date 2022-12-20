import * as message from '../message';
import { StatusCode } from '../connector';
import type { EntityManagerFactory } from '../EntityManagerFactory';
import type { Metamodel, ManagedType } from '../metamodel';

import { Validator } from './Validator';

/**
 * Representation of a Code which runs on Baqend.
 */
export class Code {
  metamodel: Metamodel;

  entityManagerFactory: EntityManagerFactory;

  /**
   * @param metamodel
   * @param entityManagerFactory
   */
  constructor(metamodel: Metamodel, entityManagerFactory: EntityManagerFactory) {
    this.metamodel = metamodel;
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Converts the given function to a string
   * @param fn The JavaScript function to serialize
   * @return The serialized function
   */
  functionToString(fn: CallableFunction): string {
    if (!fn) {
      return '';
    }

    let str = fn.toString();
    str = str.substring(str.indexOf('{') + 1, str.lastIndexOf('}'));
    if (str.charAt(0) === '\n') {
      str = str.substring(1);
    }

    if (str.charAt(str.length - 1) === '\n') {
      str = str.substring(0, str.length - 1);
    }

    return str;
  }

  /**
   * Converts the given string to a module wrapper function
   * @param signature The expected parameters of the function
   * @param code The JavaScript function to deserialize
   * @return The deserialized function
   */
  stringToFunction(signature: string[], code: string): CallableFunction {
    return new Function(signature as any /* typings are incorrect here */, code);
  }

  /**
   * Loads a list of all available modules without handlers
   *
   * @return
   */
  loadModules(): Promise<string[]> {
    const msg = new message.GetAllModules();
    return this.entityManagerFactory.send(msg)
      .then((response) => response.entity);
  }

  /**
   * Loads Baqend code which will be identified by the given bucket and code type
   *
   * @param type The entity type for the handler or the Name of the
   * Baqend code
   * @param codeType The type of the code
   * @param asFunction set it to <code>true</code>, to parse the code as a function and return it
   * instead of a string
   * @return The code as parsed function
   */
  loadCode(type: ManagedType<any> | string, codeType: string, asFunction: true): Promise<CallableFunction>;

  /**
   * Loads Baqend code which will be identified by the given bucket and code type
   *
   * @param type The entity type for the handler or the Name of the
   * Baqend code
   * @param codeType The type of the code
   * @param asFunction set it to <code>true</code>, to parse the code as a function and return it
   * instead of a string
   * @return The code as string
   */
  loadCode(type: ManagedType<any> | string, codeType: string, asFunction?: false): Promise<string>;

  loadCode(type: ManagedType<any> | string, codeType: string, asFunction = false):
    Promise<CallableFunction | string | null> {
    const bucket = typeof type === 'string' ? type : type.name;
    const msg = new message.GetBaqendCode(bucket, codeType)
      .responseType('text');

    return this.entityManagerFactory.send(msg)
      .then((response) => this.parseCode(bucket, codeType, asFunction, response.entity), (e) => {
        if (e.status === StatusCode.OBJECT_NOT_FOUND) {
          return null;
        }

        throw e;
      });
  }

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param type The entity type for the handler or the Name of the
   * Baqend code
   * @param codeType The type of the code
   * @param fn Baqend code as a string
   * @return The stored code as a string
   */
  saveCode(type: ManagedType<any> | string, codeType: string, fn: string): Promise<string>;

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param type The entity type for the handler or the Name of the
   * Baqend code
   * @param codeType The type of the code
   * @param fn Baqend code as a function
   * @return The stored code as a parsed function
   */
  saveCode(type: ManagedType<any> | string, codeType: string, fn: CallableFunction): Promise<CallableFunction>;

  saveCode(type: ManagedType<any> | string, codeType: string, fn: CallableFunction | string):
    Promise<CallableFunction | string> {
    const bucket = typeof type === 'string' ? type : type.name;

    const msg = new message.SetBaqendCode(bucket, codeType)
      .entity(fn instanceof Function ? this.functionToString(fn) : fn, 'text')
      .responseType('text');

    return this.entityManagerFactory.send(msg)
      .then((response) => this.parseCode(bucket, codeType, fn instanceof Function, response.entity)!);
  }

  /**
   * Deletes Baqend code identified by the given bucket and code type
   *
   * @param type The entity type for the handler or the Name of the
   * Baqend code
   * @param codeType The type of the code
   * @return succeed if the code was deleted
   */
  deleteCode(type: ManagedType<any> | string, codeType: string): Promise<any> {
    const bucket = typeof type === 'string' ? type : type.name;
    const msg = new message.DeleteBaqendCode(bucket, codeType);
    return this.entityManagerFactory.send(msg)
      .then(() => this.parseCode(bucket, codeType, false, null));
  }

  /**
   * @param bucket
   * @param codeType
   * @param [asFunction=false]
   * @param code
   * @return
   * @private
   */
  parseCode(bucket: string, codeType: string, asFunction: boolean, code: string | null):
    string | null | CallableFunction {
    if (codeType === 'validate') {
      const type = this.metamodel.entity(bucket)!;
      type.validationCode = code === null ? null : Validator.compile(type, code);
      return asFunction ? type.validationCode : code;
    }

    return code && asFunction ? this.stringToFunction(['module', 'exports'], code) : code;
  }
}
