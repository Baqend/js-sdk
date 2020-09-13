import { ManagedType } from './ManagedType';
import { PersistenceType } from './Type';
import { Managed, ManagedFactory } from '../binding';
import { Class, Json } from '../util';
import type { EntityManager } from '../EntityManager';
import { ManagedState } from '../intersection';

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
  fromJsonValue(state: ManagedState, jsonObject: Json, currentObject: T | null,
    options: { onlyMetadata?: boolean, persisting: boolean }) {
    let obj = currentObject;

    if (jsonObject) {
      if (!(obj instanceof this.typeConstructor)) {
        obj = this.create();
      }
    }

    return super.fromJsonValue(state, jsonObject, obj, options);
  }

  toString() {
    return `EmbeddableType(${this.ref})`;
  }
}
