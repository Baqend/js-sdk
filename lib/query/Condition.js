"use strict";

var varargs = require('./Query').varargs;

/**
 * @class query.Condition<T>
 */
var Condition = {};

Object.assign(Condition, /** @lends query.Condition<T>.prototype */ {

  /**
   * An object, that contains filter rules which will be merged with the current filters of this query.
   * @param {json} conditions - Additional filters for this query
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  where(conditions) {
    return this._addFilter(null, null, conditions);
  },

  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  equal(field, value) {
    return this._addFilter(field, null, value);
  },

  /**
   * Adds a not equal filter to the field.
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/ne/
   */
  notEqual(field, value) {
    return this._addFilter(field, "$ne", value);
  },

  /**
   * Adds a greater than filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  greaterThan(field, value) {
    return this._addFilter(field, "$gt", value);
  },

  /**
   * Adds a greater than or equal to filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  greaterThanOrEqualTo(field, value) {
    return this._addFilter(field, "$gte", value);
  },

  /**
   * Adds a less than filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lessThan(field, value) {
    return this._addFilter(field, "$lt", value);
  },

  /**
   * Adds a less than or equal to filter to the field.
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  lessThanOrEqualTo(field, value) {
    return this._addFilter(field, "$lte", value);
  },

  /**
   * Adds a between filter to the field. This is a shorthand for an less than and greater than filter.
   * @param {string} field The field to filter
   * @param {number|string|Date} lessValue The field value must be greater than this value
   * @param {number|string|Date} greaterValue The field value must be less than this value
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  between(field, lessValue, greaterValue) {
    return this._addFilter(field, "$gt", lessValue)
    ._addFilter(field, "$lt", greaterValue);
  },

  /**
   * Adds a in filter to the field. The field value must be equal to one of the given values
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  'in'(field, args) {
    return this._addFilter(field, "$in", varargs(1, arguments));
  },

  /**
   * Adds a in filter to the field. The field value must be equal to one of the given values
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   * @memberOf query.Condition<T>.prototype
   * @name in
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */

  /**
   * Adds a not in filter to the field. The field value must not be equal to any of the given values
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notIn(field, args) {
    return this._addFilter(field, "$nin", varargs(1, arguments));
  },

  /**
   * Adds a null filter to the field. The field value must be null
   * @param {string} field The field to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  isNull(field) {
    return this.equal(field, null);
  },

  /**
   * Adds a not null filter to the field. The field value must not be null
   * @param {string} field The field to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   */
  isNotNull(field) {
    return this._addFilter(field, "$exists", true)
    ._addFilter(field, "$ne", null);
  },

  /**
   * Adds a contains all filter to the collection field. The collection must contain all the given values.
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/all/
   */
  containsAll(field, args) {
    return this._addFilter(field, "$all", varargs(1, arguments));
  },

  /**
   * Adds a modulo filter to the field. The field value divided by divisor must be equal to the remainder.
   * @param {string} field The field to filter
   * @param {number} divisor The divisor of the modulo filter
   * @param {number} remainder The remainder of the modulo filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/mod/
   */
  mod(field, divisor, remainder) {
    return this._addFilter(field, "$mod", [divisor, remainder]);
  },

  /**
   * Adds a regular expression filter to the field. The field value must matches the regular expression.
   * <p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p>
   * @param {string} field The field to filter
   * @param {string|RegExp} regExp The regular expression of the filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/regex/
   */
  matches(field, regExp) {
    if (!(Object(regExp) instanceof RegExp)) {
      regExp = new RegExp(regExp);
    }

    if (regExp.ignoreCase) {
      throw new Error('RegExp.ignoreCase flag is not supported.');
    }

    if (regExp.global) {
      throw new Error('RegExp.global flag is not supported.');
    }

    if (regExp.source.indexOf('^') != 0) {
      throw new Error('regExp must be an anchored expression, i.e. it must be started with a ^.');
    }

    var result = this._addFilter(field, '$regex', regExp.source);
    if (regExp.multiline) {
      result._addFilter(field, '$options', 'm');
    }

    return result;
  },

  /**
   * Adds a size filter to the collection field. The collection must have exactly size members.
   * @param {string} field The field to filter
   * @param {number} size The collections size to filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/size/
   */
  size(field, size) {
    return this._addFilter(field, "$size", size);
  },

  /**
   * Adds a geopoint based near filter to the GeoPoint field. The GeoPoint must be within the maximum distance
   * to the given GeoPoint. Returns from nearest to farthest.
   * @param {string} field The field to filter
   * @param {GeoPoint} geoPoint The GeoPoint to filter
   * @param {number} maxDistance Tha maximum distance to filter in meters
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nearSphere/
   */
  near(field, geoPoint, maxDistance) {
    return this._addFilter(field, "$nearSphere", {
      $geometry: {
        type: "Point",
        coordinates: [geoPoint.longitude, geoPoint.latitude]
      },
      $maxDistance: maxDistance
    });
  },

  /**
   * Adds a GeoPoint based polygon filter to the GeoPoint field. The GeoPoint must be contained within the polygon.
   * @param {string} field The field to filter
   * @param {...(GeoPoint|Array<GeoPoint>)} geoPoints The geoPoints that describes the polygon of the filter
   * @return {query.Filter<T>} The resulting Query
   * @instance
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/geoWithin/
   */
  withinPolygon(field, geoPoints) {
    geoPoints = varargs(1, arguments);
    return this._addFilter(field, "$geoWithin", {
      $geometry: {
        type: "Polygon",
        coordinates: [geoPoints.map(function(geoPoint) {
          return [geoPoint.longitude, geoPoint.latitude];
        })]
      }
    });
  }
});

// aliases
Object.assign(Condition, /** @lends query.Condition<T>.prototype */ {
  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @method
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   */
  eq: Condition.equal,

  /**
   * Adds a not equal filter to the field.
   * @method
   * @param {string} field The field to filter
   * @param {*} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/ne/
   */
  ne: Condition.notEqual,

  /**
   * Adds a less than filter to the field. Shorthand for {@link query.Condition#lessThan}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lt: Condition.lessThan,

  /**
   * Adds a less than or equal to filter to the field. Shorthand for {@link query.Condition#lessThanOrEqualTo}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  le: Condition.lessThanOrEqualTo,

  /**
   * Adds a greater than filter to the field. Shorthand for {@link query.Condition#greaterThan}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  gt: Condition.greaterThan,

  /**
   * Adds a greater than or equal to filter to the field. Shorthand for {@link query.Condition#greaterThanOrEqualTo}.
   * @method
   * @param {string} field The field to filter
   * @param {number|string|Date} value The value used to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  ge: Condition.greaterThanOrEqualTo,

  /**
   * Adds a contains any filter to the collection field. The collection must contains one the given values.
   * Alias for {@link query.Condition#in}
   * @method
   * @param {string} field The field to filter
   * @param {...(*|Array<*>)} args The field value or values to filter
   * @return {query.Filter<T>} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  containsAny: Condition.in
});

module.exports = Condition;
