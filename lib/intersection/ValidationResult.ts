import { JsonMap } from '../util/Json';
import { Validator } from './Validator';

export class ValidationResult {
  public fields: { [property: string]: Validator } = {};

  /**
   * Indicates if all fields are valid
   * @return <code>true</code> if all fields are valid
   */
  get isValid(): boolean {
    return Object.keys(this.fields).every((key) => this.fields[key].isValid);
  }

  toJSON(): JsonMap {
    const json: JsonMap = {};
    Object.keys(this.fields).forEach((key) => {
      json[key] = this.fields[key].toJSON();
    });
    return json;
  }
}
