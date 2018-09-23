'use strict';

const PartialUpdateBuilder = require('./PartialUpdateBuilder');
const Metadata = require('../util/Metadata');
const deprecated = require('../util/deprecated');
const message = require('../message');

/**
 * @alias partialupdate.EntityPartialUpdateBuilder<T>
 * @extends partialupdate.PartialUpdateBuilder<T>
 */
class EntityPartialUpdateBuilder extends PartialUpdateBuilder {
  /**
   * @param {binding.Entity} entity
   * @param {json} operations
   */
  constructor(entity, operations) {
    super(operations);

    /** @type {binding.Entity} */
    this.entity = entity;
  }

  /**
   * @inheritDoc
   */
  execute() {
    const state = Metadata.get(this.entity);
    const body = JSON.stringify(this);
    const msg = new message.UpdatePartially(state.bucket, state.key, body);

    return state.withLock(() => (
      state.db.send(msg).then((response) => {
        // Update the entity’s values
        state.type.fromJsonValue(state, response.entity, this.entity, { persisting: true });
        return this.entity;
      })
    ));
  }
}

deprecated(PartialUpdateBuilder.prototype, '_entity', 'entity');

module.exports = EntityPartialUpdateBuilder;
