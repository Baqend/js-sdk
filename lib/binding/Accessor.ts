import { Managed } from './Managed';
import { Attribute } from '../metamodel';

export class Accessor {
  /**
   * @param object
   * @param attribute
   * @return
   */
  getValue<T>(object: Managed, attribute: Attribute<T>): T | null {
    return object[attribute.name] as T | null;
  }

  /**
   * @param object
   * @param attribute
   * @param value
   */
  setValue<T>(object: Managed, attribute: Attribute<T>, value: T): void {
    // eslint-disable-next-line no-param-reassign
    object[attribute.name] = value;
  }
}
