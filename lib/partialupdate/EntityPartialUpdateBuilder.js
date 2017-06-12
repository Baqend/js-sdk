"use strict";

var PartialUpdateBuilder = require('./PartialUpdateBuilder');

/**
 * @alias partialupdate.EntityPartialUpdateBuilder<T>
 * @extends partialupdate.PartialUpdateBuilder<T>
 */
class EntityPartialUpdateBuilder extends PartialUpdateBuilder {

  /**
   * @param {binding.Entity} entity
   */
  constructor(entity) {
    super();

    /** @type {binding.Entity} */
    this._entity = entity;
  }
}

module.exports = EntityPartialUpdateBuilder;
