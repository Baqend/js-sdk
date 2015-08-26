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

  it('should save registration in cookie', function() {
    return db.Device.register("IOS", TEST_APNS_DEVICE).then(function() {
      return emf.createEntityManager(true).ready();
    }).then(function(newDB) {
      expect(newDB.isDeviceRegistered).be.true;
      expect(newDB.Device.isRegistered).be.true;
    });
  });

  it('should push message', function() {
    return db.login('root', 'root').then(function() {
      return Promise.all([db.Device.register("IOS", TEST_APNS_DEVICE), db.Device.register("Android", TEST_GCM_DEVICE)]);
    }).then(function() {
      return db.Device.find().in("deviceOs", ["Android", "IOS"]).resultList();
    }).then(function(result) {
      expect(result).length.at.least(2);
      var msg = new db.Device.PushMessage(result[0], "Message", "Subject");
      msg.addDevice(result[1]);
      msg.sound = "default";
      msg.badge = 5;
      msg.data = {
        "test": "test"
      };
      return db.Device.push(msg);
    });
  });

  it('should create correct json from push message', function() {
    return db.login('root', 'root').then(function() {
      return Promise.all([db.Device.register("IOS", TEST_APNS_DEVICE), db.Device.register("Android", TEST_GCM_DEVICE)]);
    }).then(function() {
      return db.Device.find().in("deviceOs", ["Android", "IOS"]).resultList();
    }).then(function(result) {
      var msg1 = new db.Device.PushMessage();
      msg1.addDevice(result[0]);
      msg1.addDevice(result[1]);
      msg1.message = "TestMSG";
      msg1.subject = "TestSubject";
      msg1.badge = 5;
      msg1.data = {
        "test": "test"
      };
      msg1.sound = "test";
      var msg2 = new db.Device.PushMessage(result, "TestMSG", "TestSubject", "test", 5, { test: "test" });
      expect(msg2.toJSON()).eql(msg1.toJSON());
    });
  });

});