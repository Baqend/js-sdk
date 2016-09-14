"use strict";

/**
 * Creates a new GeoPoint instance
 * From latitude and longitude
 * From a json object
 * Or an tuple of latitude and longitude
 *
 * @alias GeoPoint
 */
class GeoPoint {

  /**
   * Creates a GeoPoint with the user's current location, if available.
   * @return {Promise<GeoPoint>} A promise that will be resolved with a GeoPoint
   */
  static current() {
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(function(location) {
        resolve(new GeoPoint(location.coords.latitude, location.coords.longitude));
      }, function(error) {
        reject(error);
      });
    });
  }

  /**
   * @param {string|number|Object|Array<number>} [latitude] A coordinate pair (latitude first), a GeoPoint like object or the GeoPoint's latitude
   * @param {number=} longitude The GeoPoint's longitude
   */
  constructor(latitude, longitude) {
    let lat, lng;
    if (Object(latitude) instanceof String) {
      const index = latitude.indexOf(';');
      lat = latitude.substring(0, index);
      lng = latitude.substring(index + 1);
    } else if (Object(latitude) instanceof Number) {
      lat = latitude;
      lng = longitude;
    } else if (Object(latitude) instanceof Array) {
      lat = latitude[0];
      lng = latitude[1];
    } else if (latitude instanceof Object) {
      lat = latitude.latitude;
      lng = latitude.longitude;
    } else {
      lat = 0;
      lng = 0;
    }

    /**
     * Longitude of the given point
     * @type {number}
     */
    this.longitude = lng;

    /**
     * Latitude of the given point
     * @type {number}
     */
    this.latitude = lat;

    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error("Latitude " + this.latitude + " is not in bound of -90 <= latitude <= 90");
    }

    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error("Longitude " + this.longitude + " is not in bound of -180 <= longitude <= 180");
    }
  }

  /**
   * Returns the distance from this GeoPoint to another in kilometers.
   * @param {GeoPoint} point another GeoPoint
   * @return {number} The distance in kilometers
   *
   * @see GeoPoint#radiansTo
   */
  kilometersTo(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_KILOMETERS * this.radiansTo(point)).toFixed(3));
  }

  /**
   * Returns the distance from this GeoPoint to another in miles.
   * @param {GeoPoint} point another GeoPoint
   * @return {number} The distance in miles
   *
   * @see GeoPoint#radiansTo
   */
  milesTo(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_MILES * this.radiansTo(point)).toFixed(3));
  }

  /**
   * Computes the arc, in radian, between two WGS-84 positions.
   *
   * The haversine formula implementation is taken from:
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   *
   * Returns the distance from this GeoPoint to another in radians.
   * @param {GeoPoint} point another GeoPoint
   * @return {number} the arc, in radian, between two WGS-84 positions
   *
   * @see http://en.wikipedia.org/wiki/Haversine_formula
   */
  radiansTo(point) {
    var from = this, to = point;
    var rad1 = from.latitude * GeoPoint.DEG_TO_RAD,
        rad2 = to.latitude * GeoPoint.DEG_TO_RAD,
        dLng = (to.longitude - from.longitude) * GeoPoint.DEG_TO_RAD;

    return Math.acos(Math.sin(rad1) * Math.sin(rad2) + Math.cos(rad1) * Math.cos(rad2) * Math.cos(dLng));
  }

  /**
   * A String representation in latitude, longitude format
   * @return {string} The string representation of this class
   */
  toString() {
    return this.latitude + ';' + this.longitude;
  }

  /**
   * Returns a JSON representation of the GeoPoint
   * @return {json} A GeoJson object of this GeoPoint
   */
  toJSON() {
    return {latitude: this.latitude, longitude: this.longitude};
  }
}

GeoPoint.DEG_TO_RAD = Math.PI/180;

/**
 * The Earth radius in kilometers used by {@link GeoPoint#kilometersTo}
 * @type {number}
 */
GeoPoint.EARTH_RADIUS_IN_KILOMETERS = 6371;

/**
 * The Earth radius in miles used by {@link GeoPoint#milesTo}
 * @type {number}
 */
GeoPoint.EARTH_RADIUS_IN_MILES = 3956;

module.exports = GeoPoint;
