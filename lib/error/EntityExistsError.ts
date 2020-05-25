'use strict';

import { PersistentError } from "./PersistentError";
import { Entity } from "../binding";

export class EntityExistsError extends PersistentError {
  /**
   * The entity which cause the error
   */
  public entity: Entity;

  /**
   * @param entity - The entity which cause the error
   */
  constructor(entity) {
    super('The entity ' + entity + ' is managed by a different db.');
    this.entity = entity;
  }
}
