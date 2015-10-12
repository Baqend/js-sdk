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

  var TEST_GCM_DEVICE = "APA91bFBRJGMI2OkQxhV3peP4ncZOIxGJBJ8s0tkKyWvzQErpZmuSzMzm6ugz3rOauMQ1CRui0bBsEQvuN0W8X1wTP547C6MSNcErnNYXyvc1F5eKZCs-GAtE_NcESolea2AM6_cRe9R";
  var TEST_GCM_APIKEY = "AIzaSyAQvWS3mtqnTfLAA3LjepyQRrqDisVRnE0";

  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    return emf.metamodel.init().then(function() {
      db = emf.createEntityManager();
      return db.login("root", "root");
    }).then(function() {
      var msg = new DB.message.GCMAKey(TEST_GCM_APIKEY);
      return db._send(msg);
    });
  });

  beforeEach(function() {
    db = emf.createEntityManager();
  });

  it('should register device', function() {
    return db.Device.register("Android", TEST_GCM_DEVICE);
  });

  it('should save registration in cookie', function() {
    return db.Device.register("Android", TEST_GCM_DEVICE).then(function() {
      return emf.createEntityManager(true).ready();
    }).then(function(newDB) {
      expect(newDB.isDeviceRegistered).be.true;
      expect(newDB.Device.isRegistered).be.true;
    });
  });

  it('should push message', function() {
    return db.login('root', 'root').then(function() {
      return db.Device.register("Android", TEST_GCM_DEVICE);
    }).then(function() {
      return db.Device.find().equal("deviceOs", "Android").resultList();
    }).then(function(result) {
      expect(result).length.at.least(1);
      var msg = new db.Device.PushMessage(result, "Message", "Subject");
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
      return db.Device.register("Android", TEST_GCM_DEVICE);
    }).then(function() {
      return db.Device.find().equal("deviceOs", "Android").resultList();
    }).then(function(result) {
      var msg1 = new db.Device.PushMessage();
      msg1.addDevice(result[0]);
      msg1.message = "TestMSG";
      msg1.subject = "TestSubject";
      msg1.badge = 5;
      msg1.data = {
        "test": "test"
      };
      msg1.sound = "test";
      var msg2 = new db.Device.PushMessage(result[0], "TestMSG", "TestSubject", "test", 5, { test: "test" });
      expect(msg2.toJSON()).eql(msg1.toJSON());
    });
  });


  it('should not be allowed to insert device', function() {
    var device = new db.Device();
    return expect(device.save()).to.rejected;
  });

});