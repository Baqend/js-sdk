import { JsonMap } from '../util';

type IndexSpec = { [name: string]: string }[];

/**
 * Creates a new index instance which is needed to create an
 * database index.
 */
export class DbIndex {
  public static readonly ASC = 'asc';

  public static readonly DESC = 'desc';

  public static readonly GEO: 'geo';

  /**
   * An array of mappings from field to index type which are parts of this index/compound index
   */
  public keys: IndexSpec;

  public unique: boolean;

  /**
   * Returns DbIndex Object created from the given JSON
   * @param json
   * @return
   */
  public static fromJSON(json: JsonMap): DbIndex {
    return new DbIndex(json.keys as IndexSpec, json.unique as boolean);
  }

  /**
   * @param keys The name of the field which will be used
   * for the index,
   * an object of an field and index type combination or
   * an array of objects to create an compound index
   * @param unique Indicates if the index will be unique
   */
  constructor(keys: string | { [name: string]: string } | IndexSpec, unique?: boolean) {
    if (typeof keys === 'string') {
      const key: { [p: string]: string } = {};
      key[keys] = DbIndex.ASC;
      this.keys = [key];
    } else if (Array.isArray(keys)) {
      this.keys = keys;
    } else if (keys) {
      this.keys = [keys];
    } else {
      throw new Error('The keys parameter must be an String, Object or Array.');
    }

    this.unique = unique === true;
  }

  /**
   * Indicates if this index is for the given field or includes it in a compound index
   * @param name The name of the field to check for
   * @return <code>true</code> if the index contains this field
   */
  hasKey(name: string): boolean {
    for (let i = 0; i < this.keys.length; i += 1) {
      if (this.keys[i][name]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Indicates if this index is a compound index of multiple attributes
   * @type boolean
   * @readonly
   */
  get isCompound() {
    return this.keys.length > 1;
  }

  /**
   * Indicates if this index is an unique index
   * @type boolean
   * @readonly
   */
  get isUnique() {
    return this.unique;
  }

  /**
   * Returns a JSON representation of the Index object
   *
   * @return A Json of this Index object
   */
  toJSON(): JsonMap {
    return {
      unique: this.unique,
      keys: this.keys,
    };
  }
}
