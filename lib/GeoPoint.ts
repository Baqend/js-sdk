'use strict';

import { JsonMap } from "./util";

/**
 * Creates a new GeoPoint instance
 * From latitude and longitude
 * From a json object
 * Or an tuple of latitude and longitude
 */
export class GeoPoint {
  /**
   * How many radians fit in one degree.
   * @type {number}
   */
  static DEG_TO_RAD = Math.PI / 180;

  /**
   * The Earth radius in kilometers used by {@link GeoPoint#kilometersTo}
   * @type {number}
   */
  static EARTH_RADIUS_IN_KILOMETERS = 6371;

  /**
   * The Earth radius in miles used by {@link GeoPoint#milesTo}
   * @type {number}
   */
  static EARTH_RADIUS_IN_MILES = 3956;

  /**
   * Longitude of the given point
   */
  public longitude: number;

  /**
   * Latitude of the given point
   */
  public latitude: number;

  /**
   * Creates a GeoPoint with the user's current location, if available.
   * @return {Promise<GeoPoint>} A promise that will be resolved with a GeoPoint
   */
  static current() {
    return new Promise(((resolve, reject) => {
      if (!navigator) {
        reject(new Error('This seems not to be a browser context.'));
      }
      if (!navigator.geolocation) {
        reject(new Error('This browser does not support geolocation.'));
      }

      navigator.geolocation.getCurrentPosition((location) => {
        resolve(new GeoPoint(location.coords.latitude, location.coords.longitude));
      }, (error) => {
        reject(error);
      });
    }));
  }

  /**
   * @param latitude A coordinate pair (latitude first),
   * a GeoPoint like object or the GeoPoint's latitude
   * @param longitude The GeoPoint's longitude
   */
  constructor(latitude?: number | string | { latitude: number, longitude: number } | [number, number], longitude?: number) {
    let lat: number;
    let lng: number;
    if (typeof latitude === 'string') {
      const index = latitude.indexOf(';');
      lat = Number(latitude.substring(0, index));
      lng = Number(latitude.substring(index + 1));
    } else if (Array.isArray(latitude)) {
      lat = latitude[0];
      lng = latitude[1];
    } else if (typeof latitude === 'object') {
      lat = latitude.latitude;
      lng = latitude.longitude;
    } else {
      lat = typeof latitude === 'number' ? latitude : 0;
      lng = typeof longitude === 'number' ? longitude: 0;
    }

    this.longitude = lng;
    this.latitude = lat;

    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error('Latitude ' + this.latitude + ' is not in bound of -90 <= latitude <= 90');
    }

    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error('Longitude ' + this.longitude + ' is not in bound of -180 <= longitude <= 180');
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
    const from = this;
    const to = point;
    const rad1 = from.latitude * GeoPoint.DEG_TO_RAD;
    const rad2 = to.latitude * GeoPoint.DEG_TO_RAD;
    const dLng = (to.longitude - from.longitude) * GeoPoint.DEG_TO_RAD;

    return Math.acos((Math.sin(rad1) * Math.sin(rad2)) + (Math.cos(rad1) * Math.cos(rad2) * Math.cos(dLng)));
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
   * @return A GeoJson object of this GeoPoint
   */
  toJSON(): JsonMap {
    return { latitude: this.latitude, longitude: this.longitude };
  }
}