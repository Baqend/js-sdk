'use strict';

import { PersistentError } from "./PersistentError";
import { Entity } from "../binding";

export class IllegalEntityError extends PersistentError {
  /**
   * The entity which cause the error
   */
  public entity: Entity;

  /**
   * @param entity - The entity which cause the error
   */
  constructor(entity: Entity) {
    super('Entity ' + entity + ' is not a valid entity');
    this.entity = entity;
  }
}
