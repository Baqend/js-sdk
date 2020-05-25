'use strict';

import { PartialUpdateBuilder } from "./PartialUpdateBuilder";
import { Metadata } from "../util/Metadata";
import { deprecated } from "../util/deprecated";
import * as message from "../message";
import { Entity } from "../binding";
import { JsonMap } from "../util";

export class EntityPartialUpdateBuilder<T extends Entity> extends PartialUpdateBuilder<T> {
  /**
   * @param entity
   * @param operations
   */
  constructor(public readonly entity: Entity, operations: JsonMap) {
    super(operations);
  }

  /**
   * @inheritDoc
   */
  execute(): Promise<T> {
    const state = Metadata.get(this.entity);
    const body = JSON.stringify(this);
    const msg = new message.UpdatePartially(state.bucket, state.key, body);

    return state.withLock(() => (
      state.db.send(msg).then((response) => {
        // Update the entity’s values
        state.setJson(response.entity, true);
        return this.entity;
      })
    ));
  }
}

deprecated(PartialUpdateBuilder.prototype, '_entity', 'entity');
