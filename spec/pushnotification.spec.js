if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Push Notifications', function() {
  var emf, db, lock;

  var TEST_GCM_DEVICE = "APA91bFBRJGMI2OkQxhV3peP4ncZOIxGJBJ8s0tkKyWvzQErpZmuSzMzm6ugz3rOauMQ1CRui0bBsEQvuN0W8X1wTP547C6MSNcErnNYXyvc1F5eKZCs-GAtE_NcESolea2AM6_cRe9R";
  var TEST_GCM_APIKEY = "AIzaSyAQvWS3mtqnTfLAA3LjepyQRrqDisVRnE0";

  before(function() {
    this.timeout(40000);

    var retires = 0;
    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage, staleness: 0 });
    return emf.ready().then(function() {
      if (!emf.metamodel.entity("Lock")) {
        var Lock = new DB.metamodel.EntityType("Lock", emf.metamodel.entity(Object));
        emf.metamodel.addType(Lock);
        return emf.metamodel.save(Lock);
      }
    }).then(function() {
      db = emf.createEntityManager();
      lock = new db.Lock({id: "push"});
      return createLock();
    }).then(function() {
      var msg = new DB.message.GCMAKey(TEST_GCM_APIKEY);
      return emf.send(msg);
    });

    function createLock() {
      return lock.insert().catch(function(e) {
        if (retires++ > 60)
          throw e;
        return helper.sleep(500).then(createLock);
      });
    }
  });

  after(function() {
    return lock.delete();
  });

  beforeEach(function() {
    db = emf.createEntityManager();
    return db.ready();
  });

  it('should register device', function() {
    return db.Device.register("Android", TEST_GCM_DEVICE);
  });

  it('should save registration in cookie', function() {
    return db.Device.register("Android", TEST_GCM_DEVICE).then(function() {
      return new DB.EntityManagerFactory({host: env.TEST_SERVER, staleness: 0}).createEntityManager(true).ready();
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

  it('should remove cookie if device cannot be found', function() {
    return db.Device.register("Android", TEST_GCM_DEVICE).then(function() {
      return new DB.EntityManagerFactory({host: env.TEST_SERVER, staleness: 0}).createEntityManager(true).ready();
    }).then(function(newDB) {
      expect(newDB.isDeviceRegistered).be.true;
      expect(newDB.Device.isRegistered).be.true;
      return db.Device.find().resultList();
    }).then(function(result) {
      expect(result).not.empty;
      return Promise.all(result.map(function(device) {
        return device.delete({ force: true });
      }));
    }).then(function() {
      DB.connector.Connector.connections = {};
      return new DB.EntityManagerFactory({host: env.TEST_SERVER, staleness: 0}).createEntityManager(true).ready();
    }).then(function(newDB) {
      expect(newDB.isDeviceRegistered).be.false;
      expect(newDB.Device.isRegistered).be.false;
    });
  });

});