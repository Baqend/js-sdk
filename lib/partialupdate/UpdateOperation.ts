'use strict';

export class UpdateOperation {
  /**
   * @param name
   * @param path
   * @param [value]
   */
  constructor(public name: string, public path: string, public value?: any) {}
}
