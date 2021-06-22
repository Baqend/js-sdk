import { flatArgs } from './Query';
import type { Entity } from '../binding';
import type { Filter } from './Filter';
import { JsonMap } from '../util';
import type { GeoPoint } from '../GeoPoint';

/**
 * The Condition interface defines all existing query filters
 */
export interface Condition<T extends Entity> {

  /**
   * An object that contains filter rules which will be merged with the current filters of this query
   *
   * @param conditions - Additional filters for this query
   * @return The resulting Query
   */
  where(conditions: JsonMap): Filter<T>;

  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   */
  equal(field: string, value: any): Filter<T>

  /**
   * Adds a not equal filter to the field
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/ne/
   */
  notEqual(field: string, value: any): Filter<T>

  /**
   * Adds a greater than filter to the field
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  greaterThan(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * Adds a greater than or equal to filter to the field
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  greaterThanOrEqualTo(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * Adds a less than filter to the field
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lessThan(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * Adds a less than or equal to filter to the field
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  lessThanOrEqualTo(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * Adds a between filter to the field. This is a shorthand for an less than and greater than filter.
   * @param field The field to filter
   * @param greaterValue The field value must be greater than this value
   * @param lessValue The field value must be less than this value
   * @return The resulting Query
   */
  between(
    field: string,
    greaterValue: number | string | Date | Entity,
    lessValue: number | string | Date | Entity
  ): Filter<T>

  /**
   * Adds a “in” filter to the field
   *
   * The field value must be equal to one of the given values.
   *
   * @param field The field to filter
   * @param args The field value or values to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  in(field: string, ...args: any[]): Filter<T>

  /**
   * Adds an “in” filter to the field
   *
   * The field value must be equal to one of the given values.
   *
   * @param field The field to filter
   * @param args The field value or values to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  in(field: string, ...args: any[]): Filter<T>

  /**
   * Adds a “not in” filter to the field
   *
   * The field value must not be equal to any of the given values.
   *
   * @param field The field to filter
   * @param args The field value or values to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notIn(field: string, ...args: any[]): Filter<T>

  /**
   * Adds a “is null” filter to the field
   *
   * The field value must be null.
   *
   * @param field The field to filter
   * @return The resulting Query
   */
  isNull(field: string): Filter<T>

  /**
   * Adds a “is not null” filter to the field
   *
   * The field value must not be null.
   *
   * @param field The field to filter
   * @return The resulting Query
   */
  isNotNull(field: string): Filter<T>

  /**
   * Adds a contains all filter to the collection field
   *
   * The collection must contain all the given values.
   *
   * @param field The field to filter
   * @param args The field value or values to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/all/
   */
  containsAll(field: string, ...args: any[]): Filter<T>

  /**
   * Adds a modulo filter to the field
   *
   * The field value divided by divisor must be equal to the remainder.
   *
   * @param field The field to filter
   * @param divisor The divisor of the modulo filter
   * @param remainder The remainder of the modulo filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/mod/
   */
  mod(field: string, divisor: number, remainder: number): Filter<T>

  /**
   * Adds a regular expression filter to the field
   *
   * The field value must matches the regular expression.
   * <p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p>
   *
   * @param field The field to filter
   * @param regExp The regular expression of the filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/regex/
   */
  matches(field: string, regExp: string | RegExp): Filter<T>

  /**
   * Adds a size filter to the collection field
   *
   * The collection must have exactly size members.
   *
   * @param field The field to filter
   * @param size The collections size to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/size/
   */
  size(field: string, size: number): Filter<T>

  /**
   * Adds a geopoint based near filter to the GeoPoint field
   *
   * The GeoPoint must be within the maximum distance
   * to the given GeoPoint. Returns from nearest to farthest.
   *
   * @param field The field to filter
   * @param geoPoint The GeoPoint to filter
   * @param maxDistance Tha maximum distance to filter in meters
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nearSphere/
   */
  near(field: string, geoPoint: GeoPoint, maxDistance: number): Filter<T>

  /**
   * Adds a GeoPoint based polygon filter to the GeoPoint field
   *
   * The GeoPoint must be contained within the given polygon.
   *
   * @param field The field to filter
   * @param geoPoints The geoPoints that describes the polygon of the filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/geoWithin/
   */
  withinPolygon(field: string, ...geoPoints: GeoPoint[] | GeoPoint[][]): Filter<T>

  /**
   * Adds a equal filter to the field
   *
   * All other other filters on the field will be discarded.
   *
   * @method
   * @param field The field to filter
   * @param value The value used to filter
   */
  eq(field: string, value: any): Filter<T>

  /**
   * Adds a not equal filter to the field
   *
   * @method
   * @param field The field to filter
   * @param value The value used to filter
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/ne/
   */
  ne(field: string, value: any): Filter<T>

