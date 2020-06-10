'use strict';

import { Class, Metadata, Json, JsonMap, JsonArray } from "../util";
import { File } from "../binding";
import { GeoPoint } from "../GeoPoint";
import { PersistenceType, Type } from "./Type";

function dateToJson(value: Date | null): string | null {
  // remove trailing zeros
  return value instanceof Date ? value.toISOString().replace(/\.?0*Z/, 'Z') : null;
}

function jsonToDate(json: Json, currentValue: Date | null): Date | null {
  const date = typeof json === 'string' ? new Date(json) : null;
  if (currentValue && date) {
    // compare normalized date strings instead of plain strings
    return currentValue.toISOString() === date.toISOString() ? currentValue : date;
  }

  return date;
}

export class BasicType<T> extends Type<T> {
  public static readonly Boolean = new class BooleanType extends BasicType<Boolean> {
    fromJsonValue(state: Metadata, json: Json, currentValue: Boolean | null): Boolean | null {
      return typeof json === 'string' ? json !== 'false' : super.fromJsonValue(state, json, currentValue);
    }
  }('Boolean', Boolean);

  public static readonly Double = new class DoubleType extends BasicType<Number> {
    fromJsonValue(state: Metadata, json: Json, currentValue: Number | null) {
      return typeof json === 'string' ? parseFloat(json) : super.fromJsonValue(state, json, currentValue);
    }
  }('Double', Number);

  public static readonly Integer = new class IntegerType extends BasicType<Number> {
    fromJsonValue(state: Metadata, json: Json, currentValue: number | null) {
      return typeof json === 'string' ? parseInt(json, 10) : super.fromJsonValue(state, json, currentValue);
    }
  }('Integer', Number);

  public static readonly String = new class StringType extends BasicType<String> {}('String', String);

  public static readonly DateTime = new class DateTimeType extends BasicType<Date> {
    toJsonValue(state: Metadata, value: Date | null) {
      return dateToJson(value);
    }

    fromJsonValue(state: Metadata, json: Json, currentValue: Date | null) {
      return jsonToDate(json, currentValue);
    }
  }('DateTime', Date);

  public static readonly Date = new class DateType extends BasicType<Date> {
    toJsonValue(state: Metadata, value: Date | null) {
      const json = dateToJson(value);
      return json ? json.substring(0, json.indexOf('T')) : null;
    }

    fromJsonValue(state: Metadata, json: Json, currentValue: Date | null) {
      return jsonToDate(json, currentValue);
    }
  }('Date', Date);

  public static readonly Time = new class TimeType extends BasicType<Date> {
    toJsonValue(state: Metadata, value: Date | null) {
      const json = dateToJson(value);
      return json ? json.substring(json.indexOf('T') + 1) : null;
    }

    fromJsonValue(state: Metadata, json: Json, currentValue: Date | null): Date | null {
      return typeof json === 'string' ? jsonToDate('1970-01-01T' + json, currentValue) : null;
    }
  }('Time', Date);

  public static readonly File = new class FileType extends BasicType<File> {
    toJsonValue(state: Metadata, value: File | null) {
      return value instanceof File ? value.id : null;
    }

    fromJsonValue(state: Metadata, json: Json, currentValue: File | null): File | null {
      if (json) {
        return currentValue && currentValue.id === json ? currentValue : new state.db.File(json as string);
      }
      return null;
    }
  }('File', File);

  public static readonly GeoPoint = new class GeoPointType extends BasicType<GeoPoint> {
    toJsonValue(state: Metadata, value: GeoPoint | null) {
      return value instanceof GeoPoint ? value.toJSON() : null;
    }

    fromJsonValue(state: Metadata, json: Json) {
      return json ? new GeoPoint(json as { latitude: number, longitude: number }) : null;
    }
  }('GeoPoint', GeoPoint);

  public static readonly JsonArray = new class JsonArrayType extends BasicType<JsonArray> {
    toJsonValue(state: Metadata, value: Array<any> | null) {
      return Array.isArray(value) ? value : null;
    }

    fromJsonValue(state: Metadata, json: Json) {
      return Array.isArray(json) ? json : null;
    }
  }('JsonArray', Array);

  public static readonly JsonObject = new class JsonObjectType extends BasicType<JsonMap> {
    toJsonValue(state: Metadata, value: JsonMap | null): JsonMap | null {
      if (value && value.constructor === Object) {
        return value;
      }

      return null;
    }
  }('JsonObject', Object as any);

  /**
   * Indicates if this type is not the main type of the constructor
   */
  public noResolving: boolean;

  /**
   * @inheritDoc
   */
  get persistenceType() {
    return PersistenceType.BASIC;
  }

  /**
   * Creates a new instance of a native db type
   * @param ref The db ref of this type
   * @param typeConstructor The javascript class of this type
   * @param noResolving Indicates if this type is not the main type of the constructor
   */
  constructor(ref: string, typeConstructor: Class<T>, noResolving?: boolean) {
    const id = ref.indexOf('/db/') === 0 ? ref : '/db/' + ref;

    super(id, typeConstructor);

    this.noResolving = !!noResolving;
  }

  /**
   * @inheritDoc
   */
  toJsonValue(state: Metadata, currentValue: T | null): Json {
    return currentValue === null || currentValue === undefined ? null : (this.typeConstructor as any)(currentValue);
  }

  /**
   * @inheritDoc
   */
  fromJsonValue(state: Metadata, json: Json, currentValue: T | null): T | null {
    return json === null || json === undefined ? null : json as any;
  }

  toString() {
    return 'BasicType(' + this.ref + ')';
  }
}
