if (typeof module !== 'undefined') {
  require('./node');
}

describe('Test GeoPoint', function () {
  it('should construct with an latitude and longitude argument', function () {
    var point = new DB.GeoPoint(56.5, 165.2);

    expect(point.latitude).equals(56.5);
    expect(point.longitude).equals(165.2);
  });

  it('should construct with an array argument', function () {
    var point = new DB.GeoPoint([-36.5, -92.3]);

    expect(point.latitude).equals(-36.5);
    expect(point.longitude).equals(-92.3);
  });

  it('should construct with an geolike object argument', function () {
    var point = new DB.GeoPoint({ latitude: 90, longitude: -180.0 });

    expect(point.latitude).equals(90);
    expect(point.longitude).equals(-180.0);
  });

  it('should construct from json argument', function () {
    var point1 = new DB.GeoPoint({ latitude: -90, longitude: 180.0 });
    var point2 = new DB.GeoPoint(point1.toJSON());

    expect(point1).eql(point2);
  });

  it('should compute distance', function () {
    var point1 = new DB.GeoPoint(53.5753, 10.0153); // Hamburg
    var point2 = new DB.GeoPoint(40.7143, -74.006); // New York
    var point3 = new DB.GeoPoint(-33.8679, 151.207); // Sydney
    var point4 = new DB.GeoPoint(51.5085, -0.1257); // London

    expect(point1.kilometersTo(point2)).within(6147 * 0.97, 6147 * 1.03);
    expect(point1.milesTo(point2)).within(3819 * 0.97, 3819 * 1.03);
    expect(point3.kilometersTo(point4)).within(16989 * 0.97, 16989 * 1.03);
    expect(point3.milesTo(point4)).within(10556 * 0.97, 10556 * 1.03);
  });
});
