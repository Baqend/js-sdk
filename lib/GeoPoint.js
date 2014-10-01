var collection = require('./collection');
var promise = require('q');
var GeoPoint;

/**
 * @class jspa.GeoPoint
 */
exports.GeoPoint = GeoPoint = Object.inherit(/** @lends jspa.GeoPoint.prototype */ {

  /** @lends jspa.GeoPoint */
  extend: {
    DEG_TO_RAD: Math.PI/180,
    /**
     * @type {Number} The Earth radius in kilometers used by {@link jspa.GeoPoint#kilometersTo}
     */
    EARTH_RADIUS_IN_KILOMETERS: 6371,
    /**
     * @type {Number} The Earth radius in miles used by {@link jspa.GeoPoint#milesTo}
     */
    EARTH_RADIUS_IN_MILES: 3956,

    /**
     * Creates a GeoPoint with the user's current location, if available.
     * @return {Q.Promise<jspa.GeoPoint>} A promise that will be resolved with a GeoPoint
     */
    current: function() {
      var deferred = Q.defer();

      navigator.geolocation.getCurrentPosition(function(location) {
        deferred.resolve(new GeoPoint(location.coords.latitude, location.coords.longitude));
      }, function(error) {
        deferred.reject(error);
      });

      return deferred.promise;
    },

    conv: function(param) {
      return new this(param);
    }
  },

  latitude: 0,
  longitude: 0,

  /**
   * Creates a new GeoPoint instance
   * From latitude and longitude
   * From a json object
   * Or an tuple of latitude and longitude
   *
   * @param {String|Number|Object|Array=} latitude The geopoints latitude
   * @param {Number=} longitude
   */
  initialize: function(latitude, longitude) {
    if (String.isInstance(latitude)) {
      var index = latitude.indexOf(';');
      this.latitude = latitude.substring(0, index);
      this.longitude = latitude.substring(index + 1);
    } else if (Number.isInstance(latitude)) {
      this.latitude = latitude;
      this.longitude = longitude;
    } else if (Array.isInstance(latitude)) {
      this.latitude = latitude[0];
      this.longitude = latitude[1];
    } else if (Object.isInstance(latitude)) {
      this.latitude = latitude.latitude;
      this.longitude = latitude.longitude;
    }

    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error("Latitude " + this.latitude + " is not in bound of -90 <= latitude <= 90");
    }

    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error("Longitude " + this.longitude + " is not in bound of -180 <= longitude <= 180");
    }
  },

  /**
   * Returns the distance from this GeoPoint to another in kilometers.
   * @param {jspa.GeoPoint} point another GeoPoint
   * @return {Number} The distance in kilometers
   *
   * @see jspa.GeoPoint#radiansTo
   */
  kilometersTo: function(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_KILOMETERS * this.radiansTo(point)).toFixed(3));
  },

  /**
   * Returns the distance from this GeoPoint to another in miles.
   * @param {jspa.GeoPoint} point another GeoPoint
   * @return {Number} The distance in miles
   *
   * @see jspa.GeoPoint#radiansTo
   */
  milesTo: function(point) {
    return Number((GeoPoint.EARTH_RADIUS_IN_MILES * this.radiansTo(point)).toFixed(3));
  },

  /**
   * Computes the arc, in radian, between two WGS-84 positions.
   *
   * The haversine formula implementation is taken from:
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   *
   * Returns the distance from this GeoPoint to another in radians.
   * @param {jspa.GeoPoint} point another GeoPoint
   * @return {Number} the arc, in radian, between two WGS-84 positions
   *
   * @see http://en.wikipedia.org/wiki/Haversine_formula
   */
  radiansTo: function(point) {
    var from = this, to = point;
    var rad1 = from.latitude * GeoPoint.DEG_TO_RAD,
        rad2 = to.latitude * GeoPoint.DEG_TO_RAD,
        dLng = (to.longitude - from.longitude) * GeoPoint.DEG_TO_RAD;

    return Math.acos(Math.sin(rad1) * Math.sin(rad2) + Math.cos(rad1) * Math.cos(rad2) * Math.cos(dLng));
  },

  /**
   * A String representation in latitude, longitude format
   * @return {String} The string representation of this class
   */
  toString: function() {
    return this.latitude + ';' + this.longitude;
  },

  /**
   * Returns a JSON representation of the GeoPoint
   * @return {Object} A GeoJson object of this GeoPoint
   */
  toJSON: function() {
    return {latitude: this.latitude, longitude: this.longitude};
  }
});
