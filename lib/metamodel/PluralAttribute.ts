import { Class, Json } from '../util';
import { Type } from './Type';
import { Attribute, PersistentAttributeType } from './Attribute';

export enum CollectionType {
  COLLECTION = 0,
  LIST = 1,
  MAP = 2,
  SET = 3,
}

export abstract class PluralAttribute<T, E> extends Attribute<T> {
  public static readonly CollectionType = CollectionType;

  public elementType: Type<E>;

  public typeConstructor: Class<T>;

  /**
   * Returns the collection attribute type
   */
  abstract get collectionType(): CollectionType;

  /**
   * @inheritDoc
   */
  get persistentAttributeType() {
    return PersistentAttributeType.ELEMENT_COLLECTION;
  }

  /**
   * @param name - The attribute name
   * @param typeConstructor - The collection constructor of the attribute
   * @param elementType - The type of the elements of the attribute collection
   */
  protected constructor(name: string, typeConstructor: Class<T>, elementType: Type<E>) {
    super(name);
    this.elementType = elementType;
    this.typeConstructor = typeConstructor;
  }

  /**
   * Retrieves a serialized string value of the given json which can be used as object keys
   * @param json The json of which the key should be retrieved
   * @return A serialized version of the json
   */
  protected keyValue(json: Json): string {
    if (json && typeof json === 'object' && 'id' in json) {
      return String(json.id);
    }

    return String(json);
  }
}
