import { PartialUpdateBuilder } from './PartialUpdateBuilder';
import { JsonMap } from '../util';
import * as message from '../message';
import { Entity } from '../binding';
import { Metadata } from '../intersection';

export class EntityPartialUpdateBuilder<T extends Entity> extends PartialUpdateBuilder<T> {
  /**
   * @param entity
   * @param operations
   */
  constructor(public readonly entity: T, operations: JsonMap) {
    super(operations);
  }

  /**
   * @inheritDoc
   */
  execute(): Promise<T> {
    var em = this.entity._metadata.db;
    if (em.isTransactionSet()) {
      em.transactionalPartialUpdates.push(this);
      return Promise.resolve(this.entity);
    }

    const state = Metadata.get(this.entity);
    const body = JSON.stringify(this);
    const msg = new message.UpdatePartially(state.bucket, state.key!, body);

    return state.withLock(() => (
      state.db.send(msg).then((response) => {
        // Update the entity’s values
        state.type.fromJsonValue(state, response.entity, this.entity, { persisting: true });
        return this.entity;
      })
    ));
  }
}
