if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  DB = require('../lib');
}

describe('Test Push Notifications', function() {
  var emf, db;

  var TEST_APNS_DEVICE = "ccc001e53aad739f3b155fbb7c277934604c850d013b509c3d1382fe2c84608b";
  var TEST_GCM_DEVICE = "APA91bFBRJGMI2OkQxhV3peP4ncZOIxGJBJ8s0tkKyWvzQErpZmuSzMzm6ugz3rOauMQ1CRui0bBsEQvuN0W8X1wTP547C6MSNcErnNYXyvc1F5eKZCs-GAtE_NcESolea2AM6_cRe9R";
  var TEST_GCM_APIKEY = "AIzaSyCjswZVNArWwGT8Pb3ZyVYILyWJwzKWUwo";

  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.metamodel.init();
  });

  beforeEach(function() {
    db = emf.createEntityManager();
  });

  it('should register device', function() {
    return Promise.all([db.Device.register("IOS", TEST_APNS_DEVICE), db.Device.register("Android", TEST_GCM_DEVICE)]);
  });

});