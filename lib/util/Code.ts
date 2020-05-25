'use strict';

import * as message from "../message";
import { StatusCode } from "../connector/Message";
import { deprecated } from "./deprecated";
import { EntityManagerFactory } from "../EntityManagerFactory";
import { Metamodel } from "../metamodel/Metamodel";
import { ManagedType } from "../metamodel";

/**
 * Representation of a Code which runs on Baqend.
 */
export class Code {
  metamodel: Metamodel;
  entityManagerFactory: EntityManagerFactory;

  /**
   * @param {Metamodel} metamodel
   * @param {EntityManagerFactory} entityManagerFactory
   */
  constructor(metamodel, entityManagerFactory) {
    this.metamodel = metamodel;
    this.entityManagerFactory = entityManagerFactory;
  }

  /**
   * Converts the given function to a string
   * @param {Function} fn The JavaScript function to serialize
   * @return {string} The serialized function
   */
  functionToString(fn) {
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
   * @param {Array<string>} signature The expected parameters of the function
   * @param {string} code The JavaScript function to deserialize
   * @return {Function} The deserialized function
   */
  stringToFunction(signature, code) {
    return new Function(signature, code); // eslint-disable-line no-new-func
  }

  /**
   * Loads a list of all available modules without handlers
   *
   * @return {Promise<Array<string>>}
   */
  loadModules() {
    const msg = new message.GetAllModules();
    return this.entityManagerFactory.send(msg)
      .then(response => response.entity);
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
  loadCode(type: ManagedType<any> | string, codeType: string, asFunction: true): Promise<Function>;

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

  loadCode(type: ManagedType<any> | string, codeType: string, asFunction: boolean = false): Promise<Function | string>  {
    const bucket = typeof type === 'string' ? type : type.name;
    const msg = new message.GetBaqendCode(bucket, codeType)
      .responseType('text');

    return this.entityManagerFactory.send(msg)
      .then(response => this.parseCode(bucket, codeType, asFunction, response.entity), (e) => {
        if (e.status === StatusCode.OBJECT_NOT_FOUND) {
          return null;
        }

        throw e;
      });
  }

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param {ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @param {string} fn Baqend code as a string
   * @return {Promise<string>} The stored code as a string
   */
  saveCode(type: ManagedType<any> | string, codeType: string, fn: string): Promise<string>;

  /**
   * Saves Baqend code which will be identified by the given bucket and code type
   *
   * @param {ManagedType|string} type The entity type for the handler or the Name of the
   * Baqend code
   * @param {string} codeType The type of the code
   * @param {Function} fn Baqend code as a function
   * @return {Promise<Function>} The stored code as a parsed function
   */
  saveCode(type: ManagedType<any> | string, codeType: string, fn: Function): Promise<Function>;

  saveCode(type: ManagedType<any> | string, codeType: string, fn: Function | string): Promise<Function | string> {
    const bucket = typeof type === 'string' ? type : type.name;
    const asFunction = fn instanceof Function;

    const msg = new message.SetBaqendCode(bucket, codeType)
      .entity(asFunction ? this.functionToString(fn) : fn, 'text')
      .responseType('text');

    return this.entityManagerFactory.send(msg)
      .then(response => this.parseCode(bucket, codeType, asFunction, response.entity));
  }

  /**
   * Deletes Baqend code identified by the given bucket and code type
   *
   * @param type The entity type for the handler or the Name of the
   * Baqend code
   * @param codeType The type of the code
   * @return {Promise<*>} succeed if the code was deleted
   */
  deleteCode(type: ManagedType<any> | string, codeType: string) {
    const bucket = typeof type === 'string' ? type : type.name;
    const msg = new message.DeleteBaqendCode(bucket, codeType);
    return this.entityManagerFactory.send(msg)
      .then(() => this.parseCode(bucket, codeType, false, null));
  }

  /**
   * @param {string} bucket
   * @param {string} codeType
   * @param {boolean} [asFunction=false]
   * @param {string} code
   * @return {string|Function}
   * @private
   */
  parseCode(bucket, codeType, asFunction, code) {
    if (codeType === 'validate') {
      const type = this.metamodel.entity(bucket)!;
      type.validationCode = code;
      return asFunction ? type.validationCode : code;
    }

    return asFunction ? this.stringToFunction(['module', 'exports'], code) : code;
  }
}

deprecated(Code.prototype, '_metamodel', 'metamodel');
deprecated(Code.prototype, '_parseCode', 'parseCode');