  /**
   * Adds a less than filter to the field
   *
   * Shorthand for {@link Condition#lessThan}.
   *
   * @method
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lt(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * Adds a less than or equal to filter to the field
   *
   * Shorthand for {@link Condition#lessThanOrEqualTo}.
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  le(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * Adds a greater than filter to the field
   *
   * Shorthand for {@link Condition#greaterThan}.
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  gt(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * Adds a greater than or equal to filter to the field
   *
   * Shorthand for {@link Condition#greaterThanOrEqualTo}.
   *
   * @param field The field to filter
   * @param value The value used to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  ge(field: string, value: number | string | Date | Entity): Filter<T>

  /**
   * The collection must contains one of the given values
   *
   * Adds a contains any filter to the collection field.
   * Alias for {@link Condition#in}.
   *
   * @param field The field to filter
   * @param args The field value or values to filter
   * @return The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  containsAny(field: string, ...args: any[]): Filter<T>

  /**
   * Adds a filter to this query
   *
   * @param field
   * @param filter
   * @param value
   * @return The resulting Query
   */
  addFilter(field: string | null, filter: string | null, value: any): Filter<T>
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Condition: Partial<Condition<any>> = {
  where(this: Condition<any>, conditions) {
    return this.addFilter(null, null, conditions);
  },

  equal(this: Condition<any>, field, value) {
    return this.addFilter(field, null, value);
  },

  notEqual(this: Condition<any>, field, value) {
    return this.addFilter(field, '$ne', value);
  },

  greaterThan(this: Condition<any>, field, value) {
    return this.addFilter(field, '$gt', value);
  },

  greaterThanOrEqualTo(this: Condition<any>, field, value) {
    return this.addFilter(field, '$gte', value);
  },

  lessThan(this: Condition<any>, field, value) {
    return this.addFilter(field, '$lt', value);
  },

  lessThanOrEqualTo(this: Condition<any>, field, value) {
    return this.addFilter(field, '$lte', value);
  },

  between(this: Condition<any>, field, greaterValue, lessValue) {
    return this
      .addFilter(field, '$gt', greaterValue)
      .addFilter(field, '$lt', lessValue);
  },

  in(this: Condition<any>, field: string, ...args: any[]) {
    return this.addFilter(field, '$in', flatArgs(args));
  },

  notIn(this: Condition<any>, field, ...args: any[]) {
    return this.addFilter(field, '$nin', flatArgs(args));
  },

  isNull(this: Condition<any>, field) {
    return this.equal(field, null);
  },

  isNotNull(this: Condition<any>, field) {
    return this.addFilter(field, '$exists', true)
      .addFilter(field, '$ne', null);
  },

  containsAll(this: Condition<any>, field, ...args: any[]) {
    return this.addFilter(field, '$all', flatArgs(args));
  },

  mod(this: Condition<any>, field, divisor, remainder) {
    return this.addFilter(field, '$mod', [divisor, remainder]);
  },

  matches(this: Condition<any>, field, regExp) {
    const reg = regExp instanceof RegExp ? regExp : new RegExp(regExp);

    if (reg.ignoreCase) {
      throw new Error('RegExp.ignoreCase flag is not supported.');
    }

    if (reg.global) {
      throw new Error('RegExp.global flag is not supported.');
    }

    if (reg.source.indexOf('^') !== 0) {
      throw new Error('regExp must be an anchored expression, i.e. it must be started with a ^.');
    }

    const result = this.addFilter(field, '$regex', reg.source);
    if (reg.multiline) {
      result.addFilter(field, '$options', 'm');
    }

    return result;
  },

  size(this: Condition<any>, field, size) {
    return this.addFilter(field, '$size', size);
  },

  near(this: Condition<any>, field, geoPoint, maxDistance) {
    return this.addFilter(field, '$nearSphere', {
      $geometry: {
        type: 'Point',
        coordinates: [geoPoint.longitude, geoPoint.latitude],
      },
      $maxDistance: maxDistance,
    });
  },

  withinPolygon(this: Condition<any>, field, ...args: any[]) {
    const geoPoints = flatArgs(args);
    return this.addFilter(field, '$geoWithin', {
      $geometry: {
        type: 'Polygon',
        coordinates: [geoPoints.map((geoPoint) => [geoPoint.longitude, geoPoint.latitude])],
      },
    });
  },
};

// aliases
Object.assign(Condition, {
  eq: Condition.equal,
  ne: Condition.notEqual,
  lt: Condition.lessThan,
  le: Condition.lessThanOrEqualTo,
  gt: Condition.greaterThan,
  ge: Condition.greaterThanOrEqualTo,
  containsAny: Condition.in,
});
