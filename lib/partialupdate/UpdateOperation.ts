'use strict';

export class UpdateOperation {
  /**
   * @param {string} name
   * @param {string} path
   * @param {*} [value]
   */
  constructor(public name: string, public path: string, public value: any) {}
}
