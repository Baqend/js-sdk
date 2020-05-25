'use strict';

import { ManagedType } from "./ManagedType";
import { PersistenceType, Type } from "./Type";
import { Managed, ManagedFactory } from "../binding";
import { Class, Metadata } from "../util";
import { EntityManager } from "../EntityManager";

export class EmbeddableType<T extends Managed> extends ManagedType<T> {
  /**
   * @inheritDoc
   */
  get persistenceType() {
    return PersistenceType.EMBEDDABLE;
  }

  /**
   * @inheritDoc
   */
  createProxyClass(): Class<T> {
    return this.enhancer!!.createProxy(Managed);
  }

  /**
   * @inheritDoc
   */
  createObjectFactory(db: EntityManager): ManagedFactory<T> {
    return ManagedFactory.create(this, db);
  }

  /**
   * @inheritDoc
   */
  toJsonValue(state: Metadata, object: T | null, options: { excludeMetadata?: boolean; depth?: number | boolean }) {
    if (state.root && object instanceof this.typeConstructor && !object._metadata.root) {
      object._metadata.root = state.root;
    }

    return super.toJsonValue(state, object, options);
  }

  /**
   * @inheritDoc
   */
  fromJsonValue(state, jsonObject, currentObject, options) {
    let obj = currentObject;

    if (jsonObject) {
      if (!(obj instanceof this.typeConstructor)) {
        obj = this.create();
      }

      if (state.root && !obj._metadata.root) {
        obj._metadata.root = state.root;
      }
    }

    return super.fromJsonValue(state, jsonObject, obj, options);
  }

  toString() {
    return 'EmbeddableType(' + this.ref + ')';
  }
}
